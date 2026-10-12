/**
 * DOLLARADDICT payment and download API — Cloudflare Workers + D1 + R2.
 * Required secrets/vars are documented in README.md. Never put Daraja secrets in frontend files.
 */
const PRICE_KES = 2000;
const PRODUCT_OBJECT_KEY = 'DOLLARADDICT_CRT_GOLD.ex5';
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const corsHeaders = origin => ({ 'access-control-allow-origin': origin || 'null', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'Content-Type,Authorization', 'vary': 'Origin' });
function corsOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : '';
}
function normalizeKenyanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^0[17]\d{8}$/.test(digits)) return '254' + digits.slice(1);
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^[17]\d{8}$/.test(digits)) return '254' + digits;
  return null;
}
function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
}
function randomHex(bytes = 24) { const a = new Uint8Array(bytes); crypto.getRandomValues(a); return [...a].map(x => x.toString(16).padStart(2,'0')).join(''); }
async function sha256(value) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2,'0')).join(''); }
async function darajaToken(env) {
  const base = (env.DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke').replace(/\/$/, '');
  const auth = btoa(`${env.DARAJA_CONSUMER_KEY}:${env.DARAJA_CONSUMER_SECRET}`);
  const r = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
  const d = await r.json();
  if (!r.ok || !d.access_token) throw new Error('Could not authenticate with Daraja. Check backend credentials and environment.');
  return { token: d.access_token, base };
}
async function stkQuery(env, checkoutRequestId) {
  const { token, base } = await darajaToken(env);
  const ts = timestamp(), password = btoa(`${env.DARAJA_SHORTCODE}${env.DARAJA_PASSKEY}${ts}`);
  const r = await fetch(`${base}/mpesa/stkpushquery/v1/query`, { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body:JSON.stringify({BusinessShortCode:env.DARAJA_SHORTCODE,Password:password,Timestamp:ts,CheckoutRequestID:checkoutRequestId}) });
  const d = await r.json().catch(()=>({}));
  return { ok:r.ok, data:d };
}
async function initiateStk(env, phone, orderId) {
  const { token, base } = await darajaToken(env);
  const ts = timestamp(), password = btoa(`${env.DARAJA_SHORTCODE}${env.DARAJA_PASSKEY}${ts}`);
  const payload = { BusinessShortCode:env.DARAJA_SHORTCODE,Password:password,Timestamp:ts,TransactionType:env.DARAJA_TRANSACTION_TYPE || 'CustomerPayBillOnline',Amount:PRICE_KES,PartyA:phone,PartyB:env.DARAJA_SHORTCODE,PhoneNumber:phone,CallBackURL:env.DARAJA_CALLBACK_URL,AccountReference:orderId.slice(0,12),TransactionDesc:'DOLLARADDICT CRT Gold EA' };
  const r = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body:JSON.stringify(payload) });
  const d = await r.json().catch(()=>({}));
  if (!r.ok || d.ResponseCode !== '0' || !d.CheckoutRequestID) throw new Error(d.errorMessage || d.ResponseDescription || 'Daraja rejected the STK Push request.');
  return d;
}
async function verifyAndGrantPaid(env, orderId, checkoutRequestId) {
  const query = await stkQuery(env, checkoutRequestId).catch(() => ({ok:false,data:{}}));
  const q = query.data || {};
  if (!query.ok || String(q.ResultCode) !== '0') return false;
  const licenseKey = `DA-${randomHex(4).toUpperCase()}-${randomHex(4).toUpperCase()}-${randomHex(4).toUpperCase()}`;
  const updated = await env.DB.prepare("UPDATE orders SET status='paid',result_description='Payment independently confirmed by Daraja',license_key=?,updated_at=datetime('now') WHERE order_id=? AND status='pending'").bind(licenseKey,orderId).run();
  if (updated.meta?.changes) await env.DB.prepare('INSERT OR IGNORE INTO licenses (license_key,order_id,active) VALUES (?,?,1)').bind(licenseKey,orderId).run();
  return true;
}
async function handleCallback(request, env) {
  const body = await request.json().catch(()=>null);
  const callback = body?.Body?.stkCallback;
  if (!callback?.CheckoutRequestID) return json({ ResultCode: 1, ResultDesc: 'Invalid callback payload' });
  const order = await env.DB.prepare('SELECT order_id,status FROM orders WHERE checkout_request_id = ?').bind(callback.CheckoutRequestID).first();
  if (!order) return json({ ResultCode: 0, ResultDesc: 'Callback acknowledged' });
  if (order.status === 'paid') return json({ ResultCode: 0, ResultDesc: 'Already processed' });
  const callbackSaysPaid = Number(callback.ResultCode) === 0;
  let receipt = null;
  if (callbackSaysPaid) {
    // Independently query Daraja before granting access; a callback alone never delivers the EA.
    const metadata = callback.CallbackMetadata?.Item || [];
    receipt = metadata.find(x => x.Name === 'MpesaReceiptNumber')?.Value || null;
    const granted = await verifyAndGrantPaid(env, order.order_id, callback.CheckoutRequestID);
    if (granted && receipt) await env.DB.prepare("UPDATE orders SET mpesa_receipt=? WHERE order_id=?").bind(receipt,order.order_id).run();
    if (!granted) await env.DB.prepare("UPDATE orders SET result_description=?,updated_at=datetime('now') WHERE order_id=? AND status='pending'").bind('Callback received; independent Daraja verification is pending and will be retried when status is checked.',order.order_id).run();
  } else {
    await env.DB.prepare("UPDATE orders SET status='failed',result_description=?,updated_at=datetime('now') WHERE order_id=? AND status='pending'").bind(String(callback.ResultDesc || 'Payment was not completed').slice(0,300),order.order_id).run();
  }
  return json({ ResultCode: 0, ResultDesc: 'Callback acknowledged' });
}
async function route(request, env) {
  const url = new URL(request.url), path = url.pathname;
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:corsHeaders(corsOrigin(request,env))});
  if (path === '/api/mpesa/callback' && request.method === 'POST') return handleCallback(request,env);
  if (path === '/api/health' && request.method === 'GET') return json({ok:true,service:'DOLLARADDICT payments',configured:Boolean(env.DB && env.BOT_BUCKET && env.DARAJA_CONSUMER_KEY && env.DARAJA_CONSUMER_SECRET && env.DARAJA_PASSKEY && env.DARAJA_SHORTCODE && env.DARAJA_CALLBACK_URL)});
  const origin = corsOrigin(request,env);
  if (request.headers.get('Origin') && !origin) return json({error:'Origin not allowed.'},403);
  if (path === '/api/checkout' && request.method === 'POST') {
    try {
      const body = await request.json(), phone = normalizeKenyanPhone(body.phone), name = String(body.name || '').trim().slice(0,100);
      if (!phone) return json({error:'Enter a valid Kenyan Safaricom number, e.g. 0712345678.'},400,corsHeaders(origin));
      const orderId = crypto.randomUUID(), checkoutToken = randomHex(32), tokenHash = await sha256(checkoutToken);
      await env.DB.prepare("INSERT INTO orders (order_id,buyer_name,phone,amount,status,checkout_token_hash) VALUES (?,?,?,?,'pending',?)").bind(orderId,name,phone,PRICE_KES,tokenHash).run();
      let stk;
      try { stk = await initiateStk(env,phone,orderId); }
      catch (e) { await env.DB.prepare("UPDATE orders SET status='failed',result_description=?,updated_at=datetime('now') WHERE order_id=?").bind(String(e.message||'Daraja error').slice(0,300),orderId).run(); throw e; }
      await env.DB.prepare('UPDATE orders SET checkout_request_id=?,merchant_request_id=?,updated_at=datetime(\'now\') WHERE order_id=?').bind(stk.CheckoutRequestID,stk.MerchantRequestID||null,orderId).run();
      return json({orderId,checkoutToken,customerMessage:stk.CustomerMessage||'STK Push sent. Complete the prompt on your phone.'},200,corsHeaders(origin));
    } catch(e) { return json({error:e.message||'Could not initiate M-PESA payment.'},502,corsHeaders(origin)); }
  }
  if (path === '/api/order-status' && request.method === 'GET') {
    const orderId=url.searchParams.get('orderId')||'', auth=request.headers.get('Authorization')||'', supplied=auth.startsWith('Bearer ')?auth.slice(7):'';
    if (!orderId||!supplied) return json({error:'Missing order reference or checkout token.'},400,corsHeaders(origin));
    const order=await env.DB.prepare('SELECT status,checkout_token_hash,license_key,result_description,checkout_request_id FROM orders WHERE order_id=?').bind(orderId).first();
    if (!order) return json({error:'Invalid checkout credentials.'},403,corsHeaders(origin));
    if (await sha256(supplied) !== order.checkout_token_hash) return json({error:'Invalid checkout credentials.'},403,corsHeaders(origin));
    if (order.status === 'pending' && order.checkout_request_id) await verifyAndGrantPaid(env,orderId,order.checkout_request_id).catch(()=>false);
    const latest=await env.DB.prepare('SELECT status,license_key,result_description FROM orders WHERE order_id=?').bind(orderId).first();
    return json({status:latest.status,licenseKey:latest.status==='paid'?latest.license_key:null,message:latest.result_description},200,corsHeaders(origin));
  }
  if (path === '/api/download' && request.method === 'GET') {
    const license = url.searchParams.get('license') || '';
    if (!/^DA-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/.test(license)) return new Response('Valid license required.',{status:403});
    const row=await env.DB.prepare("SELECT l.active,o.status FROM licenses l JOIN orders o ON o.order_id=l.order_id WHERE l.license_key=?").bind(license).first();
    if (!row || row.active !== 1 || row.status !== 'paid') return new Response('License is not active.',{status:403});
    const object=await env.BOT_BUCKET.get(PRODUCT_OBJECT_KEY);
    if (!object) return new Response('The compiled EA file has not been uploaded to private storage yet. Contact support.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    const headers=new Headers();object.writeHttpMetadata(headers);headers.set('Content-Type','application/octet-stream');headers.set('Content-Disposition','attachment; filename="DOLLARADDICT_CRT_GOLD.ex5"');headers.set('Cache-Control','no-store');return new Response(object.body,{headers});
  }
  return json({error:'Not found.'},404,corsHeaders(origin));
}
export default { async fetch(request,env) { try { return await route(request,env); } catch(e) { console.error('DOLLARADDICT API error:',e.message); return json({error:'Unexpected server error.'},500); } } };
