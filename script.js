/* DollarAddict app interactions, trading journal, statistics and contact */
'use strict';

const $ = (id) => document.getElementById(id);
const safeJSON = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };

// Mobile navigation
const mobileMenu = $('mobile-menu');
const navLinks = document.querySelector('.nav-links');
if (mobileMenu && navLinks) {
  mobileMenu.addEventListener('click', () => {
    const expanded = navLinks.classList.toggle('active');
    mobileMenu.setAttribute('aria-expanded', String(expanded));
  });
  document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    mobileMenu.setAttribute('aria-expanded', 'false');
  }));
}

// Decorative candlestick canvas
const canvas = $('bg-canvas');
if (canvas && canvas.getContext) {
  const ctx = canvas.getContext('2d');
  let candles = [];
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    candles = Array.from({length: Math.min(35, Math.floor(window.innerWidth / 45))}, (_, i) => ({
      x: i * 55 + Math.random() * 35, y: Math.random() * canvas.height,
      h: 20 + Math.random() * 60, green: Math.random() > .45, speed: .2 + Math.random() * .4
    }));
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    candles.forEach(c => {
      c.x -= c.speed;
      if (c.x < -20) { c.x = canvas.width + 20; c.y = Math.random() * canvas.height; c.green = Math.random() > .45; }
      ctx.strokeStyle = c.green ? '#00ff88' : '#ff2a2a';
      ctx.fillStyle = c.green ? 'rgba(0,255,136,.24)' : 'rgba(255,42,42,.24)';
      ctx.beginPath(); ctx.moveTo(c.x, c.y - c.h / 2 - 10); ctx.lineTo(c.x, c.y + c.h / 2 + 10); ctx.stroke();
      ctx.fillRect(c.x - 4, c.y - c.h / 2, 8, c.h);
    });
    requestAnimationFrame(animate);
  }
  resizeCanvas(); window.addEventListener('resize', resizeCanvas); animate();
}

// Live chart selector: TradingView hosts the actual chart and data.
function updateChart() {
  const symbol = $('chart-symbol')?.value || 'OANDA:XAUUSD';
  const interval = $('chart-timeframe')?.value || '60';
  const frame = $('tradingview-chart');
  if (frame) {
    const params = new URLSearchParams({
      frameElementId: 'tradingview_chart', symbol, interval, hidesidetoolbar: '0',
      symboledit: '1', saveimage: '0', toolbarbg: '0b0b0b', theme: 'dark',
      style: '1', timezone: 'Etc/UTC', withdateranges: '1', hideideas: '1'
    });
    frame.src = 'https://www.tradingview.com/widgetembed/?' + params.toString();
  }
}
$('chart-symbol')?.addEventListener('change', updateChart);
$('chart-timeframe')?.addEventListener('change', updateChart);

// The old quote table used random simulated values. Do not label synthetic prices as live.
// TradingView's embedded chart above provides market data; this table links users to it.
const tableBody = $('forex-table-body');
if (tableBody) {
  const watchlist = [
    ['Gold (XAUUSD)', 'OANDA:XAUUSD'], ['EUR/USD', 'FX:EURUSD'],
    ['GBP/USD', 'FX:GBPUSD'], ['BTC/USD', 'COINBASE:BTCUSD']
  ];
  tableBody.innerHTML = watchlist.map(([name, symbol]) =>
    `<tr><td><strong>${name}</strong></td><td colspan="3">Open chart for current provider data</td><td><a href="https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}" target="_blank" rel="noopener noreferrer">View ↗</a></td></tr>`
  ).join('');
  const heading = tableBody.closest('section')?.querySelector('.section-subtitle');
  if (heading) heading.textContent = 'Select View to open the instrument chart. Live quotes are supplied by TradingView, not simulated here.';
}

