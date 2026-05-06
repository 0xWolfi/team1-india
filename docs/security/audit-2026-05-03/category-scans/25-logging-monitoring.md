# Category 25: Logging, Monitoring & Audit

**Audit Date:** 2026-05-03  
**Repository:** /Users/sarnavo/Development/team1-india  
**Scope:** Sensitive data in logs, audit trail coverage, audit log integrity, monitoring endpoint security, anomaly detection  

---

## Finding 1: Plaintext Email Logging in Authentication

**Severity:** HIGH  
**Status:** CONFIRMED  

### Details

The `signIn` callback in [lib/auth-options.ts:79](lib/auth-options.ts#L79) logs user email addresses in plaintext to `console.log` on every public user signup:

```typescript
// lib/auth-options.ts:79
console.log(`New Public user created (Pending Consent): ${user.email}`);
```

This is a **Personally Identifiable Information (PII) disclosure** via logging that:
- Exposes user email addresses to stdout logs
- Becomes part of persistent log aggregation (if logs are collected by Vercel or external monitoring)
- Occurs on **every new user signup** (PUBLIC role creation)
- Has no redaction mechanism

### Sample Console.log Callsites with User Identifiers

Five additional logging patterns that expose user context:

1. **[app/api/push/subscribe/route.ts:48](app/api/push/subscribe/route.ts#L48)**
   ```typescript
   console.log(`✅ Push subscription saved for user ${userId}`);
   ```
   Logs user ID to stdout (userId is the authenticated session user ID).

2. **[app/api/push/preferences/[userId]/route.ts:123](app/api/push/preferences/[userId]/route.ts#L123)**
   ```typescript
   console.log(`✅ Notification preferences updated for user ${userId}`);
   ```
   Logs user ID for notification preference updates.

3. **[app/api/push/subscribe/[userId]/route.ts:29](app/api/push/subscribe/[userId]/route.ts#L29)**
   ```typescript
   console.log(`✅ Push subscriptions deleted for user ${userId}`);
   ```
   Logs user ID for subscription deletion.

4. **[app/api/admin/send-email/route.ts:41](app/api/admin/send-email/route.ts#L41)**
   ```typescript
   console.log(`✅ Email sent: ${subject}`);
   ```
   While not logging email itself, this is called in admin email-send routes and may indirectly correlate.

5. **[app/api/announcements/route.ts:147](app/api/announcements/route.ts#L147)**
   ```typescript
   console.log(`Broadcasting announcement to ${recipients.length} users`);
   ```
   Logs user count for broadcasts (not PII but a behavioral log).

### Root Cause

No **redaction helper** exists in the codebase. The logger at [lib/logger.ts:39](lib/logger.ts#L39) provides basic console output without automatic PII masking.

### Recommendation

- Create a `redactSensitiveData(value: string)` utility in [lib/logger.ts](lib/logger.ts) that masks emails (first 3 chars + `***@***`), phone numbers, and tokens.
- Update [lib/auth-options.ts:79](lib/auth-options.ts#L79) to use redaction before logging.
- Audit [app/api/push/*](app/api/push/) routes and other high-volume logging endpoints to redact user IDs or remove logs entirely.
- Consider logging only user ID hashes or UUIDs instead of raw emails.

---

## Finding 2: Missing Audit Log Entries for Security-Critical Actions

**Severity:** CRITICAL  
**Status:** CONFIRMED  

### Details

Recon-13 identified **10 major audit coverage gaps**. The following critical actions bypass the `AuditLog` table entirely:

#### 2.1 Points Grant / Spend / Expire / Admin Adjust

**Files:** [lib/wallet.ts](lib/wallet.ts) (lines 28–262)  
**Impact:** No audit trail for the core economy transaction layer.

| Function | Line | Creates | Missing |
|----------|------|---------|---------|
| `earnReward` | 28–78 | `WalletTransaction` only | `AuditLog` |
| `spendPoints` | 86–152 | `WalletTransaction` only | `AuditLog` |
| `expirePoints` | 159–207 | `WalletTransaction` only | `AuditLog` |
| `adminAdjust` | 212–262 | `WalletTransaction` only | `AuditLog` |

**Finding:** All four wallet functions write to `WalletTransaction` (financial ledger) but **never** write to `AuditLog`. This means:
- No audit trail of who called `adminAdjust` (admin point grants/deductions).
- No actionable investigation path for points fraud.
- No tamper-evident record of system-initiated expirations vs. admin corrections.

**Callsites:**
- Quest completion reward: [app/api/quests/completions/route.ts](app/api/quests/completions/route.ts) → calls `earnReward()` (no audit).
- Bounty submission approval: [app/api/bounty/submissions/route.ts](app/api/bounty/submissions/route.ts) → calls `earnReward()` (no audit).
- Admin manual adjustment: Exposed via admin routes (no audit).
- Cron expiry: [app/api/cron/expire-points/route.ts](app/api/cron/expire-points/route.ts) → calls `expirePoints()` (no audit).

#### 2.2 Admin / Any Login

**File:** [lib/auth-options.ts:13–86](lib/auth-options.ts#L13-L86) (signIn callback)  
**Impact:** No audit trail for user authentication events.

**Finding:** The `signIn` callback processes login for all three roles (CORE, MEMBER, PUBLIC) but:
- Does **not** call `logAudit()` or `AuditLog.create()` on successful login.
- Does **not** distinguish admin (CORE) login from public user login in audit records.
- Has no failed-login audit trail.

This prevents:
- Accountability for admin access.
- Detection of brute-force or suspicious login patterns.
- Compliance with "admin activity must be audited" requirements.

#### 2.3 Member Status / Tags Change

**Files:**
- [app/api/members/[id]/status/route.ts](app/api/members/[id]/status/route.ts) (line 32–35)
- [app/api/members/[id]/tags/route.ts](app/api/members/[id]/tags/route.ts) (line 33–35)

**Finding:** Both endpoints update Member records without audit logging. Status changes (e.g., "active" → "inactive") and tag assignments are administrative actions that should be audited but are not.

#### 2.4 2FA Setup / Disable / Passkey Register

**Files:**
- [app/api/auth/2fa/passkey/register/route.ts](app/api/auth/2fa/passkey/register/route.ts)
- [app/api/auth/2fa/totp/disable/route.ts](app/api/auth/2fa/totp/disable/route.ts)
- [app/api/auth/2fa/passkey/verify-register/route.ts](app/api/auth/2fa/passkey/verify-register/route.ts)

**Finding:** Two-factor authentication changes (enabling/disabling TOTP, registering passkeys) are **not audited**. This is a security-critical action (changes authentication strength) with no audit trail.

#### 2.5 Swag Redemption & Approval

**File:** [app/api/swag/[id]/redeem/route.ts](app/api/swag/[id]/redeem/route.ts)  
**Impact:** No audit trail for rewards.

**Finding:** Swag redemption calls `spendPoints()` (no audit) and creates a `SwagOrder` row without `AuditLog.create()`.

#### Audit Coverage Summary Table

| Action | Audited? | Impact | Severity |
|--------|----------|--------|----------|
| Points grant (quest/bounty) | ❌ NO | No trail of economy inflation | **CRITICAL** |
| Points spend (swag) | ❌ NO | No trail of redemption | **CRITICAL** |
| Points expire | ❌ NO | No trail of expiry logic | **HIGH** |
| Admin manual adjust | ❌ NO | No trail of admin grants | **CRITICAL** |
| Admin login | ❌ NO | No admin access log | **CRITICAL** |
| Member status change | ❌ NO | No trail of role status updates | **HIGH** |
| 2FA setup / disable | ❌ NO | No auth-strength trail | **HIGH** |
| Swag redemption | ❌ NO | No redemption audit | **HIGH** |
| Role/Permissions change | ✅ YES | [app/api/members/[id]/permissions/route.ts:49](app/api/members/[id]/permissions/route.ts#L49) via `logActivity()` | OK |

### Recommendation

- Add `logAudit()` calls to all four wallet functions ([lib/wallet.ts](lib/wallet.ts)):
  - `earnReward()` line 67: Add `logAudit("POINTS_GRANT", "UserWallet", wallet.id, { xp, points, type })`
  - `spendPoints()` line 139: Add `logAudit("POINTS_SPEND", "UserWallet", wallet.id, { amount })`
  - `expirePoints()` line 191: Add `logAudit("POINTS_EXPIRE", "PointsBatch", batch.id, { amount })`
  - `adminAdjust()` line 252: Add `logAudit("ADMIN_POINTS_ADJUST", "UserWallet", wallet.id, { delta, actor })`

- Add `logAudit()` calls to authentication routes ([lib/auth-options.ts:79](lib/auth-options.ts#L79)):
  - On successful signIn, log with role (CORE logins especially).

- Add `logAudit()` calls to member routes:
  - [app/api/members/[id]/status/route.ts:35](app/api/members/[id]/status/route.ts#L35)
  - [app/api/members/[id]/tags/route.ts:35](app/api/members/[id]/tags/route.ts#L35)

- Add `logAudit()` calls to 2FA routes to record auth-method changes.

---

## Finding 3: Audit Log Writable by Audited Roles (Immutability Not Enforced)

**Severity:** MEDIUM  
**Status:** CONFIRMED  

### Details

The `AuditLog` table has a **`deletedAt` soft-delete column** ([prisma/schema.prisma:289](prisma/schema.prisma#L289)), which means:

```prisma
model AuditLog {
  id         String    @id @default(uuid())
  // ... fields ...
  deletedAt  DateTime?  // ← Soft-delete column
  // ...
}
```

**Risk Analysis:**

1. **No immutability enforcement:** While `AuditLog.create()` is only called from admin-gated routes, there is:
   - No database constraint (`@unique`, `@@unique`, no soft-delete checks) preventing deletion.
   - No row-level encryption or hash-chaining to detect tampering.
   - No "append-only" enforcement (e.g., `NOT NULL created_at, created_at IMMUTABLE`).

2. **Theoretical attack vector:**
   - If a future code change adds a `prisma.auditLog.update()` or `.delete()` endpoint, or if DB access is compromised, logs can be soft-deleted.
   - A CORE user with database access could manually delete audit logs.

3. **Incident response impact:**
   - Even if logs are "soft-deleted," they remain in the database.
   - A forensic analysis can still recover them (queryable via `{ deletedAt: null }` filters are missing in [app/api/logs/route.ts:33](app/api/logs/route.ts#L33) — the route always filters `deletedAt: null`, preventing visibility of deleted logs).

### Current Read Path

In [app/api/logs/route.ts:33](app/api/logs/route.ts#L33):

```typescript
const where: any = {
  deletedAt: null,  // ← Filters out soft-deleted logs
};
```

This prevents **audit log readers from seeing deleted logs**, which is both a feature and a risk:
- **Feature:** Prevents accidental viewing of cleared logs.
- **Risk:** If an attacker deletes logs and they are not restored, investigation is blind.

### Recommendation

- Add a database constraint to prevent soft-deletes: Change `deletedAt` to a computed/immutable column or remove it entirely from `AuditLog`.
- Add hash-chaining: Each `AuditLog` row should include a `previousHash` field (SHA256 of previous row + metadata) to detect tampering.
- Add off-platform replication: Logs should be exported to immutable storage (e.g., Vercel Postgres is mutable; consider a separate append-only log service or S3 versioning).
- Modify [app/api/logs/route.ts:33](app/api/logs/route.ts#L33) to allow CORE users to query deleted logs separately (`?includeDeleted=true`) for forensic analysis.

---

## Finding 4: Audit Log Retention Policy < Incident-Detection Window

**Severity:** MEDIUM (Open Assumption)  
**Status:** UNVERIFIED  

### Details

The `AuditLog` schema in [prisma/schema.prisma:277–296](prisma/schema.prisma#L277-L296) has **no explicit retention policy**:

```prisma
model AuditLog {
  id        String    @id @default(uuid())
  action    String
  resource  String
  resourceId String?
  metadata  Json?
  createdAt DateTime  @default(now())
  deletedAt DateTime?
  
  actor      Member?   @relation(fields: [actorId])
  actorId    String?
}
```

**Open Questions:**
- How long are audit logs retained in Postgres?
- Are backups retained longer (e.g., 30 days) than live DB retention?
- What is the production incident-detection window (e.g., 7 days, 90 days)?

**Risk:** If audit logs are purged after 7 days but your SLA requires incident investigation within 30 days, there is a gap.

### Recommendation

- Document and enforce DB retention policy: **minimum 90 days** for `AuditLog` rows.
- Consider archiving old logs to immutable cold storage (e.g., S3 with versioning, Vercel Blob with retention lock) after 30 days.
- Add a database job (cron) to export logs to S3 nightly and delete rows older than 90 days (with a grace period).
- Cross-reference Open Assumption #7 (Vercel DB backup retention policy).

---

## Finding 5: No Request-Body Tracing / APM

**Severity:** LOW  
**Status:** N/A (Expected)  

### Details

There is **no APM (Application Performance Monitoring)** integration. Confirmed:
- No Datadog agent.
- No New Relic SDK.
- No OpenTelemetry exporter.
- No request-body capture in error reports.

This is by design (single-origin Next.js app) and is **not a security gap** because:
- Sentry does not capture request bodies by default (good for PII).
- Custom logging in [lib/logger.ts](lib/logger.ts) does not include request bodies.

**Status:** COMPLIANT — No sensitive data is being traced.

---

## Finding 6: Public Monitoring Endpoints—Information Disclosure

**Severity:** MEDIUM  
**Status:** CONFIRMED (Partial Risk)  

### Details

Three monitoring endpoints exist under `/api/monitoring/`:

#### 6.1 `/api/monitoring/health` (CORE-gated)

**File:** [app/api/monitoring/health/route.ts](app/api/monitoring/health/route.ts)  
**Auth:** ✓ GATED — `role !== 'CORE'` → 403 Forbidden  
**Returns:** (last 24h)
- `totalCalls` — total API call count
- `errorCount` — count of 4xx/5xx responses
- `errorRate` — percentage
- `avgDurationMs` — average latency
- `uptime` — availability percentage

**Risk Level:** LOW — Requires CORE authentication; metrics are internal-facing.

#### 6.2 `/api/monitoring/slow` (CORE-gated)

**File:** [app/api/monitoring/slow/route.ts](app/api/monitoring/slow/route.ts)  
**Auth:** ✓ GATED — `role !== 'CORE'` → 403 Forbidden  
**Returns:** Top 20 slowest endpoints (avg/max duration, call count)

**Risk Level:** LOW — Requires CORE authentication; safe for internal use.

#### 6.3 `/api/monitoring/errors` (CORE-gated)

**File:** [app/api/monitoring/errors/route.ts](app/api/monitoring/errors/route.ts)  
**Auth:** ✓ GATED — `role !== 'CORE'` → 403 Forbidden  
**Returns:** Last 50 errors (endpoint, method, status code, duration, error message)

**Risk Level:** MEDIUM — Error messages may leak internal stack traces or database schema. Check error content.

#### 6.4 `/api/public/dashboard-stats` (UNAUTHENTICATED)

**File:** [app/api/public/dashboard-stats/route.ts](app/api/public/dashboard-stats/route.ts)  
**Auth:** ❌ NONE — Public endpoint  
**Returns:** (Cached 60 seconds)
```json
{
  "members": <count of active CommunityMembers>,
  "playbooks": <count of published Playbooks>,
  "bounties": <count of active Bounties>,
  "quests": <count of active Quests>,
  "projects": <count of published Projects>
}
```

**Risk:** PUBLIC INFORMATION DISCLOSURE — Exposes live user counts (members) and content inventory (bounties, quests, projects). An attacker can:
- Poll every 60s to detect churn (count decreases → members leaving).
- Estimate community size and engagement trends.
- Build a growth profile to correlate with external events.

**Information Leaked:** User counts (indirect user-enumeration).

#### 6.5 `/api/public/dashboard-stats/user` (AUTHENTICATED)

**File:** [app/api/public/dashboard-stats/user/route.ts](app/api/public/dashboard-stats/user/route.ts)  
**Auth:** ✓ Session required (line 9)  
**Returns:** User-specific leaderboard rank and stats

**Risk:** LOW (user-specific); standard for public dashboards.

### Recommendation for `/api/public/dashboard-stats`

- **Option 1:** Introduce rate-limiting (e.g., 1 request per 5 minutes per IP) to prevent polling.
- **Option 2:** Add noise to counts (e.g., round to nearest 10) to obscure precision.
- **Option 3:** Gate it behind authentication (requires stakeholder approval).
- Current posture is acceptable for a **community-facing product** (transparency is a feature); document the public nature in your privacy policy.

---

## Finding 7: Sentry DSN in Client (Acceptable)

**Severity:** LOW (Not Applicable)  
**Status:** CONFIRMED (DSN Exposed; Integration Inactive)  

### Details

**Environment Variable:** `NEXT_PUBLIC_SENTRY_DSN` is exposed in [lib/pwaMonitoring.ts:343](lib/pwaMonitoring.ts#L343).

```typescript
// lib/pwaMonitoring.ts:343
if (this.config.sentryDSN && typeof (window as any).Sentry !== 'undefined') {
  (window as any).Sentry.captureException(new Error(report.message), { ... });
}
```

**Analysis:**
1. **DSN is public by design:** Sentry DSNs are intentionally public (frontend SDK initializes with them). No secret is leaked.
2. **Conditional initialization:** The code checks `typeof (window as any).Sentry !== 'undefined'`, meaning:
   - Sentry is **not wired up in the source code** (no `Sentry.init()`).
   - DSN exists but is **unused** (dead DSN or initialized at runtime).
3. **No request-body capture:** Even if Sentry were active, it only logs PWA errors, not request bodies.

**Verdict:** COMPLIANT — Public DSNs are a non-issue. If Sentry is not initialized, the unused DSN is harmless.

### Recommendation

- If Sentry is intended: Initialize it properly in a client-side plugin or remove the unused DSN.
- If Sentry is **not** used: Remove `NEXT_PUBLIC_SENTRY_DSN` to reduce confusion.

---

## Finding 8: No Alerting on Anomalies

**Severity:** HIGH  
**Status:** CONFIRMED (No Anomaly Detection)  

### Details

The codebase has **alerting infrastructure** ([lib/alertNotifications.ts](lib/alertNotifications.ts)) but **no anomaly detection**. Confirmed:

| Signal Type | Monitored? | Alerting? | Notes |
|---|---|---|---|
| Burst signups | ❌ NO | ❌ NO | No logic to detect spikes in `PublicUser` creation |
| Mass redemptions | ❌ NO | ❌ NO | No logic to detect bulk swag orders |
| Failed-auth spikes | ❌ NO | ❌ NO | No login-attempt rate limiting or tracking |
| Role-change attempts | ❌ NO | ❌ NO | No audit of permission changes to detect abuse |
| Admin off-hours access | ❌ NO | ❌ NO | No time-based alerting for CORE logins |
| Admin PII spikes | ❌ NO | ❌ NO | No alerts for unusual data-access patterns |
| JWT verification failures | ❌ NO | ❌ NO | No tracking of session corruption or replay attempts |

**Alerting Infrastructure Present:**
- [lib/alertNotifications.ts](lib/alertNotifications.ts) supports Slack, Email, Webhook channels.
- PWA-specific alerts (cache corruption, quota exhaustion) are initialized but not business-logic alerts.

**Root Cause:** No anomaly-detection logic (no thresholds, no baselines, no machine-learning rules).

### Recommendation

- Add anomaly-detection logic:
  - **Signup spike:** If `PublicUser.count({ createdAt: { gte: last_1_hour } }) > 10 * avg_hourly`, send alert.
  - **Redemption spike:** If `SwagOrder.count({ createdAt: { gte: last_1_hour } }) > 2 * avg_hourly`, send alert.
  - **Admin login off-hours:** If CORE user logs in outside 09:00–17:00 UTC, send alert to on-call.
  - **Failed auth spike:** Implement rate-limiting and log failed attempts; alert if threshold exceeded.

- Integrate into cron jobs or a background queue (e.g., Vercel Cron at `/api/cron/monitor-anomalies`).

---

## Finding 9: Audit Log Integrity (Soft-Delete, No Hash-Chain, No Off-Platform Replication)

**Severity:** MEDIUM  
**Status:** CONFIRMED  

### Details

Expanded from Finding 3. The `AuditLog` table is vulnerable to tampering:

#### 9.1 Soft-Delete Column Allows Removal

**Schema:** [prisma/schema.prisma:289](prisma/schema.prisma#L289)  
**Risk:** Any code that calls `prisma.auditLog.deleteMany()` or `.update({ deletedAt: now() })` can prune logs. Currently no such code exists, but it's not structurally prevented.

#### 9.2 No Hash-Chaining

**Current State:** Rows are standalone with no cryptographic link to previous rows.  
**Impact on Incident Response:**
- If an attacker manually updates a row (changing `action` or `metadata`), there is no way to detect the tampering.
- No "tamper-proof" guarantee—forensic reconstruction relies on human review of log content.

**Example Attack:**
```sql
UPDATE "AuditLog" SET action = 'ADMIN_POINTS_ADJUST' WHERE id = '...';
-- No hash mismatch; no alert
```

#### 9.3 No Off-Platform Replication

**Current State:** Logs live only in Vercel Postgres.  
**Risks:**
- If the DB is compromised, logs can be deleted or modified.
- No independent copy to cross-check against.
- Postgres backups are controlled by Vercel (not explicitly immutable).

**Impact on Incident Response:**
- Delayed forensics: Recovery from backup (if available) takes time.
- No read-only external log stream for real-time compliance monitoring.

#### Incident-Response Impact Summary

| Scenario | Current Posture | Impact |
|----------|---|---|
| Accidental log deletion | Soft-deleted, queryable but hidden from readers | **MODERATE** — Can recover if noticed in time |
| Malicious log tampering | No detection mechanism | **HIGH** — Undetectable data corruption |
| DB compromise | No off-site backup | **CRITICAL** — Single point of failure |
| Forensic analysis after breach | Rely on Vercel DB recovery | **HIGH RISK** — May be unavailable or delayed |

### Recommendation

1. **Remove soft-delete:** Delete the `deletedAt` column from `AuditLog`; use a separate `DeletedAuditLog` archive table with immutable schema if needed.

2. **Add hash-chain:**
   ```prisma
   model AuditLog {
     id            String    @id @default(uuid())
     action        String
     resource      String
     resourceId    String?
     metadata      Json?
     createdAt     DateTime  @default(now())
     actorId       String?
     previousHash  String?   // SHA256 of previous row + metadata
     currentHash   String    // SHA256 of this row (for next row's previousHash)
     actor         Member?   @relation(fields: [actorId])
   }
   ```

3. **Add off-platform replication:**
   - Export logs to S3 (Vercel Blob or AWS S3) daily with **versioning enabled**.
   - Each log export should be signed (HMAC-SHA256) to detect tampering.
   - Retain exports for 180+ days.

---

## Finding 10: Audit Log Readability—Insider Visibility into Coworker Actions

**Severity:** LOW  
**Status:** CONFIRMED (But Intended)  

### Details

The `GET /api/logs` endpoint ([app/api/logs/route.ts](app/api/logs/route.ts)) allows **all CORE users to view all AuditLog entries**, including actions performed by other CORE users.

**Current Implementation (lines 56–61):**
```typescript
include: {
  actor: {
    select: { name: true, image: true, email: true }
  }
}
```

**Visibility Matrix:**
- CORE user A can see: All audit logs, including actions by CORE user B (name, email, action, resource, timestamp).
- No **per-actor filtering** (no `WHERE actorId = currentUserId` option).
- No **role-based redaction** (CORE user B's email is visible to all CORE users).

**Risk Assessment:**
- **Internal transparency:** Some teams intentionally log all admin actions for transparency (good).
- **Privacy concern:** A CORE user can dox another CORE user by querying audit logs.
- **Low severity:** Applies only within the CORE team (trusted insiders); not a public or cross-organization risk.

**Intended Behavior Check:** Line 38 allows filtering by `actorId`:
```typescript
if (actorId && actorId !== "ALL") where.actorId = actorId;
```
This suggests the endpoint supports scoped queries, but it's optional (defaults to all if not provided).

### Recommendation

- **Option 1 (Transparency):** Keep as-is; document in onboarding that CORE admins can see all coworker actions.
- **Option 2 (Privacy):** Add a filter: `if (!actorId || actorId === "ALL") where.actorId = session.user.id;` to default-filter to the current user's logs only.
- **Option 3 (Hybrid):** Require `?actorId=<id>` parameter; deny "ALL" unless user has a special "LOG_READ_ALL" permission.

---

## Summary & Remediation Roadmap

| Finding | Severity | Category | Remediation |
|---------|----------|----------|-------------|
| 1. Plaintext email logging | HIGH | PII Disclosure | Add redaction helper; sanitize [lib/auth-options.ts:79](lib/auth-options.ts#L79) |
| 2. Missing audit logs (points, login, 2FA, status) | CRITICAL | Audit Gap | Add `logAudit()` to [lib/wallet.ts](lib/wallet.ts), [lib/auth-options.ts](lib/auth-options.ts), 2FA routes |
| 3. Audit log immutability not enforced | MEDIUM | Integrity | Remove soft-delete; add hash-chain; off-platform replication |
| 4. Audit retention < detection window | MEDIUM | Policy | Enforce 90-day minimum retention; archive to S3 |
| 5. No request-body tracing | LOW | N/A | No action needed (design is sound) |
| 6. Public dashboard stats disclosure | MEDIUM | Info Disclosure | Add rate-limiting or authentication gate (optional) |
| 7. Sentry DSN in client | LOW | N/A | Remove unused DSN; clarify integration status |
| 8. No anomaly detection / alerting | HIGH | Blind Spot | Implement burst-signup, redemption-spike, off-hours-login alerts |
| 9. Audit log integrity (soft-delete, no hash-chain, no replication) | MEDIUM | Compliance | Same as Finding 3 |
| 10. Insider log visibility | LOW | Privacy | Document or add per-actor filtering (optional) |

---

**Audit Complete:** 2026-05-03  
**Next Phase:** Remediation plan to address Findings 2, 3, 8 (highest priority).
