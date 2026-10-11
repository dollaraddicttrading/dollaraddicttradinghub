# DOLLARADDICT website/app update

## Included
- Responsive dark/blue DOLLARADDICT landing page and PWA manifest/icons.
- TradingView chart selector for XAUUSD, EUR/USD, GBP/USD and BTC/USD.
- Browser-local trading journal with add/edit/delete, filters, CSV export and computed statistics/charts.
- Indicative Tokyo, London and New York session clocks.
- Contact form using FormSubmit AJAX with a `mailto:` fallback. FormSubmit may require a one-time recipient verification.
- CRT Gold robot product page at **KSh 2,000**.
- Backend starter in `backend/` for Daraja STK Push, server-side payment verification, D1 order/license records and private R2 download.
- Recreated `tools/bots.html`, `tools/strategies.html`, and `tools/indicators.html` because those source pages were not present in the received messages.

## Quick local preview
Open `index.html` in a browser to preview most frontend features. PWA installation and service-worker behavior require a secure HTTPS origin (or localhost). The M-PESA checkout intentionally remains disabled until the backend is deployed and `da-config.js` contains the Worker URL.

## Publish the website
Upload the contents of this folder to the root of your GitHub repository so `index.html`, `style.css`, `script.js`, `manifest.json`, `sw.js`, `da-config.js`, and `icons/` are at repository root. Enable GitHub Pages under **Settings → Pages**. Do not upload any Daraja secrets or the `.ex5` binary to the public repo.

## Important
The frontend is not connected to a broker. Journal entries remain on the current browser/device. TradingView and FormSubmit need internet access. The payment backend requires separate deployment and configuration; see `backend/README.md`. This ZIP does not include a compiled robot binary, real payment credentials, or an already activated Safaricom merchant setup. No trading outcome is guaranteed.