// World clocks with timezone-aware DST handling.
function updateClocks() {
  const sessions = [
    {key:'asia', zone:'Asia/Tokyo', open:9, close:18},
    {key:'london', zone:'Europe/London', open:8, close:17},
    {key:'newyork', zone:'America/New_York', open:8, close:17}
  ];
  sessions.forEach(s => {
    const clock = $('clock-' + s.key), status = $('status-' + s.key);
    if (!clock || !status) return;
    const now = new Date();
    clock.textContent = new Intl.DateTimeFormat('en-GB', {
      timeZone:s.zone, hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
    }).format(now);
    const hour = Number(new Intl.DateTimeFormat('en-GB', {timeZone:s.zone, hour:'2-digit', hourCycle:'h23'}).format(now));
    const isOpen = hour >= s.open && hour < s.close && now.getUTCDay() !== 0 && now.getUTCDay() !== 6;
    status.textContent = isOpen ? 'OPEN (indicative)' : 'CLOSED (indicative)';
    status.className = 'session-status ' + (isOpen ? 'status-open' : 'status-closed');
  });
}
updateClocks(); setInterval(updateClocks, 1000);

// PWA install flow (safe if the optional panel is absent).
let deferredInstallPrompt = null;
const installPanel = $('pwa-install-container'), installBtn = $('pwa-install-btn');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); deferredInstallPrompt = event;
  if (installPanel) installPanel.style.display = 'block';
});
if (installBtn) installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) {
    alert('If installation is available, use your browser menu and choose Install app or Add to Home Screen.');
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  if (installPanel) installPanel.style.display = 'none';
});
window.addEventListener('appinstalled', () => { if (installPanel) installPanel.style.display = 'none'; });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(err => console.warn('Service worker registration failed', err)));
}

