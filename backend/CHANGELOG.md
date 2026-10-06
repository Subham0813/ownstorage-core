# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-10-06

> First release of this repository (initial commit `58dfc2f`). The `Changed`
> entries below compare this open-source core with the internal production
> codebase it was cut from — there were no earlier releases here.

### Added

- **Open-source core release** — first public, self-hostable build of the OwnStorage backend. Built from the production codebase with the entire billing/subscription stack (Razorpay payments, subscriptions, webhooks, invoice/abandoned-cart/subscription emails) removed. Quotas and plans are administered via database fields (`user.maxQuota`, `user.maxBandwidthQuota`, `user.plan`).
- **MIT license** — see root `LICENSE`.

### Changed

- Plans `PRO_MONTHLY/YEARLY` and `BUSINESS_MONTHLY/YEARLY` collapsed to `PRO` and `BUSINESS`; `PLAN_DETAILS` defines only tier rules (trash retention, public-share caps, grace windows) — no pricing or payment metadata.
- `User.subscription` ref field and `subscriptionExpiresAt` removed; plan enum restricts to `FREE | PRO | BUSINESS`.
- BullMQ schedule reduced to 7 jobs (trash-collector, quota-reaper, session-reaper, bandwidth-reset, share-token-invalidator, public-share-reaper, active-users-sweeper).
- Admin dashboard no longer exposes MRR/revenue; feedback admin endpoints remain available in all modes.
- `APP_MODE=selfhosted` is the documented default in `.env.example`.