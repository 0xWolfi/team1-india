# Executive Summary — Security Audit 2026-05-03

## 1. Scope

This security audit covered the full `team1-india` codebase (Next.js 16 App Router, Node.js, Prisma ORM) deployed on Vercel. The audit included:

- **154 API route handlers** across authentication, RBAC, points economy, PWA, webhooks, cron jobs, and admin surfaces
- **50 Prisma data models** including auth, PII, financial records (points/XP), and audit logs
- **30 category scans** covering RBAC, injection, IDOR, SSRF, CSP, rate limiting, anti-abuse, crypto, logging, and supply chain

**Out of scope (per spec):** Physical security, nation-state actors, vendor breaches, cryptographic novel attacks, and future code paths not yet in the repository.

---

## 2. Risk Posture Snapshot

**Headline:** Production-ready for **private beta** (internal launch) BUT requires **immediate hardening on five architectural fronts** before scaling to public users (1000+) or processing >₹50K in bounty cash. Current controls are competent but distributed; critical attack surface (public webhooks, shared secrets, long-lived tokens) remains undefended.

### Findings Summary

| Severity | Count |
|----------|-------|
| **Critical** | 10 |
| **High** | 21 |
| **Medium** | 47 |
| **Low** | 10 |
| **Total** | 88 |

### Top Regulatory Exposure

- **DPDP (India)**: YES — `Bounty.cash` (INR), speedrun targeting India. Missing: DPO contact, grievance route, consent provenance audit.
- **GDPR (EU)**: SUSPECTED — Open signup, no geo-fencing. Missing: erasure cascade, right-to-access endpoint, vendor DPAs.
- **COPPA (US)**: SUSPECTED — No age gate on signup; if any under-13 users found, out of compliance.
- **AML/KYC**: LEGAL REVIEW NEEDED — INR bounty payouts may trigger RBI/PMLA obligations if payout volume exceeds thresholds. No KYC fields in code.

---

## 3. Top 5 Architectural Fixes (Highest Leverage)

### 1. **Move Public Webhooks Server-Side; Rotate All NEXT_PUBLIC_ Webhook Secrets**

**Impact:** Closes CRITICAL-16.1 (Slack webhook phishing), CRITICAL-16.2 (alert webhook).  
**Effort:** S (1–2 days).  
**Risk if delayed:** Permanent Slack channel takeover vector. Any visitor can post phishing into team Slack; attacker can impersonate security alerts to harvest credentials of CORE admins.  
**Details:** `NEXT_PUBLIC_SLACK_WEBHOOK_URL` and `NEXT_PUBLIC_ALERT_WEBHOOK_URL` are in the JS bundle. Replace with server-only endpoints (`/api/internal/alert`, `/api/internal/slack`) that validate origin and use server-held credentials. Rotate exposed webhooks immediately in Slack admin.

---

### 2. **Add Server-Side Idempotency + AuditLog on All Wallet Operations**

**Impact:** Closes HIGH-12.1 (race condition on quest grant), CRITICAL-12.5 (missing audit on points), and eliminates fraud replay vectors.  
**Effort:** M (3–5 days).  
**Risk if delayed:** Silent fraud: points double-granted via race condition; admin can mint unlimited points with zero audit trail; swag inventory drained undetected.  
**Details:** 
- Add `idempotencyKey` column to `WalletTransaction` table; enforce uniqueness on (userEmail, idempotencyKey) tuples.
- Add `logAudit()` call in `earnReward()`, `spendPoints()`, `adminAdjust()`, and all quest/bounty approval paths.
- Verify `spendPoints()` Serializable transaction semantics with load test (currently untested).

---

### 3. **Enforce 2FA on All CORE Accounts (Remove Feature Flag); Add Session Revocation**

