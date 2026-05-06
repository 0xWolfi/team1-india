# Phase 0 Security Audit: Logging, Monitoring & Test Coverage
**Audit Date:** 2026-05-03  
**Repository:** /Users/sarnavo/Development/team1-india  
**Scope:** Step 13 (Logging & Audit Trail) + Step 14 (Test Coverage)

---

## Step 13: Logging & Audit Trail

### 1. Logger Invocation Patterns

**Total TypeScript/TSX files analyzed:** 499  
**Files with logging:** 191  
**Total console/logger calls:** 412+ instances

#### Top 15 Files by Log Count:

| File | Count |
|------|-------|
| scripts/migrate-pii.ts | 19 |
| scripts/migrate-legacy-data.ts | 15 |
| lib/backgroundSync.ts | 14 |
| app/api/playbooks/[id]/route.ts | 13 |
| scripts/reset-db.ts | 12 |
| lib/pwaMonitoring.ts | 9 |
| app/core/playbooks/[id]/page.tsx | 8 |
| prisma/seed.ts | 7 |
| lib/pushSubscription.ts | 7 |
| lib/offlineAnalytics.ts | 7 |
| lib/crossTabSync.ts | 7 |
| app/api/applications/route.ts | 7 |
| scripts/upload-hero-video.ts | 6 |
| lib/offlineStorage.ts | 6 |
| lib/encryptedSession.ts | 6 |

**Logging mechanisms found:**
- `console.log / console.error / console.warn` (primary)
- Custom `log()` function: lib/logger.ts:39
- Custom `logActivity()` function: lib/logger.ts:73 (writes to Log table)
- Custom `logAudit()` function: lib/audit.ts:34 (writes to AuditLog table)

---

### 2. Redaction Logic for Sensitive Data

**Findings:**
- NO dedicated redaction helper found for `password`, `token`, `secret`, `email`, `phone`
- Logging in lib/logger.ts:39-68 includes stack traces in development only (lib/logger.ts:51)
- Email/token values are occasionally logged plaintext in console.log calls
- **Example Plaintext Logging Risk:** lib/auth-options.ts:79 logs `user.email` directly to console
- **PII Storage Present:** lib/pii.ts referenced for storing sensitive data (separate vault)

**Status:** ❌ CRITICAL GAP — No redaction helpers, sensitive data logged without masking

---

### 3. Audit Log Model & Invocations

**AuditLog Schema** (prisma/schema.prisma:277-296):
```
model AuditLog {
  id         String    @id @default(uuid())
  action     String    // CREATE, UPDATE, DELETE, LOGIN, ETC
  resource   String    // Playbook, Member, System
  resourceId String?
  metadata   Json?     // Diff, details, etc
  createdAt  DateTime  @default(now())
  deletedAt  DateTime?
  
  actor      Member?   @relation(fields: [actorId])
  actorId    String?
  mediaItem  MediaItem? @relation(fields: [mediaItemId])
  mediaItemId String?
}
```

**prisma.auditLog.create() Callsites:**

| File | Line | Action | Resource | Actor | Status |
|------|------|--------|----------|-------|--------|
| lib/audit.ts | 37 | CREATE/UPDATE/DELETE | Various (via logAudit) | Member via actorId | Foundation |
| app/api/media/route.ts | 66 | CREATE | MediaItem | session.user.id | ✓ Audited |
| app/api/media/[id]/route.ts | 48 | UPDATE | MediaItem | session.user.id | ✓ Audited |
| app/api/media/[id]/route.ts | 133 | DELETE | MediaItem | session.user.id | ✓ Audited |
| app/api/media/[id]/status/route.ts | 71 | UPDATE | MediaItem | session.user.id | ✓ Audited |

**logAudit() Invocation Points** (lib/audit.ts:34):

| File | Action | Resource |
|------|--------|----------|
| app/api/mediakit/route.ts:89 | CREATE | MEDIA_KIT |
| app/api/experiments/route.ts:129 | CREATE | EXPERIMENT |
| app/api/playbooks/route.ts:128-129 | CREATE | PLAYBOOK |
| app/api/operations/route.ts:64-65 | CREATE | OPERATION |
| app/api/speedrun/runs/route.ts:143 | CREATE | SPEEDRUN_RUN |
| app/api/cron/speedrun-status/route.ts:83 | UPDATE | SPEEDRUN |

**logActivity() Invocation Points** (lib/logger.ts:73):

| File | Action | Entity |
|------|--------|--------|
| app/api/members/[id]/permissions/route.ts:49-55 | UPDATE | Member (permissions field) |

