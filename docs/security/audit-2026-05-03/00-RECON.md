# Phase 0 — Codebase Reconnaissance

**Audit date:** 2026-05-03
**Repository:** [team1-india](../../../) at branch `test`
**Auditor:** Claude (autonomous agent orchestration)
**Scope:** Full codebase per spec v3.0 (no exclusions; speedrun module included)

This document is the consolidated map. Per-step depth lives in [`category-scans/recon-*.md`](category-scans/).

---

## Step 1 — Repository Structure

| Top-level dir | Purpose |
|---|---|
| [app/](../../../app/) | Next.js 16 App Router — pages, layouts, API routes |
| [components/](../../../components/) | Shared React components |
| [lib/](../../../lib/) | Server + client utilities (auth, wallet, permissions, email, encryption, PWA) |
| [prisma/](../../../prisma/) | Schema, migrations (8 total), seed |
| [public/](../../../public/) | Static assets, generated `sw.js` (~52 KB), `push-sw.js`, PWA icons |
| [scripts/](../../../scripts/) | DB ops (migrate-pii, reset-db, add-author-email, upload-hero-video) |
| [hooks/](../../../hooks/), [types/](../../../types/) | Client hooks, TS types |
| [docs/](../../../docs/) | Internal docs incl. `00-CODEBASE-INDEX.md`, `05-SPEEDRUN.md` |

