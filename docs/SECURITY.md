# Security & privacy notes

## Backend: Helmet and CSP

The API uses `getHelmetMiddleware()` from `Farm-back/utils/securityHeaders.js`:

- **CSP** is strict and API-oriented (`default-src 'none'`, `frame-ancestors 'none'`, etc.). It mainly hardens direct browser navigation to API URLs; it does not replace a CSP on the **frontend** document.
- **HSTS** is enabled when `NODE_ENV=production`.
- **`HELMET_DISABLE_CSP=1`** turns CSP off if a proxy or tooling strips or conflicts with headers during debugging.

## Frontend (Vite SPA): Content-Security-Policy

Serve the SPA with its **own** CSP. Origins used in this project include:

| Need | Typical hosts |
|------|----------------|
| App script | `'self'` |
| Vite dev only | `http://localhost:8080`, WebSocket to same (often needs relaxed or no CSP in dev) |
| Google Sign-In | `https://accounts.google.com` |
| Razorpay Checkout | `https://checkout.razorpay.com` |
| Razorpay assets (e.g. logo img) | `https://razorpay.com` |
| Google Fonts (CSS) | `https://fonts.googleapis.com` |
| Google Fonts (files) | `https://fonts.gstatic.com` |
| Placeholder / demo images | `https://images.unsplash.com` |
| Avatar fallbacks | `https://ui-avatars.com` |
| API + uploaded images | Your API origin (e.g. `https://api.example.com` for `connect-src` and `img-src`) |

**`connect-src`** must include your `VITE_API_BASE_URL` host and any auth/payment endpoints the browser calls directly.

Production CSP often needs **`'unsafe-inline'`** for `style-src` (and sometimes `script-src` if you cannot use nonces) with Vite/React builds—prefer **nonces** or **hashes** when your host supports them.

## Uploads

- **Allowlisted MIME types** in multer: JPEG, PNG, WebP, GIF; KYC also allows PDF. **SVG is blocked** (scriptable in browsers).
- **Magic-byte check** after save: `assertFileContentAllowed` in `Farm-back/utils/validateUploadedFile.js`.
- **Optional virus scan**: set `UPLOAD_VIRUS_SCAN=1` and install ClamAV so `UPLOAD_CLAMDSCAN_CMD` (default `clamdscan`) works. If the command is missing while scanning is enabled, uploads return **503**.

## PII in logs and AI

- Request logging redacts **query strings** and shortens **Mongo-style ids** in paths (`redactForLog.js`). Socket connect logs use a **shortened user id** suffix only.
- User text sent to Groq is passed through **`sanitizeForAi.js`** to reduce accidental card numbers, long digit runs, UPI/account-like lines, and long address-like spans. This is **not** a compliance substitute—do not paste full addresses or card data into AI fields.

## Secrets rotation (order and caveats)

Rotate in an order that **minimizes downtime** and **invalidates old credentials** safely.

### 1. JWT signing secret (`JWT_SECRET`)

- **Effect**: All existing access tokens become invalid immediately after deploy (users must log in again).
- **When first**: If you suspect token forgery or secret leak; otherwise can be scheduled in a low-traffic window.
- **How**: Generate a new long random secret, deploy, optionally run a short **dual-verify** window only if you implement two secrets in code (not in this repo by default).

### 2. Razorpay (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)

- **Effect**: Old server cannot create/verify orders with the new keys until both app and dashboard keys match. **Webhook secrets** (if used) must be updated in the Razorpay dashboard to match.
- **Order**: Create new keys in Razorpay → update server env → deploy → disable old keys after traffic is on the new pair. Coordinate **webhook URL** and **IP allowlists** if any.

### 3. Groq (`GROQ_API_KEY`)

- **Effect**: AI endpoints return 503 until the new key is set. No user session impact.
- **Order**: Issue new key in Groq console → update env → deploy → revoke old key.

### 4. SMTP (`SMTP_USER`, `SMTP_PASS`, and related)

- **Effect**: Email (registration, password reset, notifications) fails until updated.
- **Order**: Create new app password / SMTP credential → update env → deploy → send a test mail → revoke old credential.

### 5. Google OAuth (`GOOGLE_CLIENT_ID` / frontend `VITE_GOOGLE_CLIENT_ID`)

- **Effect**: Sign-in breaks if client IDs or authorized JavaScript origins do not match.
- **Order**: Add new OAuth client or update origins in Google Cloud Console → deploy frontend + backend with matching IDs → verify sign-in → remove obsolete client configuration if replacing.

### Other

- **MongoDB**: Rotate `MONGO_URI` user/password via DB admin; update env; restart; revoke old DB user.
- **`.env` files**: Never commit; use your host’s secret store in production.

## Razorpay webhooks (if enabled later)

When adding webhooks: use a **dedicated signing secret** from Razorpay, verify signatures on the server, and **never** log full payment payloads or card data—log ids and status only.
