# Phase 1 — Threat Model

**Audit date:** 2026-05-03
**Repository:** [team1-india](../../../) at branch `test`
**Auditor:** Claude (autonomous agent orchestration)
**Phase 0 inputs:** [00-RECON.md](00-RECON.md), [recon-1-2-11-12-iac-secrets.md](category-scans/recon-1-2-11-12-iac-secrets.md), [recon-9-pwa-storage.md](category-scans/recon-9-pwa-storage.md), [recon-13-logging-tests.md](category-scans/recon-13-logging-tests.md)

This document maps trust boundaries, names the actors who can credibly attack the system, ranks the assets they would target, ranks the endpoints that gate those assets, and surfaces the regulatory regimes that apply. It is the bridge from "what exists" (Phase 0) to "what to test" (Phase 2).

---

## 1. Trust Boundary Diagram

Each `═══` line is a trust boundary. Annotations show what crosses it and whether the receiving side re-verifies authentication / authority.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  USER DEVICE (untrusted — fully attacker-controllable on a compromised box)  │
│                                                                              │
│   Browser tab                                                                │
│    ├── DOM / JS bundle (incl. NEXT_PUBLIC_* env values)                      │
│    ├── localStorage     (device-id, pwa-analytics, offline-analytics-buffer) │
│    ├── sessionStorage   (encrypted-session: AES-GCM, key from device-id)     │
│    ├── IndexedDB        (team1-offline: pendingActions, drafts — PLAINTEXT)  │
│    ├── Cache API        (sw caches: public-api, image, static, core-pages…)  │
│    └── Service Workers                                                       │
│         ├── /sw.js         (workbox runtime caching)                         │
│         └── /push-sw.js    (push handler — TRUSTS payload.data.url)          │
│                                                                              │
│   Crosses boundary ↓:                                                        │
│     • __Secure-next-auth.session-token  (HttpOnly, Secure, SameSite=Lax)    │
│     • next-auth.csrf-token                                                   │
│     • Replayed pendingActions (with original headers — possibly stale JWT)   │
│     • PushSubscription endpoint+keys (POST to /api/push/subscribe)           │
│     • Vercel Blob direct PUT (with token from /api/upload/token)             │
│     • Client → NEXT_PUBLIC_SLACK_WEBHOOK_URL (anonymous POST, anyone can)    │
│                                                                              │
└────────────────────────────────────────┬─────────────────────────────────────┘
                                         │  HTTPS (TLS terminates at edge)
