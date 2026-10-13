# DOLLARADDICT backend launch checklist

This package contains the website frontend and a **backend starter**, not a live payment service. The owner must deploy and configure the backend in their own accounts.

## Required services
- Cloudflare Worker for the API
- Cloudflare D1 database for orders and licenses
- Private Cloudflare R2 bucket for the compiled `.ex5` file
- Safaricom Daraja credentials and a valid merchant shortcode/Till/PayBill setup

## Configure and test safely
1. Follow `README.md` in this folder and use Daraja sandbox credentials first.
2. Apply `schema.sql` to the D1 database.
3. Copy `wrangler.toml.example` to `wrangler.toml`, then replace the database ID, Worker callback URL, and exact website origin.
4. Store consumer key, consumer secret, passkey, and shortcode using Wrangler secrets/vars as described in the README. Never place them in `da-config.js`, HTML, or public GitHub files.
5. Deploy the Worker and confirm `/api/health`. A configured response does not by itself prove that a payment works.
6. Put the compiled and demo-tested EA in the **private** R2 bucket using the exact key `DOLLARADDICT_CRT_GOLD.ex5`. It is intentionally not bundled.
7. Set the deployed Worker URL in the public `da-config.js` as `window.DA_CONFIG.apiBase`.
8. Test success, cancellation, rejection, delayed callbacks, repeated callbacks, invalid phone numbers, and unpaid download attempts in sandbox before production.
9. Only move to production after Safaricom production onboarding and a controlled low-risk end-to-end test.

## What is and is not included
- Included: current public website, PWA files/icons, existing browser-local journal/statistics and Trading Suite, checkout UI, Worker source, D1 schema and deployment examples.
- Not included: deployed Cloudflare resources, live Daraja credentials, merchant onboarding, compiled `.ex5` binary, broker connection, or a guarantee against copying a downloaded EA.
- Journal entries remain in the browser/device in this version; this backend does not yet provide user accounts or cross-device journal synchronization.

Do not ask customers to send their M-PESA PIN to the website or support. The PIN should only be entered into the official M-PESA STK prompt on their phone.
