# GaonBazaar (Direct Access for Farmers)

Full-stack marketplace connecting farmers and buyers: **React + Vite** frontend, **Express + MongoDB** backend, **Socket.IO** for chat, **Razorpay** for payments.

## Repository layout

| Path | Role |
|------|------|
| `Farm-front/` | React 18, TypeScript, Tailwind, Redux |
| `Farm-back/` | Express 5 API, Mongoose, JWT auth |

## Prerequisites

- Node.js **20+** (mongoose 9 expects a recent 20.x)
- MongoDB (local or Atlas)

## Quick start

### 1. Backend

```bash
cd Farm-back
cp .env.example .env
# Edit .env — at minimum MONGO_URI and JWT_SECRET

npm install
npm run dev
```

API defaults to **http://localhost:5000** (see `PORT` in `.env`).

### 2. Frontend

```bash
cd Farm-front
cp .env.example .env.local
# Set VITE_API_BASE_URL and VITE_SOCKET_URL to match your API (see .env.example)

npm install
npm run dev
```

App defaults to **http://localhost:8080**.

### 3. CORS

The API allows origins listed in **`CORS_ORIGINS`** (comma-separated). For local dev, `http://localhost:8080` is the default if unset. For production, set all real web origins there.

## Authentication

- **Email + password** registration and login (JWT).
- Optional **Google Sign-In** when `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend) are set to the same OAuth client.

There is **no OTP-only** login path in the current backend; treat any old docs mentioning OTP as outdated.

## Environment variables

### Backend (`Farm-back/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes (prod) | Signs auth tokens |
| `PORT` | No | Default `5000` |
| `CORS_ORIGINS` | No | Comma-separated browser origins; default `http://localhost:8080` |
| `FRONTEND_URL` | For links | Password reset / emails |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | For payments | Server-side order + verify |
| `GOOGLE_CLIENT_ID` | Optional | Verify Google ID tokens |
| `SMTP_*` | Optional | Email via nodemailer (`utils/mail.js`) |
| `TRUST_PROXY` | Deploy | Set `1` behind reverse proxy |
| `RATE_LIMIT_MAX` | No | Requests per IP per 15 min under `/api` (default `400`) |
| `RATE_LIMIT_DISABLED` | Dev | Set `1` to disable API rate limiting |

See **`Farm-back/.env.example`** for the full list.

### Frontend (`Farm-front/.env` or `.env.local`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | REST API base (e.g. `http://localhost:5000/api`) |
| `VITE_SOCKET_URL` | Socket.IO server origin (same host as API, no `/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth web client ID |

See **`Farm-front/.env.example`**.

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `Farm-front` | `npm run dev` | Vite dev server |
| `Farm-front` | `npm run build` | Production build |
| `Farm-front` | `npm run test` | Vitest unit tests |
| `Farm-back` | `npm run dev` | Nodemon API |
| `Farm-back` | `npm start` | Run API once |
| `Farm-back` | `npm test` | Node.js built-in tests (`utils/corsConfig.test.js`) |

## Production hardening (already partially applied)

- **Helmet** security headers on the API.
- **Rate limiting** on `/api` (tunable via env).
- **CORS** driven by `CORS_ORIGINS`; Socket.IO uses the same rules (no open `*` in production config).
- **Request logging** (method, path, status, duration) to stdout.
- **Trust proxy** optional for correct IPs behind nginx/Render/etc.

Still recommended before a public launch: structured logging, monitoring, database backups, moving large uploads off base64-in-JSON to object storage, and expanding automated tests (API integration tests, e2e).

## Repo hygiene

- **Do not commit** `node_modules/`, `.env`, or files under `Farm-back/uploads/` (only `.gitkeep` is tracked).
- Use **`.env.example`** files as the source of truth for required keys.

## Further reading

- `Farm-front/PROJECT_REVIEW.md` — frontend-focused notes (if present).

## License

Educational / capstone use unless otherwise stated.
