# Changelog

All notable changes to this frontend are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This frontend ships inside the `ownstorage-core` monorepo
(`https://github.com/Subham0813/ownstorage-core`) — backend changes are
tracked in [`backend/CHANGELOG.md`](../backend/CHANGELOG.md).

---

## [1.0.0] - 2026-10-06 — Initial Public Release

The repository's first and only release so far — everything below landed in
the initial commit (`58dfc2f`).

### Added

- **Public sharing UI** — `ShareModal.jsx` creates private and public links with expiry. The cap hint (`FREE public links are capped at …`) and the oversized-item pre-block are rendered only when the backend sends finite `user.limits.maxPublicShareFileBytes` / `maxPublicShareBytes`; in self-hosted mode both are `null`, so no hint or pre-block appears. Landing copy (`data/landingContent.js`) advertises `2 GB` free storage — there is no pricing page in this build (`/pricing` is a redirect to `/`).
- **Plan tier styling** — `utils/tierStyles.js` `getTierStyles()` tokens shared by `TopBar`, `AvatarModal`, `Settings` and the admin pages: FREE is sky/blue (`from-sky-400 to-blue-500`), PRO blue→indigo, BUSINESS purple→indigo. This repo has no `PlanCard`, `CurrentPlanBanner` or `Billing` components, and no `/billing` route.
- **Drive integration UI** — `useGoogleDrivePicker.js` via `importAPI.getPickerToken()` → `google.picker.PickerBuilder` with `MULTISELECT_ENABLED`; import entry points in `AllFiles.jsx` and `UploadModal.jsx`.
- **Notifications** — `NotificationBell` polling `GET /api/notifications/unread-count` every 30 s (`GET /api/notifications` list on open).

### Changed

- **Feedback entry point** — `TopBar.jsx`'s account dropdown renders `Settings`, `Report Issue on GitHub` (`${GITHUB_URL}/issues` → `https://github.com/Subham0813/ownstorage-core/issues`) and `Logout`. This build has no `Send Feedback` item and no `FeedbackModal`; `userApi.submitFeedback()` exists but no component calls it. The tiered weekly limits (`FREE 2` / `PRO 5` / `BUSINESS 10`) are enforced server-side by the backend and apply in SaaS mode only.
- **Dashboard quick-access** — `Dashboard.jsx` now `getStarred {limit:6}` + `getRecents {limit:6, days:7}` per sub-endpoint (6 dirs + 6 files each = 24 max), deduped by `id` via a `Map`.
- **Usage polling** — `hooks/useUserUsage.js` is the single `["user-usage"]` query (`staleTime 60s`, `refetchOnWindowFocus` + `refetchOnReconnect`), owned by `AppLayout` and mirrored into `AppContext.user`; invalidation is event-driven (`vd:upload-completed|usage-changed|refresh` plus Zustand `completed` increments) instead of a `setInterval`. `Dashboard.jsx` reads the context rather than issuing its own query.
- **Drive picker error flow** — `AllFiles.jsx` + `UploadModal.jsx` `handleGDriveImport` now treat `400/403` with `drive`/`not connected`/`expired` as `info` → `oauthAPI.googleDriveConnect()` (which stores `oauthOrigin` in `sessionStorage`), not just an error toast.

### Fixed

- Drive picker loop: `400 "Google Drive is not connected"` is no longer a dead toast — the handler shows an info message and redirects through the Drive OAuth connect flow.

### Removed

- **Dead code** — `App.jsx`, `routes/index.jsx` + legacy `publicRoutes/authRoutes/dashboardRoutes/adminRoutes`, `SelectionToolbar.jsx`, `data/dashboardContent.js`, prebuild `sharp` scripts and the `sharp` dependency (none of these exist in this tree; `frontend/package.json` only has `dev`/`build`/`preview` scripts).