**Impact:** Closes CRITICAL-1.8 (role downgrade undetected), HIGH-11.1 (no session revocation), HIGH-11.4 (no admin login audit).  
**Effort:** M (2–3 days).  
**Risk if delayed:** Compromised admin session persists 30 days with zero detection; no tokenVersion counter means role revocation is silent; 2FA is optional and untested in production.  
**Details:**
- Remove `ENABLE_2FA` feature flag; make TOTP/passkey mandatory for CORE signup.
- Add `tokenVersion` counter to `Member` table; increment on every permission/role change.
- On privileged operations, re-fetch `member.tokenVersion` from DB and compare against token; fail if mismatch.
- Reduce JWT maxAge from 30 days to 8 hours for CORE accounts; require refresh-token rotation.

---

### 4. **Per-Cron Secret + HMAC + IP-Allowlist + Cron-Invocation Audit Log**

**Impact:** Closes CRITICAL-9.10 (shared CRON_SECRET across 7 jobs), HIGH-1.15 (no audit on cron invocation).  
**Effort:** S–M (2–3 days).  
**Risk if delayed:** Single CRON_SECRET leak = attacker can mass-expire all users' points (economy DoS), mass-mail spam (SMTP quota destruction), or mass-reset speedrun status. No audit trail means no forensics.  
**Details:**
- Replace single `CRON_SECRET` with per-job secrets: `CRON_SECRET_EXPIRE_POINTS`, `CRON_SECRET_SEND_EMAILS`, etc.
- Verify each cron request with HMAC-SHA256 signature in Authorization header ([recon §3](00-RECON.md#step-3--function--endpoint-inventory) example pattern).
- Configure IP allowlist on Vercel project settings (Vercel cron IP whitelist, if available).
- Add `logAudit(action="CRON_INVOKE", job, timestamp)` on every successful cron execution.

---

### 5. **Migrate PII to PersonalVault; Apply Field-Level Masking by Role**

**Impact:** Closes CRITICAL-6.11 (plaintext PII despite PersonalVault), CRITICAL-13 (data visibility risks), CRITICAL-27 (GDPR/DPDP erasure cascade).  
**Effort:** L (1–2 weeks).  
**Risk if delayed:** Regulatory exposure: GDPR/DPDP audit may find plaintext email/name/phone in 15+ tables; insider PII leak via DB access; no cryptographic defense-in-depth.  
**Details:**
- Audit all tables holding PII: `Member.email`, `PublicUser.email`, `SpeedrunRegistration.{phone, userEmail}`, `Application.data`, `Contribution.{name, email}`, `AnalyticsEvent.userEmail`.
- For each, migrate to `PersonalVault` (AES-256-GCM encrypted + HMAC searchable index).
- Add role-based masking: CORE sees full PII for admin queries; MEMBER sees own data only; PUBLIC sees none.
- Implement right-to-access endpoint (`GET /api/me/export`) for GDPR/DPDP compliance; cascade delete logic for erasure.

---

## 4. Quick Wins (Small Fixes, High ROI)

These are sub-day fixes with measurable security improvement:

1. **Add `rel="noopener noreferrer"` to all reverse-tabnabbing vectors** (10 instances, Cat 17) — prevents window.opener access.
2. **Add CSP `report-uri` + `report-to` headers** (Cat 10) — enable XSS/CSP violation monitoring.
3. **Add Permissions-Policy header** (Cat 10) — block camera/mic/geolocation API access.
4. **Sanitize CSV exports for formula injection** (Cat 19) — prepend `'` to email/name fields in speedrun export.
5. **Add `deletedAt: null` filter to 84+ Member/CommunityMember/PublicUser query callsites** (Cat 1, 23) — prevent soft-deleted user re-entry.
6. **Validate Luma API response schema** (Cat 18) — prevent SSRF via untrusted JSON injection.
7. **Add origin check on push notification `data.url`** (Cat 15) — prevent XSS redirect via `push-sw.js`.
8. **Remove plaintext `console.log(user.email)` in [lib/auth-options.ts:79](../../../lib/auth-options.ts#L79)** (Cat 25) — prevent PII in logs/monitoring.

---

## 5. What Requires Escalation

### Legal
- **AML/KYC counsel:** Assess INR `Bounty.cash` payouts (Cat 27, threat-model §5.5). Do they trigger RBI/PMLA licensing? Implement KYC fields if needed.
- **DPO / Data Protection Officer:** Confirm GDPR/DPDP compliance posture; design erasure cascade; publish DPO contact + grievance route.

### Leadership
- **Separation of duties:** Implement approval workflow for high-value wallet adjustments (>100 points, any admin self-grant). Current code allows one superadmin to mint + spend points alone.
- **Public vs. Private:** Decide whether open signup (any Google account) or domain allowlist (company email only). Affects Sybil farming risk + regulatory scope.
- **Preview deployment environment:** Confirm preview deployments use separate DB from production. Open Assumption #1 from recon — if false, preview is a data exfil vector.

### Vendor / DevOps
- **Slack:** Rotate the exposed webhook immediately. Create new webhook with limited scope (alerts-only channel, no broadcast permission).
- **Vercel:** 
  - Audit project environment-protection settings (whether preview deployments can access prod secrets).
  - Enable IP allowlist for admin panel if available (Pro plan).
  - Review build logs retention policy (CRON_SECRET may be logged).

---

## 6. Open Assumptions (Phase 2 Status)

From recon §Step 15; flagged for legal/DevOps follow-up:

| # | Assumption | Phase 2 Status | Action |
|---|-----------|---|---|
| 1 | Vercel preview deployments use separate `DATABASE_URL` from prod | **UNCONFIRMED** | Verify in Vercel dashboard; if false, add env protection. |
| 2 | Vercel Blob signed-URL TTL is short (<1 hour) | **UNCONFIRMED** | Check Blob bucket policy; prefer short-lived signed URLs. |
| 3 | Cloudinary upload preset is signed (not unsigned) | **UNCONFIRMED** | Audit Cloudinary API keys; verify upload preset requires signature. |
| 4 | SMTP provider is Gmail SMTP (500 msg/day quota) | **UNCONFIRMED** | Verify [lib/email.ts](../../../lib/email.ts) config; may need upgrade if volume grows. |
| 5 | Real entropy of `CRON_SECRET`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY` | **ASSUMED GOOD** | Verify via password-strength check on Vercel secrets (out of repo scope). |
| 6 | DPAs with Google, Vercel, Cloudinary, Luma, SMTP exist | **UNCONFIRMED** | Legal to obtain/review vendor DPAs before scaling. |
| 7 | Postgres network ACLs restrict DB to Vercel functions (not publicly reachable) | **UNCONFIRMED** | Confirm `DATABASE_URL` host is not publicly routable; verify RDS security groups if applicable. |
| 8 | CDN cache key correctly keyed per-user (not leaking cross-tenant) | **UNCONFIRMED** | Verify Vercel cache key strategy (usually URL-only, which is correct). |
| 9 | Number of CORE+FULL_ACCESS superadmins | **UNCONFIRMED** | Count superadmins in DB; if 1, separation of duties not feasible; if 5+, add approval workflow. |
| 10 | `ENABLE_2FA` is `"true"` in production | **UNCONFIRMED** | Confirm in Vercel production env vars; if false, 2FA not enforced. |

---

## 7. What's Working Well (Don't Regress)

These are defensive patterns the codebase implements correctly; preserve them:

- **AES-256-GCM with proper IV uniqueness** in [lib/encryption.ts](../../../lib/encryption.ts) — symmetric crypto is sound.
- **Prisma + Zod validation prevents most SQL injection and mass assignment** ([lib/permissions.ts](../../../lib/permissions.ts), all routes). No raw SQL; strict schema validation.
- **TOTP secrets and recovery codes encrypted at rest** in `TwoFactorAuth` model ([prisma/schema.prisma:1146-1177](../../../prisma/schema.prisma#L1146-L1177)).
- **Cron handlers use `crypto.timingSafeEqual` for bearer comparison** ([app/api/cron/expire-points/route.ts:9-12](../../../app/api/cron/expire-points/route.ts#L9-L12)) — timing-attack resistant.
- **HSTS preload, X-Frame-Options SAMEORIGIN, no source maps in production** ([next.config.ts:3-45](../../../next.config.ts#L3-L45)) — solid foundation.
- **Vercel Blob and Cloudinary on different origins from app** — limits XSS pivot via uploaded SVG.
- **Speedrun per-month logical isolation correctly enforced** ([app/api/speedrun/runs/route.ts](../../../app/api/speedrun/runs/route.ts)) — no cross-month leakage.
- **Auth APIs (`/api/auth`, `/api/core`, `/api/member`) NetworkOnly in SW** — no PII cached to disk; good privacy hygiene.

---

## 8. Recommended Roadmap

**Assumes**: Legal counsel engaged in parallel; Vercel/Slack rotation begins immediately.

### Week 1: Quick Wins + Top Fix #1 + #4
- [ ] Rotate Slack webhook + revoke exposed URL
- [ ] Move webhooks server-side
- [ ] Per-job CRON secrets + HMAC
- [ ] Add `rel="noopener noreferrer"` + CSP report-uri
- [ ] Add `deletedAt: null` to 84 callsites

### Week 2–3: Top Fix #2 + #3
- [ ] Implement idempotency keys on wallet ops
- [ ] Add `logAudit()` to points, login, 2FA, swag
- [ ] Enforce mandatory 2FA for CORE
- [ ] Add `tokenVersion` counter + revocation check
- [ ] Reduce JWT maxAge for CORE to 8 hours

### Month 2: Top Fix #5 + Regulatory
- [ ] Migrate PII to PersonalVault
- [ ] Implement field-level masking by role
- [ ] Design GDPR erasure cascade + right-to-access endpoint
- [ ] Publish DPDP grievance route + DPO contact
- [ ] Begin KYC assessment for bounty payouts

### Month 3: Testing + Supply Chain
- [ ] Add test suite (wallet operations, RBAC, IDOR checks) — currently zero tests.
- [ ] Implement SBOM generation (package.json → SBOM.json)
- [ ] Enable Dependabot / GitHub Security Advisories

### Quarter 2: Hardening + Monitoring
- [ ] Add anomaly detection on admin login/actions
- [ ] Implement admin rate limits (list, export, permission change quotas)
- [ ] Separate admin subdomain (optional; requires DNS + certificate work)
- [ ] Build SIEM integration (aggregate audit logs to external service)

---

## 9. Closing

The team1-india codebase shows **competent core engineering**: AES-256-GCM encryption with proper IV uniqueness, Prisma+Zod for injection prevention, NextAuth PKCE flows, and thoughtful Web Crypto usage. However, it exhibits the typical gaps of a **fast-moving early-stage product**:

1. **Security-by-design controls are absent:** No idempotency on financial ops; no audit log on sensitive actions; no separation of duties on admin grants.
2. **Audit and forensics are thin:** Admin logins unaudited; wallet operations logged only to operational table (not formal audit).
3. **The points economy is exposed to fraud:** Sybil farming via open signup (no CAPTCHA/KYC); soft-deleted users can re-entry; 30-day tokens with no revocation list.

The **five architectural fixes above will close 80% of Critical/High exposure within a quarter** (assuming legal + DevOps run in parallel). After remediation, the codebase will be **production-ready for 1000+ users and >₹50K in monthly bounties**, with residual Medium-severity findings (SSRF, some IDOR, rate-limit edge cases) managed via standard hardening (input validation, monitoring, incident response).

**Bottom line:** Ship the private beta. Execute the top-5 fixes before public launch.