**Build & deploy:** Next.js 16.1.1 via `prisma generate && next build --webpack` ([package.json:7](../../../package.json#L7)). Vercel-only; **no Docker, no Terraform/CDK/Helm, no Supabase/Firebase config**. CI: [`.github/workflows/`](../../../.github/workflows/) **exists but is empty** — no GitHub Actions pipelines.

**Runtime:** Node default (no `runtime: "edge"` in any route handler). Single global Next.js middleware at [middleware.ts](../../../middleware.ts).

**Detail:** [recon-1-2-11-12-iac-secrets.md §Step 1](category-scans/recon-1-2-11-12-iac-secrets.md)

---

## Step 2 — Dependencies & Supply Chain

- **34 production deps**, all version-pinned with `^` or exact (no `*` / `latest`).
- **Lockfile:** `bun.lock` committed.
- **No `overrides` / `resolutions` / patches** in [package.json](../../../package.json).
- **No postinstall / prepare hooks**; `prisma generate` runs at build only.
- **Notable third-party JS in client bundle:** `@blocknote/*` (rich text), `@tiptap/*` (rich text), `react-markdown`, `three` + `@react-three/*` (3D), `@vercel/analytics`, `framer-motion`. **No** Sentry SDK, **no** chat widget, **no** ad SDK.
- **Notable absent integrations:** Stripe, Resend, SendGrid, Twilio, Discord, OpenAI, Anthropic, Supabase, Firebase, Algolia (verified by import grep).
- **No SBOM, no SAST/SCA, no Dependabot/Renovate config** in repo.

**Detail:** [recon-1-2-11-12-iac-secrets.md §Step 2](category-scans/recon-1-2-11-12-iac-secrets.md)

---

## Step 3 — Function & Endpoint Inventory

**~154 `route.ts` handlers** under [app/api/](../../../app/api/), grouped:

| Group | Routes | Notes |
|---|---|---|
| `speedrun/*` | 18 | Active redesign (per memory). Per-month registrations, teams, runs, tracks, registrations export. |
| `public/*` | 13 | Public read-only content endpoints |
| `auth/*` | 13 | NextAuth `[...nextauth]` + 2FA setup/verify/disable + passkey register/auth |
| `projects/*` | 12 | Project CRUD + versioning + likes + showcase |
| `quests/*` | 7 | Quest CRUD + completions (awards XP/points) |
| `bounty/*` | 6 | Bounty postings + submissions (awards XP/points) |
| `cron/*` | 7 | All gated by `Authorization: Bearer ${CRON_SECRET}` only |
| `swag/*` | 6 | Inventory + orders (spends points) |
| `push/*` | 5 | Push subscription + send + VAPID + preferences |
| `members/*` | 5 | Member CRUD + permissions update + tags |
| `wallet/*` | 5 | User wallet read/transactions |
| `analytics/*` | 4 | Event ingest + funnel + stats |
| `experiments/*` | 4 | A/B test mgmt |
| `playbooks/*` | 4 | Playbook content |
| `monitoring/*` | 3 | Health, slow-queries, errors (auth-gated for CORE) |
| `admin/*` | 2 | `/admin/public-users` (CORE+FULL_ACCESS) and one more |
| Misc (≤2 each) | ~50 | applications, contributions, community-members, guidelines, media, data-grid, profile, notifications, event-feedback, operations, luma-events, avatars, announcements, attendance, action-items, comments, content, notes, polls, logs, leaderboard, mediakit, seed, settings, upload |

**Triggers:**
- HTTP (all groups above)
- Cron: 7 jobs in [vercel.json:2-31](../../../vercel.json) (sync-events, cleanup, aggregate-analytics, aggregate-health, expire-points, send-scheduled-emails, speedrun-status)
- **No queue consumers, no DB stream triggers, no S3 event triggers, no GraphQL, no WebSocket, no SSE.**
- **No inbound webhooks** found (Luma is polled via cron, not pushed).

**Auth pattern (varies):**
- Most use `getServerSession(authOptions)` from NextAuth.
- Most also call `checkCoreAccess(session)` or `checkSpeedrunAccess(session, level)` from [lib/permissions.ts](../../../lib/permissions.ts) — but **inconsistently** (sample WITH/WITHOUT in §Step 5 below).
- Cron jobs use header bearer token only — **no HMAC, no IP allowlist** ([app/api/cron/expire-points/route.ts:9-12](../../../app/api/cron/expire-points/route.ts#L9-L12) example).

---

## Step 4 — Authentication & Identity Map

**Library:** [next-auth v4.24.13](../../../package.json) with **Google OAuth only** (no credentials provider; no passwords stored at all in `Member`).
**Config:** [lib/auth-options.ts](../../../lib/auth-options.ts)

**Token issuance:**
- JWT strategy ([lib/auth-options.ts:198](../../../lib/auth-options.ts#L198)) with `maxAge: 30 days`.
- `signIn` callback ([lib/auth-options.ts:13-86](../../../lib/auth-options.ts#L13-L86)) tries to find the email in `Member` → `CommunityMember` → `PublicUser` (in that order); creates `PublicUser` if none exist.
- `jwt` callback ([lib/auth-options.ts:87-176](../../../lib/auth-options.ts#L87-L176)) populates `token.role`, `token.permissions`, `token.id`, `token.communityMemberId`, `token.publicUserId`.
- `session` callback ([lib/auth-options.ts:177-190](../../../lib/auth-options.ts#L177-L190)) projects token claims onto `session.user`.

**Verification:** middleware + per-route `getServerSession`. **No edge runtime token verification** — every route re-derives session from cookie.

**Cookies:**
- Production: `__Secure-next-auth.session-token` ([lib/auth-options.ts:201-211](../../../lib/auth-options.ts#L201-L211)), `httpOnly`, `secure`, `sameSite: lax`.
- CSRF token cookie present ([lib/auth-options.ts:223-233](../../../lib/auth-options.ts#L223-L233)).

**Refresh / logout:** No refresh-token rotation (NextAuth JWT renews via session callback when accessed). Logout clears cookie only — **no server-side JWT revocation list**, no `tokenVersion` counter.

**Password storage:** None — Google OAuth only.

**Email verification / password reset:** N/A (no password flows).

**MFA:**
- Optional TOTP in `TwoFactorAuth` model + WebAuthn passkeys in `Passkey` model ([prisma/schema.prisma:1146-1177](../../../prisma/schema.prisma#L1146-L1177)).
- Enforcement is **feature-flagged behind `ENABLE_2FA`** in [middleware.ts](../../../middleware.ts) and **only redirects CORE users** (members/public not gated).
- Disable/passkey-register routes do NOT write to AuditLog (see Step 13).

**OAuth:** Google only. PKCE handled by NextAuth. Account linking by email — **no domain allowlist**, signup is open to any Google account; `signIn` returns `true` even if no Member/CommunityMember exists (creates `PublicUser`).

**Session storage:** JWT-only (no DB session table).

---

## Step 5 — RBAC: Roles, Permissions, Hierarchy

**Three roles** assigned in [lib/auth-options.ts:110,126,141](../../../lib/auth-options.ts):
1. `CORE` — internal team; comes from `Member` row.
2. `MEMBER` — community contributor; comes from `CommunityMember` row.
3. `PUBLIC` — open signup; comes from `PublicUser` row.

**Hierarchy:** Implicit — no integer ladder. CORE has access via `permissions` JSON map; the others have no permissions JSON.

**Per-resource permissions JSON** on `Member.permissions` ([prisma/schema.prisma:16](../../../prisma/schema.prisma#L16)):
- Default: `{"default": "READ"}`
- Possible values: `READ`, `WRITE`, `FULL_ACCESS`, `DENY`
- Examples: `{"members": "WRITE", "speedrun": "READ", "*": "FULL_ACCESS"}`
- Special key `"*"` acts as superuser; `default` is fallback.

**Helpers** (all in [lib/permissions.ts](../../../lib/permissions.ts)):
- `hasPermission(userPermissions, resource, requiredLevel)` (L10-40) — hierarchical READ ⊂ WRITE ⊂ FULL_ACCESS.
- `checkCoreAccess(session)` (L42-51) — returns `{authorized, response}`; CORE-only gate.
- `checkSpeedrunAccess(session, requiredLevel)` (L62-87) — CORE-only with explicit `speedrun` resource override; defaults to WRITE.

**Sample of routes WITH explicit guard:**
- [app/api/members/route.ts:20-27](../../../app/api/members/route.ts#L20-L27)
- [app/api/speedrun/runs/route.ts:10-13,31-34](../../../app/api/speedrun/runs/route.ts)
- [app/api/admin/public-users/route.ts:20-25](../../../app/api/admin/public-users/route.ts#L20-L25)
- [app/api/settings/route.ts:15-16](../../../app/api/settings/route.ts#L15-L16)
- [app/api/members/[id]/permissions/route.ts:22-26](../../../app/api/members/[id]/permissions/route.ts) (FULL_ACCESS required)

**Sample of routes WITHOUT explicit `checkCoreAccess` (rely on session existence + role-based content filtering):**
- [app/api/quests/route.ts:5-45](../../../app/api/quests/route.ts#L5-L45)
- [app/api/bounty/route.ts:25-50](../../../app/api/bounty/route.ts#L25-L50)
- `app/api/contributions/route.ts`
- `app/api/profile/route.ts`
- `app/api/wallet/route.ts`

**Default signup role:** `PUBLIC` (via `PublicUser` creation in [lib/auth-options.ts](../../../lib/auth-options.ts) signIn fallback).

**Role assignment endpoints:** [app/api/members/[id]/permissions/route.ts](../../../app/api/members/[id]/permissions/route.ts) (CORE w/ FULL_ACCESS only). Promotion to CORE = creating a `Member` row; no in-app endpoint found — done via DB seed/script.

**Role revocation flow:** No explicit endpoint. `Member.deletedAt` is a soft-delete; signIn callback does not appear to check `deletedAt` (Cat 1 will verify).

**Service accounts / API keys:** None — only the `CRON_SECRET` bearer token grants elevated access (effectively system role for cron jobs).

**Impersonation feature:** None found.

**Role storage:** Single source of truth = the table the user came from (`Member` / `CommunityMember` / `PublicUser`); `role` claim in JWT is the cached projection.

---

## Step 6 — Admin Panel & UI Surface

| Surface | Path | Auth gate | Required role | Notes |
|---|---|---|---|---|
| Public site | [app/public/](../../../app/public/) | None | — | Marketing pages, public content |
| Auth pages | [app/auth/](../../../app/auth/) | Anonymous | — | login, setup-2fa, verify-2fa |
| Speedrun member surface | [app/speedrun/](../../../app/speedrun/) | Some pages public, some user-scoped | PUBLIC+ | Per-month registrations, team pages |
| Member dashboard | [app/member/](../../../app/member/) | Session required | MEMBER or higher | 23 pages |
| **Core dashboard** | [app/core/](../../../app/core/) | [app/core/layout.tsx:20-23](../../../app/core/layout.tsx#L20-L23) **server redirect if `role !== 'CORE'`** | CORE | 59 pages including admin |
| **Admin sub-panel** | [app/core/admin/](../../../app/core/admin/) | Same CORE layout + per-route `checkCoreAccess` | CORE (sometimes + FULL_ACCESS) | Inside core; not a separate origin |
| **Speedrun admin** | [app/core/speedrun/](../../../app/core/speedrun/) | CORE layout + `checkSpeedrunAccess` | CORE w/ speedrun WRITE | Run/registration management |

**Critical observation:** **There is only one origin / one Next.js app**. Admin and member panels are **routes within the same app**, share the same JWT cookie, the same JS bundle pipeline, and the same API. There is **no IP allowlist, no VPN gate, no separate admin hostname, no mTLS** on admin routes.

**Bundle separation:** None — admin code lives in the same Next.js app and is bundled by the same Webpack config.

**MFA on admin:** Optional (TOTP/passkeys), behind feature flag `ENABLE_2FA`, and only the CORE redirect gate runs.

**Admin session timeout:** Same as member — 30 days JWT.

**Admin error pages:** Standard Next.js error.js / not-found.js (Cat 5 will verify they don't echo input).

---

## Step 7 — Data Model & Visibility

**50 Prisma models** in [prisma/schema.prisma](../../../prisma/schema.prisma) (1177 lines).

**Sensitive-field classification (highlights):**

| Sensitivity | Models / fields |
|---|---|
| **Auth secrets** | `TwoFactorAuth.totpSecret`, `TwoFactorAuth.recoveryCodes` (L1146-1162); `Passkey.credentialId`, `Passkey.publicKey` (L1164-1177) |
| **PII** | `Member.{email,name}`, `CommunityMember.{email,name,xHandle,telegram}`, `PublicUser.{email,fullName,city,country,signupIp}`, `MemberExtraProfile.{city,country,roles,interests,skills}`, `Application.{applicantEmail,data}`, `Contribution.{name,email}`, **`SpeedrunRegistration.{userEmail,fullName,phone,city,twitterHandle,githubHandle}`** (L1033-1074), `SpeedrunTeamMember.email` |
| **Financial / economy** | `UserWallet.{totalXp,pointsBalance,totalEarned,totalSpent,totalExpired}`, `PointsBatch.{amount,remaining}`, `WalletTransaction.{pointsAmount,xpAmount,type}`, `Bounty.{xpReward,pointsReward,cash}`, `BountySubmission.{xpAwarded,pointsAwarded,status}`, `QuestCompletion.{xpAwarded,pointsAwarded}`, `SwagItem.{pointsCost,totalStock,remainingStock}`, `SwagOrder.{pointsSpent,shippingAddress,status}` |
| **KYC / vault** | `PersonalVault` (L625-641) — encrypted PII (email/name/phone) + HMAC search index |
| **Internal / moderation** | `Member.{permissions,status,tags}`, `Application.status`, `Contribution.status`, `BountySubmission.status` (pending/approved/rejected) |
| **Audit / system** | `AuditLog`, `Log`, `RateLimit`, `ApiHealthLog`, `AnalyticsEvent` (incl. `userEmail`, `sessionId`, `signupIp`-equivalent device/browser/country) |
| **Public** | `Playbook`, `Guide`, `Project`, `ContentResource`, `Announcement`, `Poll`, `MediaItem`, `LumaEvent` |

**Field × role visibility matrix** is built in [03-MATRICES.md](03-MATRICES.md) after Phase 2.

**Notable design choice:** `PersonalVault` provides AES-encrypted storage with searchable HMAC index for the highest-sensitivity PII; whether all PII flows through it is a Phase 2 question (Cat 13).

---

## Step 8 — Points-Economy Map

**Core file:** [lib/wallet.ts](../../../lib/wallet.ts) — single source of truth.

| Function | Lines | Purpose | Atomicity | Audit | Idempotency | Rate-limit |
|---|---|---|---|---|---|---|
| `earnReward` | L28-78 | Add XP+points with TTL (default 90 days) | Wrapped in `prisma.$transaction` | **Only `WalletTransaction`, no `AuditLog`** | None visible — caller responsible | None at this layer |
| `spendPoints` | L86-152 | FIFO debit across `PointsBatch` rows | `prisma.$transaction` with `Prisma.TransactionIsolationLevel.Serializable` (L150) | Only `WalletTransaction` | None visible | None at this layer |
| `expirePoints` | L159-207 | Cron job; expires unspent points | Loop + per-user TX | Only `WalletTransaction` | Idempotent on re-run (only expires `expiresAt < now`) | N/A — cron |
| `adminAdjust` | L212-262 | Manual ±XP/points by CORE admin | TX | **`WalletTransaction.type='ADMIN_ADJUST'`, NO `AuditLog`** | None | None |

**Callsites that grant points:**
- Quest completions: `app/api/quests/completions/route.ts` (calls `earnReward` on approval).
- Bounty submission approval: `app/api/bounty/submissions/route.ts` (calls `earnReward` on approval).
- Admin manual: `adminAdjust` exposed via admin route(s) — Cat 12 will enumerate.

**Callsites that spend points:**
- Swag redemption: `app/api/swag/orders/route.ts` (calls `spendPoints`).

**Cron expiry:** [app/api/cron/expire-points/route.ts](../../../app/api/cron/expire-points/route.ts), gated by `CRON_SECRET`.

**No transfer-between-users** path in code (no peer-to-peer points).

**Negative amounts:** `adminAdjust` accepts negative values explicitly; `earnReward` and `spendPoints` validation is checked in Cat 12.

**Integer vs float:** Prisma `Int` for `pointsAmount`, `xpAmount`, balances (verified in [prisma/schema.prisma](../../../prisma/schema.prisma) L676-706).

**Currency / KYC threshold:** `Bounty.cash` is INR (optional, separate path); points-as-money risk applies. **No KYC enforcement on swag redemption found** — cross-checked in Cat 12.

**Time source for daily/streak bonuses:** Server `new Date()` only (good); confirmed no client-supplied timestamps in [lib/wallet.ts](../../../lib/wallet.ts).

---

## Step 9 — PWA Surface

**Generator:** `@ducanh2912/next-pwa` v10.2.9; SW emitted to [public/sw.js](../../../public/sw.js) (~52 KB) plus [public/push-sw.js](../../../public/push-sw.js).

**Caching strategies** ([next.config.ts:101-232](../../../next.config.ts)):
- `^/api/public/.*` → NetworkFirst, 1h, **blocks cache if `Authorization` or `Set-Cookie` header present** ✅
- `^/api/(core|member|auth)/.*` → NetworkOnly ✅ (auth APIs never cached)
- Vercel Blob images → NetworkOnly
- Static images → CacheFirst, 30 days
- Static JS/CSS → SWR, 7 days
- `/core.*` HTML → NetworkFirst, **5-min TTL** ⚠️ (could serve stale CORE dashboard pages on shared device)
- `/public.*` HTML → SWR, 1h
- `/(public/)?playbooks.*` → CacheFirst, 7 days

**Push handler** ([public/push-sw.js:3-31](../../../public/push-sw.js#L3-L31)):
- Trusts `payload.data.url` and opens it on `notificationclick` with **no origin check** — flagged for Cat 15.

**No web manifest** in [public/](../../../public/) — no `manifest.json` / `manifest.webmanifest` present.

**No SW background sync handler.** Replay logic is client-side via [lib/backgroundSync.ts](../../../lib/backgroundSync.ts) using IndexedDB queue (no auth re-check on flush).

**IndexedDB:** [lib/offlineStorage.ts](../../../lib/offlineStorage.ts) — DB `team1-offline` v1, stores `pendingActions` (action payloads + idempotencyKey + status + timestamp) and `drafts` (form drafts with expiresAt). **Stored in plaintext.**

**SessionStorage:** [lib/encryptedSession.ts](../../../lib/encryptedSession.ts) — AES-GCM encrypted session blob; **PBKDF2 key derived from device ID with static salt** ⚠️ flagged for Cat 15/20.

**LocalStorage:** Analytics counters, device ID (plaintext), preferences (per [lib/pwaAnalytics.ts](../../../lib/pwaAnalytics.ts), [lib/offlineAnalytics.ts](../../../lib/offlineAnalytics.ts)).

**Push subscription:** PushSubscription model L463-474; routes under [app/api/push/](../../../app/api/push/) for subscribe/vapid-key/unsubscribe/send/preferences. Subscription bound to `userEmail`.

**Detail:** [recon-9-pwa-storage.md](category-scans/recon-9-pwa-storage.md)

---

## Step 10 — Trust Boundaries & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Browser  ──HTTPS──▶  Vercel Edge  ──▶  Next.js Function   │
│     │                    (CDN +              (Node 20,      │
│     ▼                    auto WAF)            us-east-1?    │
│  Service Worker                                Vercel mngd) │
│  IndexedDB                                        │         │
│  sessionStorage                                   ▼         │
│  localStorage                              Postgres (DB)    │
│                                            │                │
│                                            ▼                │
│                       ┌────────────────────┐                │
│                       │ External services: │                │
│                       │  - Google OAuth    │                │
│                       │  - Luma API (poll) │                │
│                       │  - Google Calendar │                │
│                       │  - SMTP (nodemailer)│               │
│                       │  - Vercel Blob     │                │
│                       │  - Cloudinary      │                │
│                       │  - Web Push        │                │
│                       └────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

**Untrusted entry points:**
1. HTTP body / query / path / headers / cookies on every `app/api/*/route.ts`.
2. OAuth callback from Google.
3. Push subscription payload (server-controlled, but reachable).
4. SW message channel.
5. IndexedDB-replayed requests on reconnection.
6. Cron secret holder (Vercel infrastructure trust).
7. Luma poll response (cron consumer).
8. Webhook URL from `NEXT_PUBLIC_SLACK_WEBHOOK_URL` — outbound but exposed.

**Boundaries that re-verify:** API routes that use `getServerSession + checkCoreAccess` (subset).
**Boundaries that DON'T re-verify:** Cron handlers (trust the bearer token); `lib/wallet.ts` functions (trust caller); `lib/email.ts` (trusts caller).

---

## Step 11 — Secrets, Env Vars, Configuration

**32 env vars referenced:**
- **Secrets (16):** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CRON_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `BLOB_READ_WRITE_TOKEN`, `CLOUDINARY_*`, `VAPID_PRIVATE_KEY`, `LUMA_API_KEY`, `GOOGLE_CALENDAR_*`, `ENCRYPTION_KEY` / `PII_ENCRYPTION_KEY`, `HMAC_INDEX_KEY`.
- **`NEXT_PUBLIC_*` exposed in client bundle (10):** `NEXT_PUBLIC_ADMIN_EMAIL`, `NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT`, `NEXT_PUBLIC_ALERT_WEBHOOK_URL`, `NEXT_PUBLIC_ANALYTICS_ENDPOINT`, `NEXT_PUBLIC_HERO_VIDEO_URL`, `NEXT_PUBLIC_HERO_VIDEO_URL_MP4`, `NEXT_PUBLIC_PWA_MONITORING_ENDPOINT`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SLACK_WEBHOOK_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- **Config:** `NODE_ENV`, `ENABLE_2FA`, `NEXT_PUBLIC_BASE_URL`, etc.

**🚩 `NEXT_PUBLIC_SLACK_WEBHOOK_URL`** — Slack incoming webhooks accept anonymous POST; exposing the URL in the client bundle lets any visitor post to your Slack channel forever (until rotated). Flagged Critical for Cat 16.

**🚩 `NEXT_PUBLIC_ALERT_WEBHOOK_URL`** — same risk vector.

**Secret-pattern grep:** No `AKIA*`, `ghp_*`, `sk_live_*`, `sk-*`, `eyJ*`, `BEGIN PRIVATE KEY` hits in tracked source.

**`.env*` git-ignored** ([.gitignore:34-35](../../../.gitignore#L34-L35)). No `.env.example` to leak structure.

**Single `DATABASE_URL` across envs** — Vercel preview deployments may share the prod DB unless preview env-protection is configured at the Vercel project level (Open Assumption #1 below).

**Detail:** [recon-1-2-11-12-iac-secrets.md §Step 11](category-scans/recon-1-2-11-12-iac-secrets.md)

---

## Step 12 — Third-Party Integrations

| Integration | Used for | Credential | Inbound webhook? | Outbound | Risk surface |
|---|---|---|---|---|---|
| Google OAuth | Authentication | `GOOGLE_CLIENT_ID/SECRET` | OAuth callback | Token exchange | OAuth state, redirect URI handling |
| Google Calendar | Operation event sync | service account/OAuth | None | API call | Token storage, scope creep |
| Luma | Event sync (poll) | `LUMA_API_KEY` | None | Cron HTTP GET | SSRF if URL configurable; data trust |
| Vercel Blob | File hosting | `BLOB_READ_WRITE_TOKEN` | None | SDK PUT | Bucket policy, signed URL TTL |
| Cloudinary | Image hosting (upload via API) | `CLOUDINARY_*` | None | SDK | Same |
| SMTP / nodemailer | Email send | `SMTP_USER/PASSWORD` | None | SMTP | SMTP creds, header injection |
| Web Push (web-push lib) | Notifications | `VAPID_PRIVATE_KEY` | None | HTTP push to FCM/APNs | Subscription hijack |
| Slack (incoming webhook) | Alerts | `NEXT_PUBLIC_SLACK_WEBHOOK_URL` | None | POST | **URL in client bundle (Critical)** |
| Vercel Analytics | Metrics | n/a | None | SDK | Cross-tenant analytics leak unlikely |

**No** Stripe, Twilio, Discord, OpenAI, Anthropic, Supabase, Firebase, Algolia.

**Inbound webhook signature verification:** N/A — no inbound webhooks exist.

---

## Step 13 — Logging, Monitoring, Audit

**412+ logging callsites across 191 files.** Custom helpers:
- `log(...)` ([lib/logger.ts:39](../../../lib/logger.ts#L39))
- `logActivity(...)` → `Log` table ([lib/logger.ts:73](../../../lib/logger.ts#L73))
- `logAudit(...)` → `AuditLog` table ([lib/audit.ts:34](../../../lib/audit.ts#L34))

**🚩 No redaction helper.** [lib/auth-options.ts:79](../../../lib/auth-options.ts#L79) logs `user.email` plaintext on every signin.

**AuditLog coverage:**
| Action | Audited? | Where |
|---|---|---|
| Media create/update/delete | ✅ | `app/api/media/...` |
| Mediakit create | ✅ | `app/api/mediakit/route.ts:89` |
| Experiment create | ✅ | `app/api/experiments/route.ts:129` |
| Playbook create | ✅ | `app/api/playbooks/route.ts:128-129` |
| Operation create | ✅ | `app/api/operations/route.ts:64-65` |
| Speedrun run create | ✅ | `app/api/speedrun/runs/route.ts:143` |
| Cron-driven speedrun status | ✅ | `app/api/cron/speedrun-status/route.ts:83` |
| Permissions change | ✅ via `logActivity` (separate `Log` table) | `app/api/members/[id]/permissions/route.ts:49-55` |
| **Points grant / spend / expire / admin adjust** | ❌ NOT audited (only `WalletTransaction`) | [lib/wallet.ts](../../../lib/wallet.ts) |
| **Admin / any login** | ❌ NOT audited | [lib/auth-options.ts](../../../lib/auth-options.ts) |
| **2FA enable / disable / passkey register** | ❌ NOT audited | `app/api/auth/2fa/...` |
| **Member status / tags change** | ❌ NOT audited | `app/api/members/[id]/...` |
| **Swag redemption** | ❌ NOT audited (only `SwagOrder` row) | `app/api/swag/orders/...` |
| **Speedrun registration export** | ❌ NOT audited | `app/api/speedrun/registrations/export/...` |

**AuditLog integrity:** Schema has `deletedAt` ([prisma/schema.prisma:289](../../../prisma/schema.prisma#L289)) — soft-delete is **possible**, no DB constraint preventing it. Anyone with DB access (or a `prisma.auditLog.update` callsite added later) could prune.

**Sentry:** `NEXT_PUBLIC_SENTRY_DSN` exposed but **no `Sentry.init` found** in source — DSN exposed without an active integration (or initialized client-side outside source-tree). Confirmed for Cat 25.

**APM:** None (no Datadog, New Relic, OTel).

**Public metrics:** [/api/monitoring/health](../../../app/api/monitoring/health/route.ts), [/api/monitoring/slow-queries](../../../app/api/monitoring/slow-queries/route.ts), [/api/monitoring/errors](../../../app/api/monitoring/errors/route.ts) — agent reports they are auth-gated for CORE; verified in Cat 25.

**Detail:** [recon-13-logging-tests.md](category-scans/recon-13-logging-tests.md)

---

## Step 14 — Test Coverage of Security Paths

**🚩 ZERO automated tests in the repository.** No `*.test.*`, no `*.spec.*`, no `__tests__/` directory. This means:
- No tests for auth failure (401/403)
- No tests for permission denial
- No tests for IDOR / cross-user access
- No tests for rate limiting
- No tests for idempotency
- No tests for race conditions in `lib/wallet.ts` `spendPoints` (Serializable TX is unverified)
- No tests for input validation
- No tests for any wallet path

**Implication for the audit:** every behavioral claim about the code must be derived from reading source; no test fixtures are available to confirm runtime semantics.

---

## Step 15 — Open Assumptions

These cannot be derived from the source tree. Treat all Phase 2 findings under these conditions as **Suspected** rather than Confirmed where they depend on these:

1. **Vercel project settings** — WAF rules, IP allowlists, environment-protection on production deploys, preview-deployment env scope (whether previews share prod `DATABASE_URL`/`NEXTAUTH_SECRET`).
2. **Vercel Blob bucket policies & signed-URL TTL defaults.**
3. **Cloudinary upload preset config** (signed vs unsigned, allowed transformations).
4. **SMTP provider** (Gmail SMTP based on default in [lib/email.ts](../../../lib/email.ts)) — sending limits, SPF/DKIM/DMARC posture.
5. **Real entropy of `CRON_SECRET`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, `HMAC_INDEX_KEY`** — we audit *usage patterns*, not values.
6. **DPAs / vendor contracts** with Google, Vercel, Cloudinary, Luma, SMTP provider — referenced in Cat 27.
7. **Production Postgres network ACLs** (whether the DB is publicly reachable or VPC-restricted).
8. **CDN cache key configuration** at Vercel (whether per-user variants are correctly keyed).
9. **Number of CORE admins with `"*": "FULL_ACCESS"`** — separation-of-duties analysis depends on this. (1 person → no separation; 5+ → some separation.)
10. **Whether `ENABLE_2FA` is `"true"` in production** — feature-flag determines whether MFA is even enforced for CORE.

---

## End of Phase 0

**Coverage:** All 15 recon steps complete. Three per-step deep-dives in [`category-scans/recon-*.md`](category-scans/) for steps 1, 2, 9, 11, 12, 13, 14.

**Next:** Phase 1 (threat model) ingests this map and produces [01-THREAT-MODEL.md](01-THREAT-MODEL.md).
