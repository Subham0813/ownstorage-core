# OwnStorage — Backend (open-source core)

![version](https://img.shields.io/badge/version-1.0.0-blue) ![node](https://img.shields.io/badge/node-%3E%3D20-green) ![license](https://img.shields.io/badge/license-MIT-green)

The open-source, self-hostable backend of **OwnStorage** — a private cloud storage platform built with Node.js + Express (ES Modules). It powers file & directory management, resumable chunked uploads to any S3-compatible storage (AWS, Cloudflare R2, Backblaze B2, MinIO), role-based sharing, OAuth login, Google Drive import, two-factor authentication, and a full admin console.

This is the **core** build: all billing/subscription (Razorpay) code is removed. It runs entirely in self-hosted mode (`APP_MODE=selfhosted`) where quotas and plans are controlled by the administrator via database fields (`user.maxQuota`, `user.maxBandwidthQuota`, `user.plan`).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Quotas](#quotas)
- [Running the Project](#running-the-project)
- [API Overview](#api-overview)
- [Authentication Flow](#authentication-flow)
- [Upload Flow](#upload-flow)
- [Google Drive Import](#google-drive-import)
- [Background Jobs](#background-jobs)
- [Caching](#caching)
- [Bandwidth & CDN](#bandwidth--cdn)
- [Feedback](#feedback)
- [Security](#security)
- [Deployment](#deployment)
- [Postman](#postman)

---

## Features

- **File & Directory Management** — create, rename, move, copy, star, trash, restore, and permanently delete files and directories with full recursive support.
- **Resumable Chunked Uploads** — client-driven S3/B2 multipart uploads via pre-signed PUT URLs. Files ≤ 5 MB use a single standard PUT; larger files use S3 multipart with configurable chunk sizes and concurrency limits.
- **Thumbnail Support** — optional base64 `webp` thumbnail uploaded to the public bucket on upload completion (≤1 MB).
- **Bandwidth Tracking** — the server tracks served bytes per user (30-day rolling window, resets daily via BullMQ). Optionally integrates with a Cloudflare Worker or CloudFront for signed URL delivery.
- **Authentication**
  - Email + password with mandatory OTP verification (6-digit, 5-minute TTL, Redis).
  - Optional TOTP-based 2FA (authenticator app) — QR code, period 30s.
  - Forgot password with `resetToken` cookie handshake.
  - OAuth: Google and GitHub (PKCE `S256` + signed state cookies).
  - OAuth tokens encrypted at rest (AES-256-GCM).
  - Stateful sessions in Redis with signed `sessionId` cookies (7-day TTL, sliding window).
- **Role-Based Sharing**
  - Share files/directories with specific users by email (`view` / `edit`).
  - Public share links with optional expiry — capped at 500 MB per file and 2 GB aggregate active bytes.
  - Token regeneration and per-user revocation. Guest access via `/api/public/shared/:token`.
  - Administrators assign `plan` tiers (`FREE` / `PRO` / `BUSINESS`) that raise the share caps.
- **Google Drive Import** — server-side streaming from Drive directly to S3/B2 with real-time progress polling. Google Docs exported to Office formats; oversized exports saved as webview links.
- **Feedback (admin-managed)** — users can submit feedback (SaaS mode only; screenshots ≤1 MB to the public bucket); admins moderate, reply by email, and manage status.
- **Background Jobs (BullMQ)** — 7 scheduled jobs (separate scheduler/worker): trash-collector, quota-reaper, session-reaper, bandwidth reset, share-token invalidation, public-share-reaper, active-users sweeper.
- **Admin Controls** — dashboards, paginated users, role changes, forced logout, soft-delete (ban), recovery, permanent deletion with S3 cleanup, quota control, feedback moderation and direct email.
- **Notifications** — in-app `GET /api/notifications`, unread count, mark-all-read.
- **Security** — Helmet, CSRF double-submit + origin check, 4-tier Redis rate limiting, `httpOnly` signed cookies, HMAC webhooks, bcrypt cost 12.

---

## Tech Stack

| Layer            | Technology                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Runtime          | Node.js (ES Modules, `type: module`)                                                      |
| Framework        | Express 4                                                                                 |
| Database         | MongoDB via Mongoose 9                                                                    |
| Cache / Sessions | Redis v5 (JSON module)                                                                    |
| Job Queue        | BullMQ 5 (Queue + Worker + Scheduler)                                                     |
| Object Storage   | Any S3-compatible API — AWS, R2, B2, MinIO (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`) |
| CDN              | Cloudflare Worker (HMAC) / CloudFront (signer) / Native S3 fallback                       |
| Email            | Resend HTTP API + Nodemailer (`EMAIL_PROVIDER=resend\|smtp`)                             |
| OAuth            | Google `googleapis` + GitHub, PKCE `S256`                                                 |
| Validation       | Zod v4                                                                                    |
| Security         | Helmet, `express-rate-limit` + `rate-limit-redis`, bcrypt, AES-256-GCM                    |

---

## Project Structure

```
backend/
├── app.js                        # Bootstrap — middleware, route mounting, graceful shutdown
├── configs/
│   ├── connect.js                # Mongoose connection
│   └── redis.js                  # Redis client (JSON module)
├── controllers/
│   ├── authControllers.js        # register, login, OTP, forgot-password
│   ├── twoFactorAuthControllers.js # 2FA generate/enable/disable + TOTP verify
│   ├── commonGetControllers.js   # getItemInfo, getShareInfo, bin/starred/shared/recents/search
│   ├── commonSetControllers.js   # rename, move, star, trash, restore, share, revoke, newToken
│   ├── DirectoryControllers.js   # directory CRUD + ZIP download
│   ├── FileControllers.js        # preview, download, copy, delete
│   ├── importControllers.js      # Google Drive import pipeline + picker-token
│   ├── oauthControllers.js       # Google, GitHub, Google Drive OAuth (PKCE)
│   ├── uploadControllers.js      # S3 multipart/standard session (initiate/complete/retry/cancel)
│   ├── userControllers.js        # profile, stats/usage (cached), avatar, logout, empty-trash, feedback
│   ├── adminControllers.js       # dashboard, users, role, quota, logout, ban, recover, delete, feedback
│   ├── notificationControllers.js# list, mark-read, unread-count
│   └── batchControllers.js       # bulk-download ZIP
├── middlewares/
│   ├── validateSession.js        # session + share token + CSRF origin double-submit
│   ├── checkAccessControl.js     # ownership / Permission / token fast-pass
│   ├── loadParentDirectory.js    # resolves targetId → req.target/parent
│   ├── rateLimiter.js            # global / auth / upload / public tiers (Redis)
│   ├── requireSaasMode.js        # gates SaaS-only routes (feedback submit, bandwidth webhook)
│   ├── restrictOperations.js     # restrictRoot, checkAuthProviderStatus
│   └── errorHandler.js           # centralized formatter
├── models/                       # user, user_file, directory, permission, notification, feedback
├── routes/                       # authRoutes, oauthRoutes, fileRoutes, directoryRoutes, uploadRoutes, userRoutes, shareRoutes, importDriveRoutes, notificationRoutes, adminRoutes
├── schemas/                      # authSchema, userSchema (Zod)
├── services/
│   ├── s3Client.js               # s3Client + s3PublicClient, presigned URLs, multipart, HeadObject
│   ├── cdnRouter.js              # Cloudflare Worker HMAC / CloudFront signer / S3 fallback
│   ├── cloudfront.js             # CloudFront signer helper
│   ├── bandwidthWebhook.js       # Cloudflare HMAC → User $inc bandwidth (SaaS)
│   ├── emailService.js           # Resend/SMTP wraps + template composition
│   ├── mailProvider.js           # Resend vs nodemailer transport
│   ├── notificationService.js    # createNotification / notifyMany
│   └── schemaValidator.js        # MongoDB $jsonSchema validators
├── utils/
│   ├── helper.js                 # getErrorObject, getUserPayload, getFileDoc, cookieOptions, getUserLimits, checkEnv
│   ├── responseCache.js          # cacheWrap 60s user / 900s global, invalidateUser
│   ├── encryption.js             # AES-256-GCM (OAUTH_TOKEN_ENCRYPTION_KEY)
│   ├── bandwidthWindow.js        # 30-day rolling window
│   ├── remove.js / restore.js / serve.js # recursive delete/restore, serveZipS3
│   ├── formatDate.js / emailTemplates.js
│   └── ...
├── misc/constants.js             # PLAN_DETAILS, INSTANCE_CONFIG, t, requiredEnvVars
├── jobs/queueJobs.js             # BullMQ Queue + Worker + Scheduler (7 jobs)
├── docs/                         # Per-route request/response Markdown
├── .env.example / package.json / CHANGELOG.md
└── public/                       # gitignored generated assets
```

---

## Environment Variables

Copy `.env.example` to `.env`. `APP_MODE` defaults to `saas` in code but the core repo runs **self-hosted** (`APP_MODE=selfhosted`) — no billing stack exists here.

### Core

| Variable                     | Description                                              | Example                    |
| ---------------------------- | -------------------------------------------------------- | -------------------------- |
| `NODE_ENV`                   | `development` or `production`                            | `production`               |
| `PORT`                       | Server port                                              | `4000`                     |
| `APP_MODE`                   | `selfhosted` (core) or `saas` (needs billing stack)      | `selfhosted`               |
| `APP_NAME`                   | Used in emails / branding                                | `OwnStorage`               |
| `ALLOWED_ORIGINS`            | CORS + CSRF origin allowlist (CSV)                       | `https://app.example.com`  |
| `MUTATING_METHODS`           | Methods subject to CSRF check                            | `POST,PATCH,PUT,DELETE`    |
| `COOKIE_SECRET`              | Sign all cookies                                         | `random 32+ chars`         |
| `CLIENT_URL`                 | Frontend base URL for email links                        | `https://app.example.com`  |
| `CLIENT_AUTH_CALLBACK_URL`   | OAuth final redirect                                     | `https://app.example.com/auth/callback` |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | AES-256-GCM key (32+ chars)                              | `change-me-32-char-minimum-secret` |

### Database & Cache

| Variable                                       | Description                                         | Example                                  |
| ---------------------------------------------- | --------------------------------------------------- | ---------------------------------------- |
| `MONGO_URI`                                    | MongoDB URI                                         | `mongodb://user:pass@host:27017/db`      |
| `REDIS_URL`                                    | Redis connection (app cache, sessions, BullMQ jobs) | `redis://:pass@host:6379`                |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Fallback — only used when `REDIS_URL` is unset      | `127.0.0.1` / `6379`                     |

### Storage (S3-compatible — AWS, R2, B2, MinIO)

| Variable                                    | Description                                                 | Example                                  |
| ------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `STORAGE_BUCKET_NAME`                       | Private files bucket                                        | `my-private-bucket`                      |
| `STORAGE_REGION`                            | Region or `auto` for R2                                     | `us-east-1`                              |
| `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | Creds                                                       | `...`                                    |
| `STORAGE_ENDPOINT`                          | Custom endpoint (R2/B2/MinIO) — omit for AWS                | `https://s3.us-east-005.backblazeb2.com` |
| `STORAGE_FORCE_PATH_STYLE`                  | `true` for MinIO                                            | `false`                                  |
| `PUBLIC_BUCKET_NAME` etc                    | Same 5 vars for the public bucket (thumbnails/avatars/feedback) |                                   |
| `PUBLIC_BUCKET_CDN`                         | CDN that serves the public bucket                           | `https://cdn.example.com`                |
| `B2_BUCKET_NAME`                            | Alias = `STORAGE_BUCKET_NAME` for ZIP streaming — set same  |                                          |

### CDN (optional)

| Variable                                              | Description                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `CDN_PROVIDER`                                        | `cloudflare` (HMAC worker, SaaS only) / `cloudfront` / omit for S3 pre-signed      |
| `CDN_DOMAIN`                                          | Worker URL or CloudFront `dxxx.cloudfront.net`                                     |
| `CLOUDFLARE_WEBHOOK_SECRET`                           | HMAC secret for bandwidth webhook (SaaS only)                                      |
| `CLOUDFRONT_PRIVATE_KEY` / `CLOUDFRONT_PUBLIC_KEY_ID` | For the CloudFront signer (`\n` as `\\n`)                                          |

### OAuth

| Variable                                                            | Description                                       |
| ------------------------------------------------------------------- | ------------------------------------------------- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Google login                                      |
| `GOOGLE_DRIVE_REDIRECT_URI`                                         | Drive import (`drive.readonly`, `prompt consent`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_REDIRECT_URI` | GitHub login                                      |

### Email

| Variable                                                              | Description                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `EMAIL_PROVIDER`                                                      | `resend` (HTTP) or `smtp`                                  |
| `RESEND_API_KEY`                                                      | Required if `resend`                                       |
| `FROM_EMAIL`                                                          | Sender address for transactional emails                    |
| `ADMIN_EMAIL`                                                         | Inbox for feedback/admin alerts                            |
| `SUPPORT_EMAIL`                                                       | Shown in templates as the support contact                  |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | Required if `smtp` (`true` for port 465)                   |

> **Email by mode** — OTP, password-reset, sharing, ban/recover, and feedback emails work in `selfhosted` mode when `FROM_EMAIL`/`SUPPORT_EMAIL`/`ADMIN_EMAIL` are set. SaaS-only notifications (invoice, abandoned-cart, subscription changes) were removed with the billing stack.

### Misc

| Variable    | Description                                      |
| ----------- | ------------------------------------------------ |
| `MAX_DEPTH` | Max recursion for ZIP `serveZipS3` (default `5`) |

`misc/constants.js:requiredEnvVars` is checked at boot via `utils/helper.js checkEnv()` — the process exits with a clear message if anything is missing.

---

## Quotas

Self-hosted quotas are enforced from **admin-controlled database fields** (not static constants):

| Limit              | Default                   | Controlled by                          |
| ------------------ | ------------------------- | -------------------------------------- |
| Storage quota      | `user.maxQuota ?? ∞`      | Admin (`PATCH /api/admin/quota/:id`)   |
| Max file size      | 50 GB (`INSTANCE_CONFIG`) | `INSTANCE_CONFIG.maxFileSize`          |
| Monthly bandwidth  | `user.maxBandwidthQuota ?? ∞` | Admin / `INSTANCE_CONFIG`          |
| Upload concurrency | 4 (`INSTANCE_CONFIG`)     | `INSTANCE_CONFIG.maxUploadConcurrency` |
| Max devices        | `∞`                       | —                                      |
| Trash retention    | 5 days (`PLAN_DETAILS.FREE`) | `PLAN_DETAILS`                     |
| Public link caps   | 500 MB/file, 2 GB total   | Admin can raise via user `plan`        |

`PLAN_DETAILS` (`misc/constants.js`) defines `FREE` / `PRO` / `BUSINESS` tiers used for trash retention, public-share caps and grace windows. Assign a plan to a user via the admin dashboard.

---

## Running the Project

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# edit .env — see tables above

# 3. Start (requires MongoDB + Redis)
npm run dev              # hot reload via --watch
npm start                # production

# 4. Background jobs (production — run scheduler once + N workers)
npm run worker:scheduler # registers 7 repeatables
npm run worker           # consumes — scale horizontally

# 5. Health
curl http://localhost:4000/api/user/info # 401 without a session
```

Server listens on `PORT` (default `4000`). `trust proxy 1` expects a reverse proxy.

---

## API Overview

All authenticated routes need the `sessionId` signed cookie.

| Prefix                            | Description                                                                  | Auth                    | Rate Limiter     |
| --------------------------------- | ---------------------------------------------------------------------------- | ----------------------- | ---------------- |
| `POST /api/auth/*`                | Register, login, OTP, forgot-password, 2FA                                   | Public                  | `auth` 20/15m    |
| `GET /api/oauth/*`                | Google, GitHub, Google Drive (PKCE)                                          | Mixed                   | `auth` 20/15m    |
| `POST /api/files/webhook`         | Cloudflare bandwidth (SaaS only)                                             | HMAC + SaaS             | `global`         |
| `GET /api/public/shared/:token`   | Public preview/download/info                                                 | Token                   | `public` 200/15m |
| `/api/files/*`                    | File CRUD, share, copy, trash/restore                                        | Session                 | `global`         |
| `/api/directories/*`              | Directory CRUD, share, ZIP download                                          | Session                 | `global`         |
| `/api/uploads/*`                  | Initiate/complete/retry/cancel                                               | Session                 | `upload` 100/15m |
| `/api/user/*`                     | Profile, stats/usage (cached), search/bin/recents/starred/shared, avatar, sessions, feedback (SaaS) | Session | `global`   |
| `/api/import/*`                   | Drive `picker-token`, `initiate`, `start-import` 202, `progress`, `complete` | Session                 | `global`         |
| `/api/notifications/*`            | List, unread-count, mark-read                                                | Session                 | `global`         |
| `/api/admin/*`                    | Users, dashboard, quota, ban/recover/delete, feedback                        | Session + `SUPER_ROLES` | `global`         |

Full request/response for each endpoint is in [`docs/`](./docs/).

---

## Authentication Flow

2-step cookie handshake (stateful sessions in Redis):

```
1. POST /api/auth/login (or /register) → validates credentials
   → sets authToken cookie (5 min, httpOnly, signed) + { isTwoFactorEnabled }

2a. If 2FA disabled:
   POST /api/auth/request-otp → reads authToken, sends 6-digit OTP (5 min Redis)
   POST /api/auth/verify-otp → verifies OTP, creates
      storageApp:user:{id}:userdata (60s) + storageApp:user:{id}:session:{token} (7d, sliding to 6d if <1d)
      → sets sessionId (lax, signed) + csrf (double-submit, httpOnly false) → user payload

2b. If 2FA enabled: POST /api/auth/verify-totp → same session creation after TOTP

2c. OAuth: GET /api/oauth/<provider>/connect → 302 via PKCE state+verifier (5 min signed cookie)
   → GET /api/oauth/<provider>/callback → verifies state, getToken/verifyIdToken, links authProviders,
      creates session or redirects to CLIENT_AUTH_CALLBACK_URL for 2FA/Session limits
```

`validateSession.js` slids the TTL, pushes `storageApp:active_users` (60s window), and runs `restrictOperations`.

---

## Upload Flow

S3 never proxies through Node — pre-signed PUTs:

```
1. POST /api/uploads/initiate { file:{name,size,mime}, targetId }
   → quota vs getUserLimits, maxFileSize, key files/{userId}/{now}.{ext}
   → ≤5 MB: 1 PutObject URL (standard) | >5 MB: CreateMultipartUpload → N UploadPart URLs (chunkSize = min(size, limits.chunkSize))

2. Client PUTs each chunk → collects ETag

3. PUT /api/uploads/complete/:id { parts:[{partNumber,ETag}], thumbnailBase64? }
   → CompleteMultipartUpload (multipart only), HeadObject size verify, thumbnail ≤1 MB → PutObject thumbnails/{userId}/{name}.webp (CacheControl 2hr, public bucket)
   → UserFile.create + Directory.bulkWrite $inc size on path + del userdata + invalidateUser
```

`retryUpload` re-issues URLs, `cancelUpload` aborts multipart + `del` Redis.

---

## Google Drive Import

`GET /api/oauth/google-drive/connect` scope `drive.readonly prompt consent` → refresh_token.

```
1. GET  /api/import/google/picker-token → decrypt refreshToken, refresh if expiry-60s, bust userdata, return accessToken
2. POST /api/import/google/initiate { file:{id,name,mimeType,sizeBytes}, targetId } → Redis storageApp:user:{id}:import:{uploadId} 6hr
3. PUT  /api/import/google/start-import/:id → 202 fire-and-forget: googleapis drive.files.get/export (EXPORT_MAP for Docs → Office), stream via @aws-sdk/lib-storage Upload to S3, progress throttle 1s → bytesRead, thumbnailLink → public bucket, notify, status can_complete
4. GET  /api/import/google/progress/:id → poll
5. PUT  /api/import/google/complete/:id → verify size, create UserFile, notify
```

Oversize Google Docs exports → saved as `webviewLink` size 0.

---

## Background Jobs

BullMQ `Queue("StorageApp-Cron-Queue")` uses the Redis connection resolved by `parseRedisUrl()` (`REDIS_URL`, or the legacy `REDIS_HOST/PORT/PASSWORD` trio as fallback). `node jobs/queueJobs.js scheduler` registers; `node jobs/queueJobs.js worker` consumes (scale workers horizontally).

| Job                      | Schedule                 | What It Does                                                                                             |
| ------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `share-token-invalidator` | `0 0 * * *` daily 00:00 | `shareTokenExpiresAt < now` → `$unset` shareToken/publicRole                                            |
| `bandwidth-reset`         | `0 0 * * *` daily 00:00 | `bandwidthResetAt ≤ now` (or null) → `used 0, reset +30d`, bust cache, notify                           |
| `public-share-reaper`     | `30 0 * * *` daily 00:30 | Ends `publicShareGraceEndsAt` windows: self-heals if under the 2 GB cap, else revokes oldest public links until under |
| `trash-collector`         | `0 1 * * *` daily 01:00 | `isDeleted && permanentDeleteAt ≤ now` → S3 dedup (count key), `Directory/UserFile` bulkWrite, notify   |
| `quota-reaper`            | `0 2 * * *` daily 02:00 | `gracePeriodEndsAt ≤ now` + over quota → delete oldest files until quota met                            |
| `active-users-sweeper`    | `0 3 * * *` daily 03:00 | `ZREMRANGEBYSCORE storageApp:active_users 0 (now-30d)`                                                   |
| `session-reaper`          | `*/30 * * * *` every 30m | Reclaims expired upload/import Redis sessions; orphaned S3 objects version-deleted                      |

`JOB_OPTS removeOnComplete 7d/100`, `removeOnFail 7d/200`.

---

## Caching

`utils/responseCache.js` is fail-open and namespaces `storageApp:cache:`.

* **Tier1 per-user (60s):** `info`, `usage`, `stats` (self only, admin `?id` bypass). Busted via `invalidateUser(userId)` in all mutating paths: name/avatar update, upload complete, file/dir delete, admin quota, `bandwidthWebhook`, `queueJobs`.
* **Tier2 global (900s):** static plans data.
* `getUserPayload` also caches `storageApp:user:{id}:userdata` (60s) via `validateSession.js`.

---

## Bandwidth & CDN

`services/cdnRouter.js` is 3-way:

* **`CDN_PROVIDER=cloudflare` (SaaS):** `s3SignedUrl` 300s wrapped in JSON `{u,url}` HMAC `CLOUDFLARE_WEBHOOK_SECRET` → `${CDN_DOMAIN}/stream|download?token=base64(payload|hmac)` → Worker validates and calls `POST /api/files/webhook` → `services/bandwidthWebhook.js` `User $inc usedBandwidthQuota` via `ensureBandwidthWindow` (30d rolling).
* **CloudFront:** `cloudfront.js` signer 5 min with `ResponseContentDisposition`.
* **Native:** S3 pre-signed 300s fallback. Self-hosted mode never uses the worker route — `FileControllers.js` reads `IS_SAAS_MODE && CDN_PROVIDER === "cloudflare"` and otherwise falls back to inline server-side tracking.

---

## Feedback

`POST /api/user/feedback` is gated by `requireSaasMode` (SaaS mode only). Zod `feedbackSchema`, tiered Redis fixed 7-day window `storageApp:feedback:{userId}:count` (`FREE 2/week`, `PRO 5/week`, `BUSINESS 10/week`). Screenshot ≤1 MB → `feedback/{userId}/{now}.webp` in the public bucket, `Feedback.create`, `processFeedbackEmails` sends a user confirmation + admin alert to `ADMIN_EMAIL`.

Admins manage everything under `/api/admin/feedback/*` (list by user, patch status/notes, reply by email) — available in **all** modes.

---

## Security

* **Cookies** `httpOnly` signed, `secure` in production, `sameSite lax`, `csrf` double-submit (`x-csrf-token` vs `csrf` cookie) + `verifyCsrfOrigin` vs `ALLOWED_ORIGINS` for `MUTATING_METHODS`.
* **Rate limiting** Redis 4 tiers: `global 1000/15m`, `auth 20/15m`, `upload 100/15m`, `public-link 200/15m` — keyed by `userId` or IP.
* **Helmet** `frame-ancestors none`, `CSP default-src` disabled per design, `HSTS`.
* **HMAC** Cloudflare payload|sig `timingSafeEqual`. (Razorpay webhooks were removed with the billing stack.)
* **Passwords** bcrypt cost 12.
* **Token encryption** AES-256-GCM with `OAUTH_TOKEN_ENCRYPTION_KEY` derived sha256, format `iv:cipher:tag`.
* **OAuth** PKCE `S256` for all providers, signed state 5 min.
* **Share tokens** `base64URLEncode(crypto.randomBytes 32)` with expiry.

---

## Deployment

`trust proxy 1` for `X-Forwarded-*`. Graceful `SIGTERM/SIGINT` closes `redisClient` + BullMQ `worker.close()` + `mongoose.disconnect()`.

```bash
# Production on your server
NODE_ENV=production PORT=4000 node --env-file=.env app.js
# or PM2
pm2 start ecosystem.config.js --env production --update-env
pm2 save && pm2 startup
# nginx server_name api.example.com → proxy_pass http://127.0.0.1:4000;
```

Run separate units for jobs: `node --env-file=.env jobs/queueJobs.js scheduler` once, `node --env-file=.env jobs/queueJobs.js worker` × N. `checkEnv()` in `utils/helper.js` fails fast if a required variable is missing.

---

## Postman

Import `postman_collection.json` (generated via `node generate_postman.js`). Set `{{base_url}} = https://api.example.com`, `{{sessionId}}` from the `verify-otp` cookie. Auth cookie flow documented in `docs/`.

Full request/response docs per route group in [`docs/`](./docs/).

---

*Changelog: [`CHANGELOG.md`](./CHANGELOG.md). MIT licensed — see root [`LICENSE`](../LICENSE).*