# DOLLARADDICT secure M-PESA checkout and EA delivery (Cloudflare Worker)

This folder is a **backend starter**. It is not live until you deploy it, configure your own Safaricom Daraja credentials, and upload the compiled EA into private R2 storage. Do not publish your Consumer Secret, passkey, database credentials, or any other secrets in GitHub or frontend JavaScript.

## What this backend is designed to do

1. Create an order for exactly **KSh 2,000** and request an M-PESA STK Push.
2. Accept the Safaricom callback and independently query Daraja before granting access.
3. Store the order and a unique license key in Cloudflare D1.
4. Let the buyer check order status using a random checkout token held in their browser session.
5. Stream the `.ex5` file from a private Cloudflare R2 bucket only for a paid, active license.

A license/download gate is a deterrent, not absolute DRM. An EA that a buyer downloads can potentially be copied. This starter does not bind licenses to an MT5 account number and does not guarantee that redistribution is impossible.


## Before configuring payments

**A personal M-PESA phone number is not a Daraja merchant shortcode.** The owner's contact number (+254 743 559 970) can be used for support, but STK Push requires a Daraja-supported PayBill/Till/business shortcode and matching passkey/credentials for the selected environment. Do not put the owner's phone number into `DARAJA_SHORTCODE` unless Safaricom has explicitly issued that exact value as the supported shortcode for your merchant setup.

The Worker formats STK password timestamps in Kenya time (EAT, UTC+3), rather than relying on the Cloudflare runtime's UTC timezone. Paid status and the license record are written with a D1 batch and rechecked before the API reports access as granted.

## Prerequisites

- Cloudflare account with Workers, D1 and R2 available.
- Safaricom Daraja app and approved credentials for the environment you intend to use.
- The compiled MT5 file, e.g. `DOLLARADDICT_CRT_GOLD.ex5`, compiled and tested separately. **It is intentionally not included in this public project ZIP.**
- A public HTTPS callback URL for the Worker.

## Setup

1. In Cloudflare, create a D1 database named `dollaraddict-payments` and a private R2 bucket named `dollaraddict-private-bots`.
2. Run `schema.sql` against the D1 database, for example with `npx wrangler d1 execute dollaraddict-payments --file=backend/schema.sql --remote` after configuring Wrangler.
3. Copy `wrangler.toml.example` to `wrangler.toml`, replace the D1 database ID and the allowed website origin. The allowed origin must match your actual GitHub Pages/custom domain exactly.
4. Add secrets using Wrangler (do not put them in the TOML file):

   ```sh
   npx wrangler secret put DARAJA_CONSUMER_KEY
   npx wrangler secret put DARAJA_CONSUMER_SECRET
   npx wrangler secret put DARAJA_PASSKEY
   npx wrangler secret put DARAJA_SHORTCODE
   ```

   `DARAJA_CALLBACK_URL` is a public URL and is configured in the Worker vars. Use the shortcode and passkey that belong together in the same Daraja environment. Start with the sandbox URL and sandbox credentials.
5. Upload the compiled EA to the **private** R2 bucket using the exact object key `DOLLARADDICT_CRT_GOLD.ex5`. Do not put it under this site's public folder or commit it to GitHub.
6. Deploy the Worker from `backend/` with Wrangler. Confirm `/api/health` returns `ok:true` and `configured:true` (health output does not disclose secrets).
7. Set `window.DA_CONFIG.apiBase` in the root `da-config.js` to your deployed Worker URL, for example `https://dollaraddict-payments.example.workers.dev`. This value is a public API URL, not a secret.
8. Add that exact site origin to `ALLOWED_ORIGINS`, deploy the website over HTTPS, and test using **sandbox** credentials and a sandbox number. Check logs and D1 rows during testing.
9. Complete Safaricom production onboarding and obtain production credentials before changing `DARAJA_BASE_URL` to `https://api.safaricom.co.ke`. Never treat a sandbox transaction as a real payment.

## Test checklist before selling

- Valid and invalid Kenyan phone formats.
- STK prompt rejection, cancellation, timeout, delayed callback and successful payment.
- Confirm no license appears for failed/pending orders.
- Confirm the D1 order receipt and paid state are written only after successful Daraja verification.
- Confirm an unpaid, random, or inactive license cannot download the file.
- Confirm the private R2 object is not publicly accessible.
- Confirm the successful paid order can download the `.ex5` file and that the compiled EA itself is demo-tested.
- Have a real person test from a different phone/browser and contact you if delivery fails.

## Important limitations / owner responsibilities

- The compiled EA binary is not included. Upload your tested `.ex5` privately before enabling sales.
- The code uses Daraja STK Push and Query endpoints; Safaricom onboarding, account type, callback requirements, API product availability and exact response payloads can vary. Validate this against your current Daraja app/docs and test logs before production.
- The code currently supports a one-time KSh 2,000 price, does not implement refunds, admin dashboard, rate limiting, order cleanup, automated receipts by email, or MT5 account-number binding.
- A public callback endpoint is expected; access is only granted after a server-side Daraja query. Monitor Worker logs and test delayed callbacks carefully.
- Add rate limiting/WAF protections and a customer-support process before production launch.
- GitHub Pages can host the public frontend but cannot run the payment backend. The Worker is a separate deployed service.