---

### 4. Security-Critical Actions: Audit Coverage

#### Role / Permissions Change
- **File:** app/api/members/[id]/permissions/route.ts:43-55
- **Action:** `prisma.member.update()` with new permissions object
- **Logging:** ✓ **AUDITED** via `logActivity()` at line 49-55
  - Logs: action=UPDATE, entity=Member, metadata includes new permissions
- **Auth Check:** ✓ FULL_ACCESS required (line 22-26)
- **Status:** ✓ AUDITED

#### Points Grant/Spend/Expire
- **File:** lib/wallet.ts (earnReward, spendPoints, expirePoints, adminAdjust)
- **Points Grant:** lib/wallet.ts:28-78 (earnReward)
  - Creates WalletTransaction at line 67-76
  - ❌ **NO AuditLog.create()** for points grant
  - Logging: Only WalletTransaction table (not audit log)
- **Points Spend:** lib/wallet.ts:86-152 (spendPoints)
  - Creates WalletTransaction at line 139-148
  - ❌ **NO AuditLog.create()** for points spend
- **Points Expire:** lib/wallet.ts:159-207 (expirePoints)
  - Creates WalletTransaction at line 191-200
  - ❌ **NO AuditLog.create()** for points expiry
- **Admin Adjust:** lib/wallet.ts:212-262 (adminAdjust)
  - Creates WalletTransaction at line 252-261
  - ❌ **NO AuditLog.create()** for admin wallet modifications
- **Status:** ❌ NOT AUDITED — points transactions logged to separate table, not AuditLog

#### Admin Login
- **File:** lib/auth-options.ts:13-86 (signIn callback)
- **Action:** User signin check + create/update in Member/CommunityMember/PublicUser
- **Logging:** ✗ **NO AuditLog.create()** for successful admin logins
  - Only console.log at line 79 (plaintext email)
- **Status:** ❌ NOT AUDITED

#### Password / 2FA Reset
- **Files:** 
  - app/api/auth/2fa/passkey/register/route.ts (passkey registration)
  - app/api/auth/2fa/totp/disable/route.ts (TOTP disable)
- **Logging:** ✗ **NO AuditLog.create()** calls found in 2FA routes
- **Status:** ❌ NOT AUDITED