// Trading journal: browser-local storage, never synced to a server.
const STORAGE_KEY = 'dollaraddict.trades.v1';
let trades = safeJSON(localStorage.getItem(STORAGE_KEY), []);
if (!Array.isArray(trades)) trades = [];
const today = new Date();
if ($('trade-date')) $('trade-date').value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
const tradeForm = $('trade-form');
const formStatus = $('trade-form-status');
const fmt = n => Number(n || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
const outcome = trade => Number(trade.result) > 0 ? 'win' : Number(trade.result) < 0 ? 'loss' : 'breakeven';
function persistTrades() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); return true; }
  catch { if (formStatus) formStatus.textContent = 'Could not save. Browser storage may be full or disabled.'; return false; }
}
function getFilteredTrades() {
  const from = $('filter-from')?.value || '', to = $('filter-to')?.value || '';
  const instrument = $('filter-instrument')?.value || '', result = $('filter-result')?.value || '';
  return trades.filter(t => (!from || t.date >= from) && (!to || t.date <= to) &&
    (!instrument || t.instrument === instrument) && (!result || outcome(t) === result))
    .sort((a,b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}
function renderJournal() {
  const body = $('journal-table-body'); if (!body) return;
  const rows = getFilteredTrades();
  body.innerHTML = rows.map(t => `<tr>
    <td>${escapeHTML(t.date)}</td><td>${escapeHTML(t.instrument)}</td><td>${escapeHTML(t.direction)}</td>
    <td>${fmt(t.entry)}</td><td>${fmt(t.exit)}</td><td>${fmt(t.lots)}</td>
    <td class="${Number(t.result)>0?'trend-up':Number(t.result)<0?'trend-down':''}">${fmt(t.result)}</td>
    <td>${escapeHTML(t.strategy || '—')}${t.notes ? `<div class="trade-note">${escapeHTML(t.notes)}</div>` : ''}</td>
    <td class="action-cell"><button class="mini-btn" data-edit="${t.id}" type="button">Edit</button> <button class="mini-btn danger" data-delete="${t.id}" type="button">Delete</button></td>
  </tr>`).join('');
  if ($('journal-empty')) $('journal-empty').hidden = rows.length > 0;
  renderStatistics(rows);
}
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
tradeForm?.addEventListener('submit', event => {
  event.preventDefault();
  const id = $('trade-id').value;
  const existing = trades.find(t => t.id === id);
  const trade = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
    createdAt: existing?.createdAt || Date.now(),
    date: $('trade-date').value, instrument: $('trade-instrument').value,
    direction: $('trade-direction').value, entry: Number($('trade-entry').value),
    exit: Number($('trade-exit').value), lots: Number($('trade-lots').value),
    sl: $('trade-sl').value ? Number($('trade-sl').value) : null,
    tp: $('trade-tp').value ? Number($('trade-tp').value) : null,
    result: Number($('trade-result').value), strategy: $('trade-strategy').value.trim(),
    notes: $('trade-notes').value.trim()
  };
  if (!trade.date || !Number.isFinite(trade.result) || trade.entry < 0 || trade.exit < 0 || trade.lots <= 0) {
    formStatus.textContent = 'Check the date, prices, lot size and result.'; return;
  }
  if (existing) trades = trades.map(t => t.id === id ? trade : t); else trades.push(trade);
  if (persistTrades()) {
    tradeForm.reset(); $('trade-id').value = ''; $('trade-lots').value = '0.01';
    $('trade-date').value = trade.date; $('trade-submit').textContent = 'Save Trade';
    $('trade-cancel').hidden = true; formStatus.textContent = existing ? 'Trade updated.' : 'Trade saved on this device.';
    renderJournal();
  }
});
$('trade-cancel')?.addEventListener('click', () => {
  tradeForm.reset(); $('trade-id').value = ''; $('trade-lots').value = '0.01';
  $('trade-date').value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  $('trade-submit').textContent = 'Save Trade'; $('trade-cancel').hidden = true; formStatus.textContent = '';
});
$('journal-table-body')?.addEventListener('click', event => {
  const editBtn = event.target.closest('[data-edit]'), deleteBtn = event.target.closest('[data-delete]');
  if (editBtn) {
    const t = trades.find(item => item.id === editBtn.dataset.edit); if (!t) return;
    $('trade-id').value=t.id; $('trade-date').value=t.date; $('trade-instrument').value=t.instrument;
    $('trade-direction').value=t.direction; $('trade-entry').value=t.entry; $('trade-exit').value=t.exit;
    $('trade-lots').value=t.lots; $('trade-sl').value=t.sl ?? ''; $('trade-tp').value=t.tp ?? '';
    $('trade-result').value=t.result; $('trade-strategy').value=t.strategy; $('trade-notes').value=t.notes;
    $('trade-submit').textContent='Update Trade'; $('trade-cancel').hidden=false;
    tradeForm.scrollIntoView({behavior:'smooth',block:'start'});
  }
  if (deleteBtn) {
    const t = trades.find(item => item.id === deleteBtn.dataset.delete);
    if (t && confirm(`Delete the ${t.instrument} trade from ${t.date}? This cannot be undone.`)) {
      trades = trades.filter(item => item.id !== t.id); persistTrades(); renderJournal();
    }
  }
});
['filter-from','filter-to','filter-instrument','filter-result'].forEach(id => $(id)?.addEventListener('change', renderJournal));
$('clear-filters')?.addEventListener('click', () => {
  ['filter-from','filter-to','filter-instrument','filter-result'].forEach(id => { if ($(id)) $(id).value=''; });
  renderJournal();
});

function drawChart(canvasId, values, labels, options={}) {
  const el = $(canvasId); if (!el) return;
  const rect = el.getBoundingClientRect(), width = Math.max(280, rect.width || 500), height = 220, dpr = window.devicePixelRatio || 1;
  el.width = width*dpr; el.height=height*dpr; el.style.height=height+'px';
  const c = el.getContext('2d'); c.scale(dpr,dpr); c.clearRect(0,0,width,height);
  const pad={l:42,r:12,t:18,b:32}, plotW=width-pad.l-pad.r, plotH=height-pad.t-pad.b;
  const nums=values.length ? values : [0], min=Math.min(0,...nums), max=Math.max(0,...nums), range=(max-min)||1;
  c.font='11px sans-serif'; c.strokeStyle='#293342'; c.fillStyle='#9ca9bb'; c.lineWidth=1;
  for(let i=0;i<5;i++){const y=pad.t+plotH*i/4;c.beginPath();c.moveTo(pad.l,y);c.lineTo(width-pad.r,y);c.stroke();c.fillText(fmt(max-range*i/4),2,y+4);}
  if (!values.length) { c.fillText('Record trades to display performance',pad.l+8,pad.t+plotH/2); return; }
  const xAt=i=>pad.l+(values.length===1?plotW/2:i*plotW/(values.length-1));
  const yAt=v=>pad.t+(max-v)/range*plotH;
  c.strokeStyle='#00d7ff'; c.lineWidth=2; c.beginPath();
  values.forEach((v,i)=>i===0?c.moveTo(xAt(i),yAt(v)):c.lineTo(xAt(i),yAt(v))); c.stroke();
  c.fillStyle='#d7e4f5';
  [0,Math.floor((labels.length-1)/2),labels.length-1].filter((v,i,a)=>a.indexOf(v)===i).forEach(i=>{
    const label=String(labels[i]||'').slice(5); c.fillText(label,xAt(i)-14,height-9);
  });
}
function renderStatistics(rows) {
  const total=rows.length, wins=rows.filter(t=>Number(t.result)>0).length, losses=rows.filter(t=>Number(t.result)<0).length;
  const net=rows.reduce((s,t)=>s+Number(t.result||0),0), avg=total?net/total:0;
  const grossWin=rows.reduce((s,t)=>s+Math.max(0,Number(t.result||0)),0);
  const grossLoss=Math.abs(rows.reduce((s,t)=>s+Math.min(0,Number(t.result||0)),0));
  $('stat-total').textContent=total; $('stat-wins-losses').textContent=`${wins} / ${losses}`;
  $('stat-win-rate').textContent=(total?wins/total*100:0).toFixed(1)+'%';
  $('stat-net').textContent=fmt(net); $('stat-net').className=net>0?'trend-up':net<0?'trend-down':'';
  $('stat-average').textContent=fmt(avg); $('stat-profit-factor').textContent=grossLoss? (grossWin/grossLoss).toFixed(2):(grossWin?'∞':'—');
  let cumulative=0; const equity=rows.map(t=>cumulative+=Number(t.result||0));
  drawChart('equity-chart',equity,rows.map(t=>t.date));
  const dailyMap={}; rows.forEach(t=>dailyMap[t.date]=(dailyMap[t.date]||0)+Number(t.result||0));
  const daily=Object.keys(dailyMap).sort().map(date=>({date,result:dailyMap[date]}));
  drawChart('daily-chart',daily.map(d=>d.result),daily.map(d=>d.date));
  const groups=new Map();
  rows.forEach(t=>[['Instrument',t.instrument||'Other'],['Strategy',t.strategy||'Unspecified']].forEach(([type,key])=>{
    const group=type+': '+key; if(!groups.has(group)) groups.set(group,{name:group,count:0,wins:0,net:0});
    const g=groups.get(group);g.count++;g.wins+=Number(t.result)>0?1:0;g.net+=Number(t.result||0);
  }));
  $('breakdown-table-body').innerHTML=[...groups.values()].map(g=>`<tr><td>${escapeHTML(g.name)}</td><td>${g.count}</td><td>${g.wins}</td><td class="${g.net>0?'trend-up':g.net<0?'trend-down':''}">${fmt(g.net)}</td><td>${(g.wins/g.count*100).toFixed(1)}%</td></tr>`).join('');
}
renderJournal();
window.addEventListener('resize', () => renderStatistics(getFilteredTrades()));

// Contact form. FormSubmit needs a one-time recipient verification on first use.
// If service fails, create a pre-addressed draft so the visitor can still contact the owner.
const contactForm = $('contact-form');
contactForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const status = $('contact-status'), button = $('contact-submit');
  const name=$('contact-name').value.trim(), email=$('contact-email').value.trim();
  const subject=$('contact-subject').value.trim(), message=$('contact-message').value.trim();
  if (!name || !email || !subject || !message) { status.textContent='Please complete all fields.'; return; }
  status.textContent='Sending your message…'; button.disabled=true;
  const payload={name,email,subject,message,_subject:`DollarAddict website: ${subject}`,_template:'table',_captcha:'true'};
  try {
    const response=await fetch('https://formsubmit.co/ajax/dollaraddict254@gmail.com',{
      method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)
    });
    const result=await response.json();
    if (!response.ok || String(result.success).toLowerCase()!=='true') throw new Error(result.message || 'Email service did not accept the message.');
    status.textContent='Message submitted. If this is the first submission, the site owner may need to verify the receiving address.';
    contactForm.reset();
  } catch (error) {
    const body=`Name: ${name}\nReply email: ${email}\n\n${message}`;
    const mailto=`mailto:dollaraddict254@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent='Direct sending is not available right now. Opening an email draft instead.';
    window.location.href=mailto;
  } finally { button.disabled=false; }
});
