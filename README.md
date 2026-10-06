# OwnStorage Core

Self-hostable private cloud storage. Run it on your own infrastructure — no
subscription, no billing code, no telemetry.

This repository ships both halves of the app: `backend/` (Express API) and
`frontend/` (React SPA).

## Features

- Files and folders on any S3-compatible store — AWS S3, Cloudflare R2,
  Backblaze B2, or MinIO
- Private and public sharing links with per-plan quota enforcement
- Google Drive import
- Google and GitHub OAuth sign-in alongside password login with TOTP 2FA
- Admin panel for users, roles, and storage/bandwidth quotas
- Background jobs on BullMQ + Redis (sweeper and reconciliation tasks)
- Transactional email via Resend or any SMTP relay

## Requirements

- Node.js 20.6 or newer — the npm scripts use `--env-file`
- MongoDB
- Redis
- An S3-compatible object storage bucket

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API listens on `http://localhost:4000`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api` requests
to the backend.

## Configuration

Both `.env.example` files are fully commented and are the source of truth.

### `backend/.env.example`

The server validates `requiredEnvVars` at startup (`backend/misc/constants.js`)
and exits if any are missing:

| Group | Variables |
| --- | --- |
| Runtime | `NODE_ENV`, `PORT`, `APP_MODE`, `COOKIE_SECRET` |
| Data | `MONGO_URI`, `REDIS_URL` |
| CORS / CSRF | `ALLOWED_ORIGINS`, `MUTATING_METHODS` |
| Object storage | `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET_NAME`, `PUBLIC_ACCESS_KEY`, `PUBLIC_SECRET_KEY`, `PUBLIC_BUCKET_NAME` |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_DRIVE_REDIRECT_URI` |
| URLs | `CLIENT_AUTH_CALLBACK_URL`, `CLIENT_URL` |
| Security | `OAUTH_TOKEN_ENCRYPTION_KEY` (32+ chars, encrypts OAuth tokens at rest) |
| Email | `FROM_EMAIL`, `APP_NAME` |

Email transport is chosen by `EMAIL_PROVIDER`: `resend` needs
`RESEND_API_KEY`, `smtp` needs `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`.

Set `APP_MODE=selfhosted` (the default when unset) for this edition. With
`APP_MODE=saas` the server enforces cloud-plan quotas and requires additional
variables — that mode is intended for the hosted product, not this repo.

### `frontend/.env.example`

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL — defaults to `http://localhost:4000` |
| `VITE_APP_MODE` | `selfhosted` (default) or `saas` |
| `VITE_CLIENT_ORIGIN` | Frontend origin |
| `VITE_GOOGLE_API_KEY`, `VITE_GOOGLE_CLOUD_PROJECT_NUMBER` | Google API credentials |

## Workers

Most work runs inline in the API process. Sweeper and reconciliation jobs need
a worker process:

```bash
npm run worker            # BullMQ queue worker
npm run worker:scheduler  # registers repeatable jobs
```

Run both from `backend/`. Neither is required for first boot.

## API documentation

Request/response notes for every route group live in
[`backend/docs`](backend/docs).

## Project layout

```
ownstorage-core/
├── backend/     Express API — models, controllers, services, jobs, routes
├── frontend/    React + Vite + Tailwind single-page app
└── LICENSE      MIT
```

## License

MIT — see [LICENSE](LICENSE).
