# DOLLARADDICT — updated website/app

## What's included
- TradingView chart dashboard for XAUUSD, EUR/USD, GBP/USD and BTC/USD with symbol/timeframe controls.
- Trading journal with add/edit/delete, date/instrument/result filters, and browser-local persistence.
- Statistics computed from recorded trades: win rate, net and average result, profit factor, equity curve, daily performance, and instrument/strategy breakdown.
- Contact form addressed to `dollaraddict254@gmail.com`, using FormSubmit AJAX with a mail-draft fallback.
- Fixed `mailto:` links, responsive styling, valid PWA manifest, generated app icons, and a safer service worker cache.

## Email setup (required for direct form delivery)
The contact form uses FormSubmit's hosted endpoint, so this static project does not need a private API key.
1. Deploy the site to its final HTTPS URL (GitHub Pages, Netlify, or another HTTPS host).
2. Submit a test message from the contact form.
3. Check `dollaraddict254@gmail.com` for FormSubmit's activation/verification email and approve it. The service may not deliver form submissions until the recipient is verified.
4. Submit another test and confirm delivery. Check spam/junk too.
5. If the service is blocked or unavailable, the form opens a pre-addressed email draft as a fallback. This fallback depends on the visitor's email app being configured.

The site cannot securely guarantee server-to-inbox email delivery without a backend or a third-party form provider. Do not put Gmail passwords, SMTP passwords, or private API keys in `script.js`.

## Trading journal data
- Journal entries are saved in the browser's `localStorage` on the current device/browser.
- They do not automatically sync across devices and may be lost if browser site data is cleared.
- Results are manually entered in account currency. The app does not connect to a broker or calculate pip/contract values.
- The live chart is hosted by TradingView and requires internet access. Quotes and market availability depend on TradingView and its data providers.

## Deploying on GitHub Pages
1. Extract the ZIP.
2. Upload the contents of the `DOLLAR UPDATE` folder to the root of your GitHub repository (so `index.html` is at repository root).
3. Commit and push.
4. In GitHub, open **Settings → Pages**, select the desired branch and root folder, and save.
5. Wait for the HTTPS deployment to finish, then open the site and test the contact form, charts, journal, and app installation.
6. If an older version persists, close the app and clear the site's cached data/service worker, then reload.

## Notes
- The project is static HTML/CSS/JavaScript. No backend or cloud sync is included.
- The FormSubmit recipient must be verified once before reliable direct delivery.
- External TradingView charts and contact form submission require a connection.
