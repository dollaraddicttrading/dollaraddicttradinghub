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

## New DA Trading Suite

Open `tools/index.html` to use the Trading Suite. The page is linked from the main navigation and DA Suite section and is included in the service-worker cache for installable-app navigation. It includes:

- Risk and lot-size estimator (requires broker-specific price-step value)
- Manual CRT sweep/reclaim rule checker
- Insights from the existing `dollaraddict.trades.v2` local journal
- Kenya/Tokyo/London/New York clocks and configurable indicative session windows
- Economic calendar link and locally saved event plans (not push notifications)
- Hypothetical compounding planner
- Provider chart watchlist (no fabricated quotes)
- Local educational trading assistant (not a live AI model)
- Browser-only CSV OHLC CRT-style backtester
- Educational Academy lessons
- DA product directory linked to the existing CRT bot checkout

The Trading Suite's local reminders and journal data stay in the current browser and are not synchronized across devices. The assistant is a local educational helper; connect a real AI service only through a secure backend. Live quotes and a live economic calendar require provider data and are linked externally rather than simulated.

### Important before publishing

- The icons are now located in `icons/` inside the project root so the existing manifest and favicon paths resolve when the contents of `DOLLARADDICT-UPDATED/` are published as the site root.
- The M-PESA Worker remains a starter and is not live until the owner configures Daraja credentials, deploys it, sets the allowed origin and uploads the compiled EA to private storage. Do not commit secrets or the compiled `.ex5` file to GitHub.
- Test the PWA, all local tools, and payment flow on the deployed HTTPS site before announcing the upgrade.