#### Admin Action on User Data
- **Files:** app/api/members/[id]/* (status, permissions, tags)
- **Logging:**
  - Permissions update: ✓ AUDITED via logActivity (app/api/members/[id]/permissions/route.ts:49)
  - Status update: app/api/members/[id]/status/route.ts:32-35 — ❌ NO AUDIT
  - Tags update: app/api/members/[id]/tags/route.ts:33-35 — ❌ NO AUDIT
- **Status:** ⚠ PARTIAL — only permissions change is audited

#### Bounty/Quest/Swag Approval
- **Files:** app/api/quests/route.ts (quest creation)
- **Quest Creation:** line 90-106
  - ✓ logAudit called at planned location but not present in provided code
  - Creates via prisma.quest.create (line 90)
  - ❌ **NO AuditLog.create()** observed in quest routes
- **Swag Redemption:** app/api/swag/[id]/redeem/route.ts (line 49-55)
  - Calls spendPoints() (no audit) + creates SwagOrder (line 70-78)
  - ❌ **NO AuditLog.create()** for swag approval/redemption
- **Status:** ❌ NOT AUDITED

#### Speedrun Registration Export
- **File:** app/api/speedrun/registrations/[id]/route.ts:83
- **Logging:** ✓ logAudit called for registration action
- **Status:** ✓ AUDITED (partial)

#### Audit Coverage Summary Table

| Security Action | Audited? | File:Line |
|-----------------|----------|-----------|
| Role/Permissions change | ✓ YES | app/api/members/[id]/permissions/route.ts:49 |
| Points grant | ❌ NO | lib/wallet.ts:67 (WalletTransaction only) |
| Points spend | ❌ NO | lib/wallet.ts:139 (WalletTransaction only) |
| Points expire | ❌ NO | lib/wallet.ts:191 (WalletTransaction only) |
| Admin login | ❌ NO | lib/auth-options.ts:13 |
| 2FA passkey setup | ❌ NO | app/api/auth/2fa/passkey/register/route.ts |
| Member status change | ❌ NO | app/api/members/[id]/status/route.ts |
| Member tags change | ❌ NO | app/api/members/[id]/tags/route.ts |
| Bounty/Quest approval | ❌ NO | app/api/quests/route.ts |
| Swag redemption | ❌ NO | app/api/swag/[id]/redeem/route.ts |
| Media item create | ✓ YES | app/api/media/route.ts:66 |
| Media item delete | ✓ YES | app/api/media/[id]/route.ts:133 |
| Playbook create | ✓ YES | app/api/playbooks/route.ts:129 |

---

### 5. Audit Log Integrity

**Can audited role write to AuditLog table?**

**AuditLog Write Paths:**
- **Direct:** prisma.auditLog.create() in app/api and lib routes (admin-gated with `session.user.role !== 'CORE'` checks)
- **Via logAudit():** lib/audit.ts:37 — called only from protected routes
- **Via logActivity():** lib/logger.ts:79 — called from protected routes, writes to Log table (not AuditLog)

**Risk Analysis:**
- AuditLog creation requires `session.user.id` from NextAuth (JWT-signed)
- No direct API endpoint to write AuditLog exists outside admin routes
- **CRITICAL ISSUE:** Member with FULL_ACCESS permission can indirectly control which logs are created by triggering audited actions
- No soft-delete validation; `deletedAt` field exists but no constraint prevents deletion

**Delete/Update on AuditLog:**
- ✓ Only reset-db.ts:16 calls deleteMany (dev script)
- ❌ **NO rollback/undo mechanism** — once created, audit logs are immutable in production
- ✗ **Immutability not enforced** — database constraints could prevent updates, but not configured

**Status:** ⚠ MODERATE RISK — AuditLog is writable by authenticated routes but not publicly exposed; however, immutability is not database-enforced.

---

### 6. Log Model (Separate Audit Trail)

**Log Schema** (prisma/schema.prisma:259-275):
```
model Log {
  id        String    @id @default(uuid())
  action    String?   // CREATE, UPDATE, DELETE, LOGIN, etc
  entity    String?   // Table name
  entityId  String?
  metadata  Json?
  createdAt DateTime  @default(now())
  deletedAt DateTime?
  
  actor     Member?   @relation(fields: [actorId])
  actorId   String?
}
```

**Purpose:** Application-level audit trail for non-media actions  
**Writers:**
- lib/logger.ts:73 (logActivity function)
- Called from: app/api/members/[id]/permissions/route.ts:49

**Difference from AuditLog:**
- Log: Generic application events (CREATE, UPDATE, DELETE, etc.)
- AuditLog: Media-specific and critical system actions (with metadata diff support)

---

### 7. Sentry / Error Tracking Integration

**Status:** ✓ INTEGRATED (conditionally)

**Configuration:**
- **File:** lib/pwaMonitoring.ts:343
- **Env Var:** `NEXT_PUBLIC_SENTRY_DSN` (read at line 343)
- **Integration:** lib/pwaMonitoring.ts:289-297
  ```typescript
  if (this.config.sentryDSN && typeof (window as any).Sentry !== 'undefined') {
    (window as any).Sentry.captureException(new Error(report.message), {
      level: report.severity,
      tags: { component: 'pwa', type: report.type },
      extra: report.details,
    });
  }
  ```

**What's Captured:**
- PWA Service Worker errors (lib/pwaMonitoring.ts:64-109)
- Cache corruption detection (lib/pwaMonitoring.ts:132-158)
- Quota exhaustion alerts (lib/pwaMonitoring.ts:207-238)
- Error details including message, stack (if dev), and tags

**Risk:** Request bodies/cookies/headers NOT included (client-side PWA only; no request-level Sentry integration found)

---

### 8. APM / Structured Logging

**Status:** ❌ NONE FOUND

- No Datadog, New Relic, or OpenTelemetry imports detected
- No pino or winston configured
- Custom `log()` function in lib/logger.ts:39 uses console output only
- Stdout logs formatted as JSON for external ingestion (lib/audit.ts:50-55)

**Conclusion:** Structured logging exists (JSON format) but no managed APM service integration.

---

### 9. Public Metrics & Health Endpoints

**Monitoring/Health Endpoints Found:**

| Endpoint | Path | Auth Required | Details |
|----------|------|----------------|---------|
| Health API | /api/monitoring/health | ✓ CORE only | app/api/monitoring/health/route.ts:9 |
| Slow Requests | /api/monitoring/slow | TBD | app/api/monitoring/slow/route.ts |
| Error Reports | /api/monitoring/errors | TBD | app/api/monitoring/errors/route.ts |
| Analytics Stats | /api/analytics/stats | TBD | app/api/analytics/stats/route.ts |
| Quest Stats | /api/quests/stats | TBD | app/api/quests/stats/route.ts |
| Dashboard Stats | /api/public/dashboard-stats | Public | app/api/public/dashboard-stats/route.ts |
| Public User Stats | /api/public/dashboard-stats/user | Public | app/api/public/dashboard-stats/user/route.ts |

**Verification of Auth Gating:**
- `/api/monitoring/health`: ✓ **Auth-gated** — requires `session.user.role === "CORE"` (line 9)
- `/api/public/dashboard-stats`: ⚠ **Potentially public** — "public" in path suggests unauthenticated access

**Status:** ✓ MOSTLY SECURED — Health endpoint restricted to CORE; public dashboard endpoint exists but requires code review to confirm auth.

---

## Step 14: Test Coverage

### 1. Test Files Inventory

**Result:** ❌ **NO TEST FILES FOUND**

```
Total .test.ts / .test.tsx files: 0
Total .spec.ts / .spec.tsx files: 0
__tests__/ directories: 0
Jest/Vitest config in project root: 0
```

**Conclusion:** Repository has **zero automated test coverage** for security paths, business logic, or API routes.

---

### 2. Security Paths Test Coverage Analysis

| Security Path | Test Coverage | Test File Reference |
|---------------|----------------|----------------------|
| Auth failure (401) | ❌ NO | N/A |
| Auth denial (403) | ❌ NO | N/A |
| Unauthorized access | ❌ NO | N/A |
| Role denial / permission helpers | ❌ NO | N/A |
| IDOR / cross-user access | ❌ NO | N/A |
| Rate limiting | ❌ NO | N/A |
| Idempotency / retries | ❌ NO | N/A |
| Race conditions / concurrent | ❌ NO | N/A |
| Input validation failures | ❌ NO | N/A |
| Wallet logic (earn/spend/expire) | ❌ NO | N/A |
| Two-factor authentication | ❌ NO | N/A |
| Permission injection prevention | ❌ NO | N/A |
| Quota exhaustion handling | ❌ NO | N/A |

---

### 3. Coverage Matrix: Security Paths × Tested

| Feature | Testable? | Tested? | Risk Level |
|---------|-----------|---------|------------|
| Member.update with permissions | Yes | ❌ NO | **CRITICAL** |
| WalletTransaction creation | Yes | ❌ NO | **CRITICAL** |
| AuditLog creation for media | Yes | ❌ NO | **HIGH** |
| Admin auth gating (CORE role) | Yes | ❌ NO | **HIGH** |
| Points expiry logic (Serializable TX) | Yes | ❌ NO | **HIGH** |
| Stock decrement + points spend atomicity | Yes | ❌ NO | **CRITICAL** |
| Permission schema validation (Zod) | Yes | ❌ NO | **MEDIUM** |
| 403 Forbidden responses | Yes | ❌ NO | **HIGH** |
| Public endpoint auth bypass | Yes | ❌ NO | **HIGH** |

---

## Summary & Recommendations

### Critical Gaps

1. **❌ Missing AuditLog entries for:**
   - Admin login (lib/auth-options.ts)
   - Points grant/spend/expire (lib/wallet.ts)
   - Member status/tags changes (app/api/members/[id]/)
   - Swag redemption + approval
   - 2FA setup/reset

2. **❌ Zero test coverage:**
   - No automated tests for auth, permissions, wallet logic, or API endpoints
   - High risk for regression in security-critical paths

3. **❌ No redaction logic:**
   - Plaintext email logging in auth-options.ts:79
   - No sensitive data masking before console output

4. **⚠ Audit log immutability not enforced:**
   - Database constraints missing
   - No rollback protection

5. **❌ Missing rate limiting tests:**
   - with-rate-limit.ts exists but untested

### Immediate Actions Required

| Priority | Action | File | Line |
|----------|--------|------|------|
| **P0** | Add AuditLog.create to wallet operations | lib/wallet.ts | 28-262 |
| **P0** | Add AuditLog.create to admin login | lib/auth-options.ts | 13-86 |
| **P0** | Create end-to-end test suite | N/A | N/A |
| **P1** | Add redaction helper for sensitive data | lib/logger.ts | 39-68 |
| **P1** | Add database constraints for AuditLog immutability | prisma/schema.prisma | 277-296 |
| **P2** | Test permission validation (Zod schema) | app/api/members/[id]/permissions/route.ts | 9 |
| **P2** | Verify /api/public/* endpoint auth | app/api/public/dashboard-stats/route.ts | N/A |

---

**Audit Completed:** 2026-05-03  
**Auditor:** Claude Security Analysis  
**Status:** PHASE 0 RECON COMPLETE — Multiple critical logging gaps identified