═══════════════════════════════ TRUST BOUNDARY 1 ═══════════════════════════════
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  VERCEL EDGE (CDN + auto-WAF, Vercel-managed)                                │
│                                                                              │
│   • TLS termination, HSTS preload                                           │
│   • CSP applied via Next.js headers (next.config.ts:3-45)                   │
│   • Edge cache keyed by URL — caches /public.* HTML for 1h SWR              │
│   • Cron scheduler (vercel.json:2-31) → POST /api/cron/* with               │
│     Authorization: Bearer ${CRON_SECRET}                                     │
│                                                                              │
│   Re-verifies auth here? **N** — Vercel edge does not understand            │
│   NextAuth JWT; passes the cookie through. CSP is policy, not auth.         │
│                                                                              │
└────────────────────────────────────────┬─────────────────────────────────────┘
                                         │  Internal Vercel network
═══════════════════════════════ TRUST BOUNDARY 2 ═══════════════════════════════
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  NEXT.JS SERVERLESS FUNCTION (Node 20, region: Vercel-managed)               │
│                                                                              │
│   • [middleware.ts](../../../middleware.ts) — only redirects CORE for 2FA    │
│     (gated by ENABLE_2FA flag); does NOT enforce auth on most paths.        │
│   • Per-route handlers in [app/api/](../../../app/api/) (~154 routes)        │
│      ├── Some call `getServerSession + checkCoreAccess` (CORE-gated)        │
│      ├── Some call only `getServerSession` (any-session-gated)              │
│      ├── Public/* routes: no session required                               │
│      └── Cron/* routes: ONLY check `Authorization: Bearer ${CRON_SECRET}`   │
│                                                                              │
│   Re-verifies auth here? **Y** for routes that call checkCoreAccess /       │
│     checkSpeedrunAccess; **PARTIAL Y** for session-only routes (no role     │
│     check, just "logged in"); **N** for cron (single shared bearer);        │
│     **N** for /api/public/* (anonymous by design).                          │
│                                                                              │
│   • Server-side libraries:                                                  │
│      ├── [lib/wallet.ts](../../../lib/wallet.ts) — TRUSTS caller; no        │
│      │   audit-log writes (recon-13 §4)                                     │
│      ├── [lib/email.ts](../../../lib/email.ts) — TRUSTS caller              │
│      ├── [lib/audit.ts](../../../lib/audit.ts) — TRUSTS caller              │
│      └── [lib/permissions.ts](../../../lib/permissions.ts) — the gate       │
│                                                                              │
└──┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────────┘
   │         │         │         │         │         │         │
═══│═════════│═════════│═════════│═════════│═════════│═════════│══ TB 3 ═══════
   │         │         │         │         │         │         │
   ▼         ▼         ▼         ▼         ▼         ▼         ▼
┌─────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌──────────┐ ┌──────┐ ┌──────────────┐
│ PG  │ │ Google │ │ Luma │ │ Google │ │ SMTP     │ │ Web  │ │ Vercel Blob  │
│ DB  │ │ OAuth  │ │ API  │ │ Cal.   │ │(nodemail)│ │ Push │ │ + Cloudinary │
│     │ │        │ │      │ │ API    │ │          │ │ FCM/ │ │              │
│     │ │  ID    │ │ key  │ │ refresh│ │ user/pw  │ │ APNs │ │ tokens       │
│     │ │ secret │ │      │ │ token  │ │          │ │ VAPID│ │              │
└──┬──┘ └────────┘ └──────┘ └────────┘ └──────────┘ └──────┘ └──────────────┘
   │
Crosses boundary 3:
  • DATABASE_URL (full read/write to all 50 models, incl. PersonalVault,
    UserWallet, AuditLog, Member.permissions). Single URL across envs —
    preview deployments may share prod DB (Open Assumption #1).
  • Re-verifies auth here? **N** — Postgres trusts whoever holds the URL.
    Application enforces row-level access in code; DB has no RLS.

Crosses boundary to Google OAuth:
  • CLIENT_ID/SECRET on token exchange (server-side)
  • OAuth state + PKCE handled by NextAuth
  • Re-verifies? **Y** at Google's end (signature on id_token).
    Returning user info → trusted by lib/auth-options.ts:13-86.

Crosses boundary to Luma:
  • LUMA_API key in header on outbound GET
  • Re-verifies? **N** — response is treated as trusted input
    (no schema validation visible in lib/luma.ts).

Crosses boundary to Google Calendar:
  • OAuth2 bearer (auto-injected from refresh token)
  • Re-verifies? **N** on response (Google-trusted).

Crosses boundary to SMTP:
  • SMTP_USER / SMTP_PASSWORD basic auth
  • Re-verifies? **N** — fire-and-forget; bounce handling absent.

Crosses boundary to Web Push (FCM/APNs):
  • Signed JWT (VAPID) in Authorization header on push send
  • Subscription endpoint+keys server→push provider
  • Re-verifies? **N** — push provider does not authenticate the
    target user; trusts whoever holds the subscription endpoint.

Crosses boundary to Vercel Blob / Cloudinary:
  • BLOB_READ_WRITE_TOKEN handed to client (app/api/upload/token)
  • Cloudinary API key+secret server-side only
  • Re-verifies? **PARTIAL** — Vercel Blob enforces token scope; Cloudinary
    enforces API signature on signed uploads (Open Assumption: signed mode).

Crosses boundary OUTBOUND from Browser → Slack (no server hop):
  • POST to NEXT_PUBLIC_SLACK_WEBHOOK_URL by ANY visitor (the URL is in
    the JS bundle — can be scraped by anyone who loads the homepage).
  • Re-verifies? **N** — Slack incoming webhooks accept anonymous POSTs
    until rotated. (Critical, recon-1 §11.2.)
```

**Key takeaways from the boundary map:**
1. The **only** trust boundary that performs application-aware auth is **TB 2 → Next.js function** (and only on routes that explicitly call the permission helpers). Vercel edge and Postgres do not enforce identity.
2. The **service worker is itself a trust boundary** the recon already identified: `push-sw.js` opens any URL the push payload supplies ([public/push-sw.js:33-53](../../../public/push-sw.js#L33-L53)) — a server compromise (or a misissued push) becomes an open-redirect into the user's browser.
3. The **cron lane** is a parallel auth path with one shared secret and no per-job HMAC, no IP allowlist, no rate limit. Anyone who learns `CRON_SECRET` can call `expirePoints`, `sendScheduledEmails`, etc., on demand.
4. The **DATABASE_URL** holder is effectively root: there is no row-level security, and the same connection string covers `PersonalVault` plaintext after decryption, `Member.permissions`, `AuditLog`, and `UserWallet`.

---

## 2. Threat Actors

For each actor: **capabilities** (what they can do), **motivation** (why), **starting state** (what access they begin with), **what blocks them today** (existing controls).

### 2.1 Anonymous External Attacker

- **Capabilities:** Send arbitrary HTTP requests to every public hostname; load the JS bundle and extract `NEXT_PUBLIC_*` env values; subscribe to Web Push if they can convince a victim to allow notifications; scrape Luma / Google profile images from CDN; create unlimited Google accounts to sign up.
- **Motivation:** Opportunistic — defacement, mass account creation, data exfiltration of any unauthenticated endpoint, abuse of `NEXT_PUBLIC_SLACK_WEBHOOK_URL` for spam/phish into the team's Slack.
- **Starting state:** No session, no cookie, no API key. Knows the public site URL.
- **What blocks them today:**
  - HSTS + CSP on responses ([next.config.ts:3-45](../../../next.config.ts#L3-L45)).
  - Vercel auto-WAF (assumed).
  - Most non-public routes require a session ([lib/permissions.ts](../../../lib/permissions.ts)).
  - Google OAuth as the only signup path means they must use a real Google account (not an unsolved CAPTCHA).
- **Realistic objectives:** Scrape `NEXT_PUBLIC_SLACK_WEBHOOK_URL` and use it (no cost). Find public endpoints that leak PII (e.g., SpeedrunRegistration listing). Discover misconfigured `/api/public/*` routes. Subscribe to push and pivot via the open `data.url`.

### 2.2 PUBLIC User (post-OAuth signup, lowest tier)

- **Capabilities:** Everything anonymous can do, **plus** a valid `__Secure-next-auth.session-token` cookie with `role=PUBLIC` ([lib/auth-options.ts:110-141](../../../lib/auth-options.ts)). Can call any endpoint that checks "session exists" without checking role. Can hold a `PublicUser` row that may include `signupIp`, `consent versioning` ([prisma/schema.prisma](../../../prisma/schema.prisma) §Step 7).
- **Motivation:** Unlock features they didn't pay for; access content reserved for MEMBER/CORE; enumerate other users.
- **Starting state:** Real Google account, valid session, `PublicUser` row, no `Member.permissions`.
- **What blocks them today:**
  - `app/core/layout.tsx:20-23` server-redirects if `role !== 'CORE'`.
  - `checkCoreAccess()` returns 403 on most CORE routes.
  - Session lifetime 30 days; no token revocation list (recon §Step 4).
- **Realistic objectives:** IDOR on user-owned objects (votes, comments, drafts, wallet); enumerate other PUBLIC users via `/api/admin/public-users` if guard missing; abuse `/api/quests/completions` or `/api/bounty/submissions` to self-grant points; race the wallet `spendPoints` ↔ admin approval; hijack push subscription endpoints by re-registering them ([recon-9 §6.6](category-scans/recon-9-pwa-storage.md): endpoint is unique → re-POST with same endpoint reassigns userId).

### 2.3 MEMBER (community contributor)

- **Capabilities:** Same as PUBLIC plus `role=MEMBER` from `CommunityMember` row. Generally read access to MEMBER-only content; may submit bounties / quests for approval.
- **Motivation:** Same as PUBLIC plus inflate own contribution stats, manipulate experiments / polls, accumulate points faster than peers.
- **Starting state:** Existing `CommunityMember` record (created by some onboarding flow, not by self-signup). Valid session.
- **What blocks them today:** Same gate as PUBLIC. Their tier matters mostly for content visibility; they have **no `permissions` JSON** (only `Member` rows do).
- **Realistic objectives:** Self-approve their own quest/bounty submission (if approval path is poorly guarded); abuse `/api/swag/orders` if stock check is non-atomic; spam push subscriptions on multiple devices; export speedrun registrations they shouldn't see.

### 2.4 CORE Admin (high trust, but with `permissions` JSON granularity)

- **Capabilities:** `role=CORE`, has `Member.permissions` JSON ([prisma/schema.prisma:16](../../../prisma/schema.prisma#L16)) usually narrower than `*: FULL_ACCESS`. Can pass `checkCoreAccess()`. May or may not pass `checkSpeedrunAccess(level=WRITE)`. Can author / moderate content within their resource scopes.
- **Motivation:** Mostly legitimate. Risk surface is **mistakes** (clicking a phish, leaking a session on a coffee-shop laptop) and **lateral privilege probing** (reading audit logs they shouldn't, viewing PersonalVault decrypted data via authorized routes).
- **Starting state:** `Member` row, granular `permissions`, valid 30-day JWT, optional 2FA.
- **What blocks them today:**
  - `checkCoreAccess` allows them only into CORE routes; FULL_ACCESS is required separately for the most sensitive (`app/api/members/[id]/permissions/route.ts:22-26`).
  - `permissions` JSON enforces resource granularity via `hasPermission()` ([lib/permissions.ts:10-40](../../../lib/permissions.ts#L10-L40)).
  - 2FA optional, only enforced for CORE when `ENABLE_2FA="true"` (Open Assumption #10).
- **Realistic objectives:** **Almost none, intentionally.** The threat is the *compromised* version of this actor — see 2.6.

### 2.5 CORE Admin with `"*": "FULL_ACCESS"` (super-admin)

- **Capabilities:** Wildcard permission; passes every `hasPermission()` check including `permissions` mutation. Can create/delete `Member`, edit `permissions`, write to anything not specifically locked. Can issue `adminAdjust` on any wallet ([lib/wallet.ts:212-262](../../../lib/wallet.ts#L212-L262)). Can mint / approve quests, bounties, swag inventory, and call `/api/admin/send-email` to all users.
- **Motivation:** Same legitimate-vs-malicious split as 2.4, **but no separation of duties exists** — one person with FULL_ACCESS can grant points to themselves and approve their own quest in one session, with no second-admin sign-off in code.
- **Starting state:** `permissions = {"*": "FULL_ACCESS"}`. Number of such accounts is **Open Assumption #9** from recon.
- **What blocks them today:** Effectively only their own integrity. There is no break-glass log, no separation of duties, no points-grant cap, no "two-admin approval" pattern in the codebase.
- **Realistic objectives (insider-threat mode):** Mint points → redeem swag → ship to themselves; mass-export `PersonalVault` data; rewrite `Member.permissions` of a co-conspirator; delete `AuditLog` rows via direct DB or by editing the app to add a delete path.

### 2.6 Compromised CORE Admin (stolen Google session)

- **Capabilities:** Same as 2.4 or 2.5 (depending on which admin was popped). Cookie is `__Secure` + `HttpOnly` + `SameSite=Lax`, so XSS exfil is gated by CSP — but **CSP allows `'unsafe-eval'` and `'unsafe-inline'`** in `script-src` ([next.config.ts:29-43](../../../next.config.ts#L29-L43)), which significantly weakens XSS defense. SameSite=Lax means cross-site GET CSRF is still possible for top-level navigations.
- **Motivation:** Whatever the attacker who stole the session wants — usually points minting, PII exfil, defacement, or pivot to vendor accounts (Google Calendar, SMTP).
- **Starting state:** A live JWT cookie, possibly the Google account itself (so they pass MFA challenges via Google).
- **What blocks them today:**
  - Optional TOTP/passkey 2FA in `TwoFactorAuth` / `Passkey` models — but enforcement is feature-flagged and only redirects ([middleware.ts:23](../../../middleware.ts#L23)).
  - **No server-side JWT revocation list, no `tokenVersion`, no admin-session timeout shorter than 30 days** (recon §Step 4) — once the cookie is stolen, it's good for 30 days even if the user notices.
  - **No `AuditLog` entry for admin login** ([lib/auth-options.ts:13-86](../../../lib/auth-options.ts#L13-L86)) — defenders won't see a new IP or device on the trail.
- **Realistic objectives:** Same as 2.5 plus rotate `permissions` to add their own backup admin row, then walk out of the cookie. No revocation = no remediation short of `NEXTAUTH_SECRET` rotation (forces every user to log in again).

### 2.7 Malicious Insider with Vercel Deploy Access

- **Capabilities:** Push code to `main`/`production` and trigger a deploy. Read all environment variables in the Vercel dashboard (`DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `ENCRYPTION_KEY`, `HMAC_INDEX_KEY`, `VAPID_PRIVATE_KEY`, `SMTP_PASSWORD`, `BLOB_READ_WRITE_TOKEN`, Google OAuth secret, Cloudinary secret, Luma key, etc.). Can read live logs.
- **Motivation:** Exfiltrate database, forge JWTs to log in as anyone, mint points, plant backdoors, exfiltrate PersonalVault keys.
- **Starting state:** Vercel team membership with deploy + env-var read.
- **What blocks them today:**
  - **Nothing in this repo.** The recon found no GitHub Actions pipeline, no required reviewers, no signed commits, no protected branch evidence in source. Branch protection is configured on GitHub (out of repo) — assume it's an Open Assumption.
  - There is no env-var encryption-at-rest segregation: a single Vercel role likely sees all secrets.
- **Realistic objectives:** Single-shot full compromise. Lift `NEXTAUTH_SECRET` → forge admin JWT → log in to a live deployment without ever touching the DB, auth flow, or cron path. No detection because admin login is not audited.

### 2.8 Supply-Chain Attacker (npm package, build plugin)

- **Capabilities:** Compromise any of the 34 production deps or their transitives. Particularly potent vectors: `next-auth` (auth flow), `next-pwa` (writes the SW that runs on every user's browser), `@simplewebauthn/server` (passkey), `web-push` (signs FCM/APNs), `nodemailer` (email send + headers), `@vercel/blob`, `@blocknote/*` & `@tiptap/*` (rich-text rendering — XSS surface).
- **Motivation:** Same as nation-state for big targets, but for this app: minted-points exfil, credential theft, persistent C2 in the SW.
- **Starting state:** Owns or co-owns a publish key on at least one dep.
- **What blocks them today:**
  - `bun.lock` committed → no surprise version drift in CI.
  - No `postinstall` / `prepare` hooks ([recon-1 §2.3](category-scans/recon-1-2-11-12-iac-secrets.md#step-2)). Build only runs `prisma generate`.
  - Pinned majors on `next` and `react`.
  - **No SBOM, no SCA, no Dependabot/Renovate** — a published-and-published-back attack would not be flagged automatically.
- **Realistic objectives:** Inject code into a dep version published *after* the lockfile is regenerated; persist via the SW once shipped (because `skipWaiting: false` means users' old SW only updates on consent, which is a small mitigation — but new visitors get the malicious one immediately).

### 2.9 Sybil Farmer (creates many PUBLIC accounts to game points)

- **Capabilities:** Generate or buy Google accounts, run the OAuth flow `n` times, complete public-tier quests / bounties to earn points, redeem swag.
- **Motivation:** Convert points into real-world swag value (Bounty.cash is INR; SwagOrder.shippingAddress means physical shipping).
- **Starting state:** A pool of Google identities, a list of redeemable swag, a shipping address (or several).
- **What blocks them today:**
  - **No domain allowlist on Google sign-in** ([recon §Step 4](00-RECON.md#step-4)). Any Google account works.
  - **No rate-limit on signup or quest-completion** visible at the route layer (Cat 18 will verify; the file `with-rate-limit.ts` exists but is untested per recon-13).
  - `signupIp` is captured on `PublicUser`, but no IP-velocity check uses it.
  - **No KYC on swag redemption.**
- **Realistic objectives:** Earn-and-burn loops; Sybil one of the per-month speedrun registrations; spam votes/likes on Projects to inflate a real account they also control.

### 2.10 Social-Engineering Target (CORE admin clicks phish)

- **Capabilities:** Whatever the targeted admin has — usually 2.4, occasionally 2.5.
- **Motivation:** Attacker's, not theirs. Common payloads: fake "Vercel deploy failed" email, fake Google "Verify your account" leading to a credential-replay page, a malicious push notification (because `NEXT_PUBLIC_SLACK_WEBHOOK_URL` is in the bundle, an attacker can post fake "Security alert" Slack messages **into the team's own Slack**, dramatically improving phish credibility).
- **Starting state:** The admin has a Gmail inbox, a Slack DM, and access to the same web that hosts the phish.
- **What blocks them today:**
  - 2FA, *if* `ENABLE_2FA="true"` and *if* the admin enrolled. Optional and unaudited (recon §Step 13).
  - SMTP `From` matches `SMTP_USER` ([recon-1 §12](category-scans/recon-1-2-11-12-iac-secrets.md#integration-7-email-smtpnodemailer)) — but inbound phish doesn't come from the team's own SMTP.
- **Realistic objectives:** Steal session cookie or Google credentials; pivot to 2.6.

### 2.11 Fraudster Gaming the Points Economy

- **Capabilities:** Authenticated as PUBLIC or MEMBER. Identifies points-grant entry points (`/api/quests/completions`, `/api/bounty/submissions`), tries to:
  - Submit and self-approve.
  - Replay the same submission with different `idempotencyKey` (offline queue accepts anything client supplies — see `lib/offlineStorage.ts`).
  - Race `spendPoints` and `expirePoints` to spend points after they've been deducted.
  - Race two simultaneous swag redemptions against limited stock.
  - Trigger admin-adjust path through any bug that doesn't enforce CORE+FULL_ACCESS.
  - Trick a CORE admin into approving a bounty whose `xpReward`/`pointsReward`/`cash` was tampered with after submission.
- **Motivation:** Real value — Bounty.cash is INR (real money), swag has real cost.
- **Starting state:** Authenticated PUBLIC/MEMBER session.
- **What blocks them today:**
  - `spendPoints` runs in a `Serializable` transaction ([lib/wallet.ts:150](../../../lib/wallet.ts#L150)) — but this is **untested** (zero tests in repo, recon §Step 14).
  - `Bounty.cash` is in INR but no KYC / payout flow is in code (so payouts go via separate manual process — also unaudited).
  - **No `AuditLog` on any wallet operation** (recon-13 §4) — fraud forensics will be limited to `WalletTransaction` rows that the same admin could backfill.
- **Realistic objectives:** Net-positive points/INR over time; small-margin, repeated; hard to detect without audit log.

> **Out of scope (per spec):** Nation-state / APT actors. We do not model attackers with custom 0-days against TLS/AES-GCM/Argon2, persistent dwelling on Vercel's infrastructure, or supply-chain takeovers of the language runtime.

---

## 3. Crown Jewels (ranked)

Highest-value assets first. "Value" = damage if it leaks or is forged.

| Rank | Asset | Storage | Why it's a crown jewel |
|---|---|---|---|
| **1** | `NEXTAUTH_SECRET` | Vercel env var | Whoever holds it can sign a JWT cookie for *any* user including a super-admin and walk in. Admin login is not audited ([lib/auth-options.ts:13-86](../../../lib/auth-options.ts#L13-L86)) — forgery is invisible. Rotation kicks every user out (mass disruption), so it's rarely rotated. |
| **2** | `DATABASE_URL` | Vercel env var | Postgres has no RLS; this URL is root over all 50 models including decrypted `Member.permissions`, `UserWallet`, `AuditLog` (which is not append-only — `deletedAt` exists, no constraint), `PersonalVault` rows (still need ENCRYPTION_KEY to decrypt), and **possibly preview-deployment shared with prod** (Open Assumption #1). |
| **3** | `ENCRYPTION_KEY` / `PII_ENCRYPTION_KEY` + `HMAC_INDEX_KEY` | Vercel env var | The decryption keys for `PersonalVault` (encrypted PII per [prisma/schema.prisma:625-641](../../../prisma/schema.prisma#L625-L641)). With these + DATABASE_URL, attacker reads every vaulted email/name/phone in plaintext and can construct HMAC search probes to enumerate the index. |
| **4** | `Member.permissions` of any account with `"*": "FULL_ACCESS"` | Postgres `Member.permissions` JSON | Whoever controls a row with `{"*":"FULL_ACCESS"}` *is* the super-admin. There is no separation of duties (Open Assumption #9 — recon §Step 15). One row mutated = full takeover. The route that mutates it ([app/api/members/[id]/permissions/route.ts](../../../app/api/members/[id]/permissions/route.ts)) requires FULL_ACCESS itself, so the path is recursive — but a Vercel-deploy attacker bypasses it. |
| **5** | `CRON_SECRET` | Vercel env var | Bearer auth on **all** 7 cron jobs ([app/api/cron/expire-points/route.ts:9-12](../../../app/api/cron/expire-points/route.ts#L9-L12)). Single shared secret across `expire-points`, `send-scheduled-emails`, `cleanup`, `aggregate-analytics`, `aggregate-health`, `sync-events`, `speedrun-status`. No per-job HMAC, no IP allowlist, no audit log on cron invocation. Holder can mass-expire points (DoS the economy) or mass-send scheduled emails (spam to all users via your SMTP credit). |
| **6** | `PersonalVault` ciphertext + HMAC index | Postgres `PersonalVault` table | Encrypted PII at rest. Defense-in-depth against direct DB read. Combined value with #3 = full PII corpus. |
| **7** | `GOOGLE_CLIENT_SECRET` | Vercel env var | Allows OAuth client impersonation. Combined with control over the redirect URI (DNS hijack, subdomain takeover on `*.vercel.app`), attacker can phish users into authorising the legitimate-looking client and get an auth code. Less powerful than #1 but harder to detect. |
| **8** | An admin's live Google session cookie | Browser of admin | Pivot to 2.6. Effective for 30 days because no revocation list exists. The CSP allows `'unsafe-inline'` and `'unsafe-eval'` for `script-src`, so XSS-based exfil is realistic if any DOM-XSS sink is found in the rich-text rendering path (`@blocknote/*`, `@tiptap/*`, `react-markdown`). |
| **9** | `SMTP_USER` + `SMTP_PASSWORD` | Vercel env var | Phishing infrastructure. Sender appears to be your real SMTP user, dramatically raising deliverability. SPF/DKIM/DMARC posture is Open Assumption #4. The `/api/admin/send-email` route uses these creds as well — a CORE bypass + this credential = fully attributed mass mail. |
| **10** | Points-balance integrity on `UserWallet` + `PointsBatch` | Postgres | Real-money equivalent. Bounty.cash is INR; SwagOrder.shippingAddress means physical goods. **Not audited** (recon-13 §4). Fraud here directly costs the org money and (via INR payouts) may trigger AML/KYC obligations (see §5). |
| **11** | `BLOB_READ_WRITE_TOKEN` (server) and the same token after it's handed to the client by `/api/upload/token` | Vercel env + transient client | Token is given to clients to upload directly to Vercel Blob ([app/api/upload/token/route.ts](../../../app/api/upload/token/route.ts)). Lifetime / scope are Open Assumption — if scope is too broad, an attacker can write to the blob bucket including paths the SW pulls (`/sw.js` if accidentally same-origin, but Vercel Blob is on a different host so SW hijack is unlikely). |
| **12** | `VAPID_PRIVATE_KEY` | Vercel env var | Lets attacker sign and send Web Push notifications **as the team1-india server**. Pair with `push-sw.js` open `data.url` ([public/push-sw.js:33-53](../../../public/push-sw.js#L33-L53)) → drive every subscriber's browser to a phishing URL on a single click. Also gives anti-revocation: even after the team rotates this key, already-issued notifications reach users. |
| **13** | `NEXT_PUBLIC_SLACK_WEBHOOK_URL` | Client bundle | Already public by deployment design. Anyone can post to the team's Slack. Recon flagged this Critical for Cat 16. |
| **14** | `LUMA_API_KEY`, `GOOGLE_REFRESH_TOKEN` (Calendar) | Vercel env | Single-tenant; mostly enables impersonation in those vendor surfaces. Lower org impact than #1-12. |
| **15** | `AuditLog` completeness | Postgres `AuditLog` table | The forensic ledger. Has `deletedAt` and no DB constraint preventing soft-delete (recon-13 §5). If an attacker can update/delete rows here (via DB access or a future code path), the entire incident-response capability collapses. Critical for *every* incident, not for any one breach. |

---

## 4. Attack Surface Ranking — Top 25 Endpoints/Functions

Ranked by **exposure × privilege × data sensitivity**. "Exposure" reflects how many people can reach it. "Privilege" = read / write / exec. "Sensitivity" = data involved.

| # | Endpoint / Function | Exposure | Privilege | Sensitivity | Why this matters |
|---|---|---|---|---|---|
| 1 | [`POST /api/cron/send-scheduled-emails`](../../../app/api/cron/send-scheduled-emails/) (gated by `CRON_SECRET` only) | bearer | exec | critical | Mass mail to all users via your SMTP. Holder can DoS your sender reputation, deliver phish from your domain. No HMAC, no IP allowlist, no audit log on cron. |
| 2 | [`POST /api/cron/expire-points`](../../../app/api/cron/expire-points/) (bearer) | bearer | write | critical | Mass-expire every user's points → economy DoS / instant balance reset. Idempotent only at the data layer. No audit log. |
| 3 | [`PATCH /api/members/[id]/permissions`](../../../app/api/members/[id]/permissions/route.ts) | admin (CORE+FULL_ACCESS) | write | critical | Direct path to grant `"*":"FULL_ACCESS"`. Audited via `logActivity` (Log table, not AuditLog). |
| 4 | NextAuth `signIn` callback in [`lib/auth-options.ts:13-86`](../../../lib/auth-options.ts#L13-L86) | anon (everyone who logs in) | exec | critical | Defines who becomes which role, creates `PublicUser` for any Google account, doesn't check `Member.deletedAt`, logs `user.email` plaintext, **not audited**. Sybil + soft-deleted-admin-revival risks. |
| 5 | [`POST /api/swag/orders`](../../../app/api/swag/orders/) (calls `lib/wallet.ts:spendPoints`) | auth | write | high | Real money equivalent — points → physical swag. Stock atomicity unverified (zero tests). No AuditLog. Race vs. `expirePoints` and admin-adjust. |
| 6 | [`POST /api/quests/completions`](../../../app/api/quests/completions/) (calls `lib/wallet.ts:earnReward`) | auth | write | high | Points-grant entry point. Approval guard quality is Phase-2 verification. No AuditLog on grant. |
| 7 | [`POST /api/bounty/submissions`](../../../app/api/bounty/submissions/) (approval calls `earnReward`) | auth | write | high | Same as #6 but with INR cash field. Approval guard quality unknown. No AuditLog. |
| 8 | `lib/wallet.ts:adminAdjust` (L212-262) | admin | write | critical | Negative or positive arbitrary point adjustment. Single-admin operation, no second-admin sign-off, no AuditLog (`WalletTransaction.type='ADMIN_ADJUST'` only). |
| 9 | [`POST /api/push/send`](../../../app/api/push/send/route.ts) | auth (CORE bypass for any-user) | exec | high | Sends Web Push to a target user's subscriptions. Notification payload not validated; `data.url` is opened by `push-sw.js` with no origin check. CORE can blast *any* user. |
| 10 | [`POST /api/upload/cloudinary`](../../../app/api/upload/cloudinary/route.ts) | auth | write | high | Server holds Cloudinary API secret. Upload preset config is Open Assumption #3. Image transformation surface (CVEs in Cloudinary transforms). |
| 11 | [`POST /api/upload/token`](../../../app/api/upload/token/route.ts) | auth | write | high | Hands `BLOB_READ_WRITE_TOKEN` to the client. Token scope/TTL is Open Assumption (recon §Step 15). If broad, lateral write across blob bucket. |
| 12 | [`GET /api/speedrun/registrations/[id]`](../../../app/api/speedrun/registrations/) and the **export** path | admin | read | high | Bulk export of `SpeedrunRegistration` PII (email, fullName, phone, city, twitterHandle, githubHandle — [prisma/schema.prisma:1033-1074](../../../prisma/schema.prisma#L1033-L1074)). GDPR/DPDP scope. AuditLog: only some sub-routes ([recon-13 §4](category-scans/recon-13-logging-tests.md)). |
| 13 | [`GET/POST /api/admin/public-users`](../../../app/api/admin/public-users/route.ts) | admin (CORE+FULL_ACCESS) | read+write | high | Bulk view/manage `PublicUser` rows (email, signupIp, country, city, consent). PII enumeration vector. |
| 14 | [`POST /api/admin/send-email`](../../../app/api/admin/send-email/) | admin | exec | high | Manual mass mail using SMTP creds. If CORE check is missing, every PUBLIC user can send mail as the org. |
| 15 | [`POST /api/auth/2fa/totp/disable`](../../../app/api/auth/2fa/) | auth (self) | write | high | A compromised session can disable 2FA (no re-auth required by current code). Not audited (recon-13 §4). Combined with no admin-login audit, eliminates the only post-compromise tripwire. |
| 16 | [`POST /api/auth/2fa/passkey/register`](../../../app/api/auth/2fa/passkey/) | auth (self) | write | high | Same risk: compromised session enrolls attacker's passkey; user is locked out and attacker becomes the "MFA-protected" user. Not audited. |
| 17 | NextAuth `jwt` callback in [`lib/auth-options.ts:87-176`](../../../lib/auth-options.ts#L87-L176) | every authed request | exec | high | Sets `token.role`, `token.permissions`. A bug here (e.g., not re-reading `Member.deletedAt`) silently promotes/demotes everyone. |
| 18 | [`POST /api/auth/[...nextauth]`](../../../app/api/auth/[...nextauth]/) Google callback | anon | exec | high | OAuth callback. Open signup. Redirect URI binding is OAuth-spec'd but DNS/subdomain takeover would weaponize. |
| 19 | Cron: [`/api/cron/cleanup`](../../../app/api/cron/cleanup/) (bearer) | bearer | write | high | If it deletes / soft-deletes data without per-row guards, an attacker holding `CRON_SECRET` can purge tables. Audit unknown. |
| 20 | Cron: [`/api/cron/sync-events`](../../../app/api/cron/sync-events/) (bearer) | bearer | write | medium | Trusts Luma response (no schema validation visible in `lib/luma.ts`). SSRF if URL ever becomes configurable. |
| 21 | [`GET /api/wallet`](../../../app/api/wallet/route.ts) | auth | read | high | Reads the user's own wallet. Per recon §Step 5, not gated by `checkCoreAccess` — relies on session existence and role-based filtering. Verify scoping doesn't leak others' rows. |
| 22 | [`GET /api/wallet/transactions`](../../../app/api/wallet/) | auth | read | medium | Same exposure pattern as #21. IDOR risk. |
| 23 | [`POST /api/push/subscribe`](../../../app/api/push/subscribe/route.ts) | auth | write | medium | Subscription endpoint is unique → re-POST with same endpoint reassigns ownership ([recon-9 §6.6](category-scans/recon-9-pwa-storage.md)). Hijack vector if a subscription endpoint leaks. |
| 24 | Public: [`GET /api/public/dashboard-stats`](../../../app/api/public/dashboard-stats/route.ts) and `/user` variant | anon | read | medium | "public" prefix → unauthenticated. Verify it doesn't leak per-user counts that aggregate to PII (small cohorts → re-identification). |
| 25 | [`POST /api/contributions`](../../../app/api/contributions/route.ts), [`POST /api/applications`](../../../app/api/applications/route.ts) | mixed | write | medium | Contribution and Application schemas hold name/email of submitter (recon §Step 7). Form-injection / CSRF / spam vectors. Write to DB, may auto-create users. |

> Notes on the table:
> - **`/api/public/*`** routes (13 of them) are intentionally anonymous; they collectively form a low-individual / high-aggregate risk surface and are out-of-the-top-25 individually but Phase 2 must enumerate them as a group.
> - **`/api/monitoring/*`** are CORE-gated for `health` (verified) but `slow-queries` and `errors` need re-confirmation (recon §Step 13).
> - **`/api/members/[id]/status`** and `/api/members/[id]/tags` are CORE write paths that change member state without writing AuditLog (recon-13 §4) — flagged for Phase 2 but not in the top 25 because `permissions` is the privileged knob.

---

## 5. Regulatory Exposure

Each regime gets: **applicable Y/N**, **what's missing in code**, **open assumptions**.

### 5.1 GDPR (EU users — Regulation 2016/679)

- **Applicable: Suspected Y.** Codebase has no geo-fencing on signup; any Google account can register. `PublicUser` row stores `email`, `fullName`, `city`, `country`, `signupIp`, and consent versioning ([prisma/schema.prisma](../../../prisma/schema.prisma) §Step 7). `SpeedrunRegistration` adds `phone`, `twitterHandle`, `githubHandle`. EU residency must be assumed for at least some users.
- **What's missing in code:**
  - **Lawful basis annotations.** No data-mapping document or schema comment ties any column to a GDPR Art. 6 lawful basis. Consent versioning exists but no record of *what* was consented-to-when.
  - **Right to erasure cascade.** `Member.deletedAt` and `PublicUser` (no soft-delete column verified) — but cascade across `WalletTransaction`, `PointsBatch`, `Comment`, `Project.likes`, `AnalyticsEvent.userEmail`, `Log.actorId`, `AuditLog.actorId`, push subscriptions, IndexedDB drafts — **none of this is wired.** `signIn` callback does not check `Member.deletedAt` (recon §Step 5), so a "deleted" user re-logging-in would resurrect.
  - **Right to access (Article 15) / portability (Article 20).** No `/api/me/export` endpoint found in the route inventory.
  - **Records of processing (Article 30).** Not in repo.
  - **Data Processing Agreements with sub-processors:** Google, Vercel, Luma, Cloudinary, SMTP provider. Open Assumption #6.
  - **AnalyticsEvent.userEmail field** ([recon-13](category-scans/recon-13-logging-tests.md)) — analytics may be processing PII without anonymisation.
  - **Plaintext email in logs** ([lib/auth-options.ts:79](../../../lib/auth-options.ts#L79)) — log retention then becomes a GDPR concern.
  - **PWA IndexedDB plaintext drafts** — once consent withdrawn, server can delete DB rows but cannot reach the user's `team1-offline` IDB. SW would need a "wipe" message channel that doesn't exist.
- **Open assumptions:** Vercel region (Open Assumption #1 — affects Schrems II), DPAs (Open Assumption #6), data residency of the Postgres instance.

### 5.2 DPDP Act (India — Digital Personal Data Protection Act, 2023)

- **Applicable: Y.** Repo name `team1-india`, `Bounty.cash` field is INR, the speedrun program targets Indian audiences. DPDP applies to "any digital personal data of Indian citizens, processed inside or outside India when offering goods/services to data principals in India" (§3).
- **What's missing in code:**
  - **Notice + verifiable consent (DPDP §5-6).** The consent versioning column exists; the *notice mechanism* (what was shown to the user, when, in which language) is not in repo.
  - **Right to grievance redressal (DPDP §13).** No `/api/grievance` or DPO contact route found.
  - **Significant Data Fiduciary** thresholds (DPDP §10): if user count, scale of processing, or risk to children grows, the org may be designated SDF and incur DPIA / audit / DPO obligations. Codebase has no DPIA scaffold.
  - **Cross-border transfer:** DPDP §16 allows transfer except to blacklisted countries — assume Postgres is in a non-blacklisted region (Open Assumption #1) but no documentation in repo.
- **Open assumptions:** Whether the org has registered a DPO; whether it issues DPDP-compliant breach notices.

### 5.3 COPPA (US — 15 USC §6501 et seq., kids under 13)

- **Applicable: Suspected Y (until disproved).** **No age check found in any signup or registration path.** Google OAuth does not pass age. `SpeedrunRegistration` has no minimum-age field. Public Quests / Bounties are completable by anyone authenticated. If any subset of users is under 13 in the US, COPPA applies and the app is non-compliant by default.
- **What's missing in code:**
  - **Age gate on signup.**
  - **Parental verifiable consent flow.**
  - **No-collection-from-children policy enforcement.**
  - **Direct-notice mechanism for parents.**
- **Open assumptions:** Marketing audience (whether the platform actually invites under-13s — likely not, but legally the absence of a gate creates exposure).

### 5.4 PCI-DSS

- **Applicable: N (likely).** No Stripe / Adyen / Razorpay / card-vaulting code found in repo (recon §Step 2: "No Stripe ... explicitly verified by import grep"). `Bounty.cash` is INR but is a *display field* for an offline payout — not a card-data path. `SwagOrder.pointsSpent` is internal currency. **No PAN, CVV, expiration, or track data anywhere in the schema.**
- **What's missing in code:** N/A (zero PCI scope).
- **Open assumptions:** That no future "buy points with card" path is added without re-scoping. Phase 2 will re-grep for card-pattern strings.

### 5.5 AML / KYC (Anti-Money Laundering / Know Your Customer)

- **Applicable: Legal review needed.** Two factors push this on-radar:
  1. **Points-as-money risk.** Points → swag with real-world value (physical goods + shipping address). If a user can convert effort into goods, regulators in some jurisdictions treat the platform like a closed-loop loyalty program (low scrutiny) but only when redemption is to that platform's own goods. Mailing physical swag is borderline.
  2. **`Bounty.cash` in INR.** A platform that pays bounties in INR to bank accounts performs functions adjacent to a money-transmitter. India's PMLA (Prevention of Money Laundering Act) and RBI's Payment Aggregator licensing may apply if volume exceeds thresholds. **No KYC enforcement on bounty winners is in the codebase.**
- **What's missing in code:**
  - **KYC field collection** (PAN, Aadhaar, bank verification) — none found.
  - **Payout audit trail** — `Bounty.cash` is set on the row, but the actual payout (bank transfer) is presumably manual / off-system.
  - **Sanctions screening** on payout recipients.
  - **Redemption velocity caps** on swag (so a Sybil farmer can't drain inventory).
- **Open assumptions:** *We cannot answer this from code.* Engagement with India-licensed legal counsel is the only resolution. Flagged as **Legal-Review-Required** in Phase 2 follow-up.

### 5.6 Data Residency

- **Applicable:** Depends on customer contracts and DPDP/GDPR posture (above).
- **What's missing in code:** Postgres host region is not in repo; Vercel function region is not in `vercel.json`. No data-residency assertions in any documentation.
- **Open assumptions:** **Open Assumption #1** from recon (preview-deployment env scope and DB region). Phase 2 cannot answer without Vercel dashboard access.

### 5.7 Quick Matrix

| Regime | Applicable | Missing in code | Open assumption |
|---|---|---|---|
| GDPR | Suspected Y | Lawful-basis annotations, erasure cascade, access/portability endpoint, ROPA, DPAs | Vercel/DB region |
| DPDP (India) | Y | Notice + consent provenance, grievance route, DPIA scaffold | DPO existence, breach-notification procedure |
| COPPA | Suspected Y | Age gate, parental consent | Marketing audience age range |
| PCI-DSS | N | N/A | No card path added in future |
| AML/KYC | Legal-review-needed | KYC fields, payout audit, sanctions screening, redemption caps | Counsel engagement |
| Data residency | Depends | Region documentation | Vercel project settings |

---

## 6. Out-of-Scope (Explicit)

The following are excluded from this audit by design. Findings under these categories — if discovered incidentally — will be noted as "out-of-scope context" and not assigned a CVSS / severity.

1. **Physical security.** Office access, laptop theft, hardware tampering, badge readers, datacenter physical access.
2. **Nation-state / APT actors.** Adversaries with custom 0-day capabilities, persistent infrastructure, or privileged access to upstream vendors. Threat model in §2 explicitly stops at "Compromised CORE Admin" and "Supply-chain attacker against an npm package" — neither of those models a sovereign actor.
3. **Vendor breaches treated as compromise.** We do not model the scenarios where Google, Vercel, Cloudinary, Luma, the SMTP provider, or FCM/APNs is itself breached. The downstream impact is total, the controllable surface is zero, and modelling it crowds out the surfaces we *can* fix.
4. **Cryptographic novel attacks** on AES-GCM, Argon2 (used by `@simplewebauthn/server`), TLS 1.2/1.3, or NextAuth's HS256 JWT signing primitives. We do model **misuse** of these primitives (e.g., the static PBKDF2 salt in [lib/encryptedSession.ts](../../../lib/encryptedSession.ts), which is a configuration flaw, not a primitive flaw).

---

## End of Phase 1

**Coverage:**
- §1 boundaries — done; each crossing annotated with re-verify Y/N.
- §2 actors — 11 actor profiles (anon → fraudster); APT explicitly out.
- §3 crown jewels — 15 ranked.
- §4 attack surface — top 25 endpoints/functions.
- §5 regulatory — GDPR, DPDP, COPPA, PCI, AML/KYC, residency.
- §6 out-of-scope — 4 categories.

**Next:** Phase 2 categories will use this model to focus testing: each Phase 2 category should pick the actors + crown jewels + endpoints from this document that fall in its category, and produce findings with CVSS scoring against the realistic actor (not against a nation-state).
