# Changelog

All notable changes to this frontend are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Frontend repo is `Storage-App-Frontend` — backend changes are tracked separately in `Storage-App-Backend/CHANGELOG.md`.

---

## [Unreleased]

### Added

- **FREE public sharing UI** — `ShareModal.jsx` now lets FREE users create public links with a 500 MB per-file hint and pre-blocks oversized files; `PlanLimits` tile added for FREE. Charts in `PricingPage.jsx`, `landingContent.js` and `PricingTermsPage.jsx` updated to show FREE plan sharing as available, capped at 500 MB/file and 2 GB total.
- **FREE plan copy updates** — `PricingPage.jsx` FREE card (and `landingContent.js` / `PricingTermsPage.jsx`) now reflect 2 GB max file size, 2 GB storage, and the public-share caps.

---

## [1.0.0] - 2026-09-01 — Initial Public Release

> Previous `2.0.0` (2026) was internal iteration. First public launch is `1.0.0` — version reset. This entry reflects `frontend@a62ea06` with generic `https://example.com` examples.

### Added

- **Plan UI polish** — `PlanCard.jsx` tier-specific icons (`FREE:cloud`, `PRO:zap`, `BUSINESS:sparkles`), teal `FREE` theme (`from-teal-600 to-cyan-700`, badge/gradient/pill/ring), premium `Current` ribbon and `Most Popular` pill (`blue-600→indigo-600` with glow, rotated notch, dual sparkles) gated `popular && !current`.
- **Billing UI** — `CurrentPlanBanner.jsx` plan-specific icon gradients (`FREE teal`, `PRO blue→indigo`, `BUSINESS purple→indigo`), `Most Popular` handling; `Billing.jsx` tiered empty state (`No billing plan found` vs `Billing unavailable` + `Back to Dashboard`).
- **Drive integration UI** — `useGoogleDrivePicker.js` via `importAPI.getPickerToken()` → `google.picker.PickerBuilder` with `MULTISELECT`, `TopBar` GitHub fallback for selfhosted.
- **Notifications** — `NotificationBell` + `GET /api/notifications` polling.

### Changed

- **Feedback gating (managed-only)** — `TopBar.jsx` shows `Send Feedback` (mail → `FeedbackModal`) only if `isSaaS` (`VITE_APP_MODE=saas`), otherwise `Report Issue on GitHub` (`https://github.com/Subham0813/Storage-App-Backend/issues`). `FeedbackModal.jsx` handles `429` tiered (`FREE 2/week → GitHub`, `PRO 5/week` / `BUSINESS 10/week → mailto:support@example.com`) with amber banner + disabled submit; `405` etc. via `showMessage`.
- **Pricing resilience** — `PricingPage.jsx` guards `rawPlans` with `Array.isArray(rawPlans)` + `FALLBACK_PLANS` to avoid `rawPlans.map is not a function` on malformed cache.
- **Dashboard quick-access** — `Dashboard.jsx` now `getStarred {limit:6}` + `getRecents {limit:6, days:7}` per sub-endpoint (6 dirs + 6 files each = 24 max), deduped by `id`, no `slice` cap (was `8/4` + `slice 12` showing 6).
- **Usage polling** — `hooks/useUserUsage.js` replaced `setInterval 60s` + manual `visibilitychange` with React Query `["user-usage"]` `staleTime 60s` + `refetchOnWindowFocus` + `invalidate` on `vd:upload-completed|usage-changed|refresh` and Zustand `completed` increments; `Dashboard.jsx` `["user-usage"]` aligned to `60s` to match backend `60s` Redis TTL.
- **Drive picker error flow** — `AllFiles.jsx` + `UploadModal.jsx` `handleGDriveImport` now treats `400/403` with `drive/not connected/expired` as `info` → `oauthAPI.googleDriveConnect()` with preserved `oauthOrigin`, not just error toast.

### Fixed

- `PricingPage` crash `rawPlans.map is not a function` when backend cache returned non-array.
- `Billing` dead-end empty state (`Billing unavailable` without navigation) → tiered message + button.
- Drive picker loop: `400 "Google Drive is not connected"` no longer dead toast after OAuth connect (now redirects and respects `isSaaS`).

### Removed

- **Dead code** — `App.jsx`, `routes/index.jsx` + legacy `publicRoutes/authRoutes/dashboardRoutes/adminRoutes`, `SelectionToolbar.jsx`, `data/dashboardContent.js` (455 deletions), prebuild `sharp` scripts and `sharp` dependency.

---

## [2.0.0] - 2026 — Internal (superseded by 1.0.0)

Internal iteration with subscription status handling, mode-awareness (`isSaaS`/`VITE_APP_MODE`), UI improvements. Kept for history.

## [0.x] — Earlier

Refactors: `isDirItem` + public-link helpers, `FileGrid`/`FolderGrid` consolidation.

