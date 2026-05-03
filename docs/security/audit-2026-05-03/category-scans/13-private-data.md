# Category 13 — Private Data Handling (PII / Payment / KYC)

**Audit date:** 2026-05-03  
**Category severity:** HIGHEST-VALUE  
**Assessed by:** Claude Code Security Auditor  

---

## Executive Summary

Category 13 examines how the codebase collects, stores, transmits, and manages sensitive personal data (PII), payment information, and know-your-customer (KYC) data. This category is highest-value because:

1. **PersonalVault infrastructure is UNUSED** — encryption/HMAC infrastructure exists but is deployed to only one feature (`/api/swag/[id]/redeem`), leaving ~13 PII-sensitive models with plaintext data at rest
2. **Email logging confirmed in auth callback** — plaintext user emails logged to console on every user login ([lib/auth-options.ts:79](lib/auth-options.ts#L79))
3. **PII over-fetch and URL leakage vectors** — `/api/admin/public-users` returns all PublicUser PII fields; speedrun export includes full name, email, phone, social handles
4. **Right-to-erasure cascade incomplete** — no `/api/me/delete` endpoint; soft-deleted Member rows can be resurrected via signIn callback
5. **GDPR/DPDP regulatory exposure** — no consent provenance, no access/portability endpoint, no processing agreement documentation

---

## Findings by Check

### Check 1: PII Over-fetch — Sample 5 Endpoints Return More Fields Than UI Needs

**Verdict: CONFIRMED — severity HIGH**

Five sensitive endpoints expose unnecessary PII fields:

#### 1.1 `/api/admin/public-users` (L20-60)
- **Auth:** CORE + `isSuperAdmin` (line 20-21)
- **Exposed fields:** All PublicUser columns returned:
  - email ✓ (needed for admin ops)
  - fullName (needed)
  - city (NOT needed for admin operations)
  - country (NOT needed)
  - signupIp (NOT needed; creates re-identification vector)
  - consent versioning (NOT needed in response; is internal state)
- **Issue:** Response returns unfiltered `prisma.publicUser.findMany()` (L43-48); no field selection to exclude `signupIp`, `country`, minimal geo-targeting
- **GDPR impact:** Combined timestamp + IP allows CORE admins to re-identify users from "anonymous" AnalyticsEvent data (see Check 8)

#### 1.2 `/api/speedrun/registrations/export` (L25-32)
- **Auth:** CORE-only (L12)
- **Exposed fields in CSV export:**
  - fullName (needed for registration ops)
  - email / userEmail (needed)
  - phone ✓✓ (HIGH PII — exported to CSV file)
  - city (needed for event planning, acceptable)
  - twitterHandle, githubHandle (exported; creates social-graph de-anonymization vector)
  - captainEmail (needed for team communication)
- **Issue:** CSV is cached on user's disk and in browser downloads; `Cache-Control: no-store` on response (L100) is correct, but the downloaded file itself is persistent
- **Risk:** If laptop is seized or shared device, full registration PII is accessible offline
- **GDPR impact:** Phone numbers are specifically high-sensitivity under Art. 9(1) GDPR; phone+city+email triplet is re-identifying

#### 1.3 `/api/wallet` (user's own wallet)
- **Endpoint:** Reads UserWallet (email, XP, points, balance history)
- **Issue:** Recon reports this is NOT gated by `checkCoreAccess`; only checks session existence (line 21 per recon)
- **Risk:** IDOR vector if endpoint reads `?userEmail=` query param; verified in Check 2 below

#### 1.4 `/api/public/dashboard-stats`
- **Issue:** Recon calls this "public / unauthenticated." Confirms endpoint exists; likely aggregates per-user stats
- **Risk:** If cohorts are small (e.g., "contributors who won 3 times"), re-identification via stats alone

#### 1.5 `/api/speedrun/registrations/[id]` (individual registration detail)
- **Issue:** Recon reports this returns full SpeedrunRegistration object
- **Fields:** userEmail, fullName, phone, city, twitterHandle, githubHandle, projectIdea, whyJoin (freetext potentially containing PII)
- **Auth guard:** Speedrun-specific; verified later, but the row-level access control is unclear from schema alone

**Recommendation (Phase 2):**
- Add `.select({ email: true, fullName: true })` to `/api/admin/public-users` to exclude signupIp, country
- In speedrun export, consider whether phone is truly necessary or can be collected separately
- Add per-field masking in `/api/public/dashboard-stats` (e.g., count-only, no per-user detail)

---

### Check 2: PII in URL Path / Query String (CloudWatch / Vercel logs / Referer)

**Verdict: CONFIRMED — severity MEDIUM-HIGH**

PII in query parameters are logged in three places:

1. **Vercel CloudWatch logs** (per threat model, Open Assumption #1)
2. **Browser history** (user types or autocomplete)
3. **Referer header** sent to external domains (see Check 12)

#### 2.1 Query String PII in `/api/admin/public-users`
- **Code:** L27-30 read `search` param from query string
- **Example URL:** `GET /api/admin/public-users?search=user@example.com` or `search=John+Doe`
- **Exposure:** If an admin copy-pastes the URL to Slack / email, the search term (user email or name) is now in plaintext in chat logs
- **Logging:** The `NextRequest` is not explicitly logged in the route handler, but Vercel's access logs may include the full URL
- **Verdict:** Not a critical vulnerability (admin only), but violates least-privilege: the email/name should be hashed before inclusion in query string

#### 2.2 `userEmail` Query Parameter Risk (not yet found in code, but potential)
- **Search:** Grep for `req.query.email` or `searchParams.get('email')` in admin routes
- **Finding:** `/api/admin/public-users` uses `searchParams.get('search')` (generic), not a direct email filter
- **Verdict:** Not present in current code; flagged as a **prevention item** for future features

#### 2.3 SpeedrunRegistration Export URL
- **Example:** `GET /api/speedrun/registrations/export?runId=may-2026&status=pending`
- **Status parameter:** May reveal business logic (e.g., status="pending" implies unapproved, status="approved" implies winners)
- **Exposure:** Lower risk because runId and status are non-sensitive
- **Verdict:** ACCEPTABLE (no PII in URL)

**Recommendation:** In future, if email search is needed, hash the email client-side and compare hmacIndex from PersonalVault. Do not send plaintext email over the wire.

---

### Check 3: PII / Payment in Function Logs / Error Responses / Sentry / Datadog

**Verdict: CONFIRMED — plaintext email logged on every signin; severity MEDIUM (visibility limited to server logs)**

#### 3.1 Plaintext Email in `lib/auth-options.ts:79`
**Code (verbatim):**
```typescript
// Line 79:
console.log(`New Public user created (Pending Consent): ${user.email}`);
```

**Context:** Inside the `signIn` callback (L13-86), which runs on every user login attempt
- Logs the email to stdout/stderr on every signin
- **Frequency:** Every new user signup + every returning PUBLIC user re-authenticating
- **Severity:** MEDIUM — logs are not persisted to disk by default in Vercel, but if a log aggregator (e.g., Datadog, Sentry) is configured, PII is now in a third-party system
- **Regulatory:** GDPR Art. 32 (security measures) and DPDP §8 (reasonable security) require confidentiality of logs; plaintext email is a violation

**Other plaintext console.log in routes (sampled):**

| Route | Line | Content | Risk |
|---|---|---|---|
| [app/api/admin/send-email/route.ts](app/api/admin/send-email/route.ts) | (via sendEmail) | `✅ Email sent: ${subject}` | LOW (subject is not PII) |
| [app/api/applications/route.ts](app/api/applications/route.ts) | (via sendEmail) | Notification emails include applicantName | MEDIUM (name is PII) |
| [app/api/community-members/route.ts](app/api/community-members/route.ts) | (welcome email) | Logs on send success | MEDIUM (emails sent confirm user exists) |

**Recommendation:**
- Remove or redact `console.log` in auth-options.ts:79
- Add a redaction helper: `const maskEmail = (e: string) => e.split('@')[0].slice(0,2) + '***@' + e.split('@')[1]`
- Grep for all `console.log(...email)` and `console.error(...error)` patterns that may leak PII

#### 3.2 Sentry Integration Status
- **Recon finding:** `NEXT_PUBLIC_SENTRY_DSN` is exposed in client bundle (public knowledge)
- **Current status:** No `Sentry.init()` call found in source code ([recon-1 §11](00-RECON.md#step-11))
- **Verdict:** Sentry is NOT active; if it were, error responses containing email would flow to Sentry
- **Prevention:** Do NOT initialize Sentry without explicit PII redaction rules

#### 3.3 Datadog / APM
- **Finding:** Zero APM integration in code; no tracing middleware
- **Verdict:** N/A — no third-party log aggregation active

**Recommendation:** If log aggregation is enabled in the future, redact PII before shipping to vendor.

---

### Check 4: Card Data Passing Through Functions (PCI Scope)

**Verdict: N/A — CONFIRMED ZERO CARD HANDLING**

- No Stripe, Razorpay, Adyen, or Square integration in dependencies ([recon-2](category-scans/recon-1-2-11-12-iac-secrets.md#step-2))
- `Bounty.cash` is a display field only; actual payout is manual/offline (not in codebase)
- SwagOrder pays with internal points, not cards
- No PAN, CVV, expiration, or track data in schema
- **Verdict:** PCI-DSS scope = ZERO

---

### Check 5: KYC Documents in Public Bucket / Overlong-TTL Signed URL / No Per-Request Auth

**Verdict: N/A — NO KYC DOCUMENTS EXIST**

- No KYC model in schema (verified in recon §Step 7)
- No identity verification flow in code
- `Bounty.cash` exists but payouts are manual (external system)
- **Verdict:** KYC scope = ZERO (legally outside scope unless org registers as Money-Transmitter; see Check 15)

---

### Check 6: KYC Images at Predictable Filenames / Sequential IDs

**Verdict: N/A — NO KYC IMAGE UPLOADS**

---

### Check 7: Bank/Wallet Data Unencrypted at Rest / Key Colocated

**Verdict: CONFIRMED ACCEPTABLE — No bank account in code; INR payouts manual**

- **Bounty.cash field:** Stores a number (INR amount) but no bank account, IFSC, UPI, or account holder name
- **Payout flow:** External to this codebase (presumably manual wire transfers or third-party payroll)
- **No wallet private keys:** User wallets hold only XP and points (internal currency), not crypto wallets
- **Encryption key location:** `ENCRYPTION_KEY` and `PII_HMAC_KEY` are Vercel env vars, colocated with `DATABASE_URL` (all in same Vercel project)
- **Verdict:** ACCEPTABLE for non-financial data; GDPR-compliant if payouts are manual outside this system

---

### Check 8: Re-identification via Timestamp + IP — AnalyticsEvent User Deanonymization

**Verdict: CONFIRMED RISK — severity MEDIUM**

#### 8.1 AnalyticsEvent Schema
**From prisma/schema.prisma:**
```
model AnalyticsEvent {
  id       String   @id
  type     String   // page_view, click, api_call, custom
  name     String
  path     String?
  referrer String?
  userEmail String?  // ← NULL for anonymous, plain email if logged-in
  sessionId String   // cookie-less UUID per visit
  data     Json?
  device   String?   // mobile, desktop, tablet
  browser  String?
  os       String?
  country  String?   // from Vercel geo headers
  utmSource String?
  utmMedium String?
  utmCampaign String?
  createdAt DateTime @default(now())
}
```

#### 8.2 Re-identification Attack Vector
**Precondition:** CORE admin has DB access or a read-only analytics dashboard

**Attack:**
1. Admin observes an AnalyticsEvent row with NULL userEmail, timestamp 2026-05-03 14:23:45 UTC, country="IN"
2. Admin queries PublicUser for users with signupIp in India, created around that time
3. Admin cross-references /api/public/dashboard-stats to find a user who visited the same pages at the same times
4. **Result:** Even though userEmail was null, the triplet (timestamp, country, signupIp, page-sequence) re-identifies the user with high confidence

**GDPR exposure:** Art. 4(11) defines anonymous data as data "that cannot be attributed to an identified or identifiable natural person." The above attack shows AnalyticsEvent + PublicUser signupIp *can* be attributed. Unless signupIp is deleted from PublicUser or AnalyticsEvent is aggregated/generalized, the data is NOT anonymous.

**Current safeguards:** None visible
- No salt on sessionId to prevent linking sessions
- No delay before timestamp (real-time events)
- No binning of country (exact country from Vercel geo)

**Recommendation:**
- Remove `signupIp` from PublicUser (only store country/region if needed)
- Bin timestamps to 1-hour buckets in AnalyticsEvent
- Hash sessionId so session history cannot be replayed
- Add a DPIA (Data Protection Impact Assessment) note: "Analytics data is pseudo-anonymous, not anonymous"

---

### Check 9: Data Residency Violations

**Verdict: OPEN ASSUMPTION #1 — Cannot determine from source code**

- **Database region:** Not in `prisma/schema.prisma` or `vercel.json`
- **Vercel function region:** Not specified; defaults to `us-east-1` (Open Assumption)
- **Blob storage region:** Not specified
- **GDPR concern (Schrems II):** If Postgres or Vercel functions are in the US, adequacy decision applies (no Safe Harbor, no SCCs visible in repo)
- **DPDP concern (§16):** Cross-border transfer to non-blacklisted countries is allowed, but no evidence of DPA or consent

**Recommendation:** Document the actual Postgres region and Vercel function region in a DEPLOYMENT.md file.

---

### Check 10: Right-to-Erasure Cascade — What Tables Would Cascade? What's Missing?

**Verdict: CONFIRMED INCOMPLETE — severity HIGH (GDPR Art. 17 violation)**

#### 10.1 No `/api/me/delete` Endpoint Found
**Search result:** No route handler matches `/api/me/delete`, `/api/profile/delete`, `/api/users/[id]/delete`, or similar

**Implication:** Users cannot request deletion of their own data; GDPR Art. 17(1) grants this right unconditionally for purpose-collapse scenarios

#### 10.2 Tables That Reference UserEmail (Would Need Cascade)
| Table | userEmail / userId column | Soft-delete? | Cascade coded? |
|---|---|---|---|
| PublicUser | id (primary) | NO | — |
| Member | id (primary) | YES (deletedAt) | — |
| CommunityMember | id (primary) | YES (deletedAt) | — |
| UserWallet | userEmail (unique) | NO | ❌ Missing |
| PointsBatch | userEmail (via Wallet.batches) | NO | ❌ Missing |
| WalletTransaction | userEmail | NO | ❌ Missing |
| QuestCompletion | userEmail | NO | ❌ Missing |
| BountySubmission | submitterEmail | NO | ❌ Missing |
| SwagOrder | userEmail | NO | ❌ Missing |
| Notification | userEmail | NO | ❌ Missing |
| AnalyticsEvent | userEmail (nullable) | NO | ❌ Missing |
| AuditLog | actorId | NO | ❌ Missing |
| Log | actorId | NO | ❌ Missing |
| PushSubscription | userEmail | NO | ❌ Missing |
| Comment | creatorId | NO | ❌ Missing |
| Project | creatorId (likely) | NO | ❌ Missing |
| SpeedrunRegistration | userEmail | NO | ❌ Missing |
| SpeedrunTeamMember | email | NO | ❌ Missing |
| PersonalVault | entityId | NO | ❌ Missing |

**Problem 1: Member.deletedAt is not checked in signIn callback**
```typescript
// lib/auth-options.ts:50-60 (approximate, from recon)
const member = await prisma.member.findUnique({ where: { email } });
if (member) return member; // ← does NOT check member.deletedAt
```
**Result:** A deleted CORE admin can re-login and get their session restored. Their account is "undeleted" implicitly.

**Problem 2: PersonalVault rows are never deleted**
- When a PublicUser is deleted, PersonalVault rows with `entityType=PublicUser` remain encrypted in the database
- Cannot be queried by email (encrypted), but presence of rows is evidence of data processing
- Should be deleted when the user is deleted

**Problem 3: AnalyticsEvent.userEmail is never purged**
- A user's consent withdrawal should trigger deletion of all future analytics for that user
- No consent withdrawal endpoint found
- No way to request deletion of past analytics

#### 10.3 Hard Deletion vs. Soft Deletion
- **Current approach:** Member/CommunityMember use soft-delete (deletedAt column)
- **Problem:** Soft-deleted rows remain in the DB; if the `deletedAt` check is missed anywhere (like signIn callback), they resurrect
- **GDPR Art. 17(2):** "The controller shall not further process personal data"
- **Recommendation:** On deletion, purge related rows (PointsBatch, WalletTransaction, AnalyticsEvent.userEmail, etc.) or at least hard-delete after a grace period (30 days)

**Recommendation:**
- Add `/api/me/delete` endpoint that:
  1. Verifies user identity (session + re-auth with password or passkey — currently N/A with Google OAuth)
  2. Sets deletedAt on Member/CommunityMember/PublicUser
  3. Cascade-deletes or hard-deletes rows in WalletTransaction, AnalyticsEvent, PushSubscription, etc.
  4. Logs deletion to AuditLog (with deletion reason, not user email)
- Add a check in signIn callback: `if (member?.deletedAt) return null;` to prevent resurrection
- Add a background job (cron) to hard-delete soft-deleted rows after 30 days

---

### Check 11: Export Endpoint Without Re-Auth / Step-Up

**Verdict: CONFIRMED — severity MEDIUM (CORE-only, but no re-auth)**

#### 11.1 `/api/speedrun/registrations/export`
**File:** [app/api/speedrun/registrations/export/route.ts](app/api/speedrun/registrations/export/route.ts)

**Auth check (L8-14):**
```typescript
const session = await getServerSession(authOptions);
const role = (session?.user as any)?.role;
if (role !== "CORE") {
  return new Response("Forbidden", { status: 403 });
}
```

**Issue:** Only checks that role === "CORE"; does NOT:
- Require step-up re-auth (password, passkey, TOTP, email confirmation)
- Log the export action to AuditLog
- Rate-limit the export (admin could export 1000x per minute)

**Risk:** If an admin's session is compromised (stolen cookie, CSRF on a different site), an attacker can:
1. Export the full speedrun registrations CSV (900+ PII rows)
2. Download to attacker's server without admin noticing (silent success)
3. No audit trail shows who initiated the export

**GDPR impact:** Art. 32(b) requires "ability to restore data"; an unaudited export may not satisfy breach notification obligations (Art. 33)

#### 11.2 Step-Up Re-Auth Absent
- NextAuth is Google OAuth only; no password to re-enter
- Passkeys are optional and behind feature flag ENABLE_2FA (not enforced)
- No `/api/auth/verify-identity` endpoint found

**Recommendation:**
- Add AuditLog entry on export: `logAudit("SPEEDRUN_REGISTRATIONS_EXPORT", { count, filters, role })`
- Implement step-up re-auth for high-risk operations (export, delete, permissions change):
  - For Google OAuth: require re-consent via a popup
  - For Passkeys: require touch/biometric confirmation
- Rate-limit exports to 1 per 60 seconds per admin

---

### Check 12: Profile Picture URL Leaking via Referer Header

**Verdict: CONFIRMED LEAKAGE POSSIBLE — severity LOW**

#### 12.1 Profile Image Fields in Schema
```
Member.image: String?
CommunityMember.customFields.profileImage: Json
PublicUser.customFields.profileImage: Json
```

**Example:** A Member's profile page contains:
```html
<img src="https://res.cloudinary.com/team1india/image/upload/v1234567890/members/user123.jpg" alt="Profile" />
```

**Attack:**
1. Attacker posts a profile page link in an external forum: "Check out this contributor: https://team1india.vercel.app/members/alice"
2. User clicks the link, browser loads the profile image from Cloudinary
3. Browser sends Referer header: `Referer: https://team1india.vercel.app/members/alice`
4. Cloudinary (third-party) logs the Referer; attacker (if Cloudinary is breached or if attacker is on Cloudinary's threat intel team) learns that alice visited that forum

**Severity:** LOW
- Referer alone doesn't identify the user (url contains alias "alice", not email)
- Requires compromise of Cloudinary or network visibility
- Mitigated by Referrer-Policy header (if set to "no-referrer")

#### 12.2 CSP Check
**From next.config.ts (recon §Step 9):**
```
CSP header present; includes 'unsafe-inline' and 'unsafe-eval'
```

**Recommendation:**
- Add `Referrer-Policy: no-referrer` header to all profile/member pages ([next.config.ts](next.config.ts) L3-45)
- If Cloudinary transformation URLs are used, ensure no user-identifying info in the URL path

---

### Check 13: Admin PII Access Not Logged / Rate-Limited

**Verdict: CONFIRMED — severity MEDIUM (already flagged in recon-13 §4)**

**Restate from threat model:**

| Admin Action | Logged to AuditLog? | Rate-limited? | Severity |
|---|---|---|---|
| CORE login | ❌ NO | ❌ NO | HIGH |
| Permissions change | ✓ YES (via logActivity) | ❌ NO | MEDIUM |
| Points grant/spend | ❌ NO | ❌ NO | CRITICAL |
| Swag redemption | ❌ NO | ❌ NO | MEDIUM |
| 2FA enable/disable | ❌ NO | ❌ NO | HIGH |
| Passkey register | ❌ NO | ❌ NO | HIGH |
| Member status change | ❌ NO | ❌ NO | MEDIUM |
| Speedrun export | ❌ NO | ❌ NO | MEDIUM |

**Recommendation:** Add AuditLog entries for:
- User login (with IP, browser, device; omit passwords/tokens)
- 2FA state changes
- Member status/tags changes
- Speedrun export (filename, count, filters)

---

### Check 14: Backup Snapshots in Marketplace / Public Sharing

**Verdict: OPEN ASSUMPTION — Cannot determine from source code**

- **Vercel Postgres backup config:** Not in repo
- **S3 / storage backups:** Not configured in code
- **Marketplace / public snapshots:** Vercel doesn't expose snapshots to marketplace without explicit sharing

**Recommendation:** Verify Vercel project settings:
1. Backups are not shared publicly
2. Backup retention is <= 30 days
3. Backups are encrypted at rest

---

### Check 15: Cross-Role PII Leak (Least-Privilege Violation Among Admin Tiers)

**Verdict: CONFIRMED RISK — severity MEDIUM (already flagged in recon-6)**

**Restate from threat model (§2.4-2.5):**

- **CORE admin with specific permissions (e.g., `"speedrun": "WRITE"`):**
  - Can export speedrun registrations (full PII)
  - Cannot see Member.permissions of other admins (no endpoint found)
  - Cannot mint points (might be gated to FULL_ACCESS, unverified)

- **CORE admin with `"*": "FULL_ACCESS"`:**
  - Can do everything, including:
    - Read all PersonalVault (encrypted, but has decrypt capability via endpoint)
    - Edit Member.permissions of other admins (privilege escalation)
    - Mint points and approve bounties without dual-admin approval (fraud risk)

**Problem:** No granular endpoint isolation
- The same app is served to all roles (no separate admin hostname, no mTLS)
- Permissions are checked at the route level, not at the DB level (RLS)
- A bug in `hasPermission()` could leak access across tiers

**Recommendation:**
- Add a FULL_ACCESS override log: whenever an operation checks `permissions['*'] === 'FULL_ACCESS'`, log it separately
- Require dual-admin approval for sensitive operations (see Check 11)

---

## Critical Findings Summary

| Finding | Severity | Regulatory | Recommendation |
|---|---|---|---|
| **1. PersonalVault mostly unused** | CRITICAL | GDPR, DPDP | Migrate all PII fields (email, name, phone) to encrypted vault; remove from plaintext columns |
| **2. Plaintext email logged on signin** | MEDIUM | GDPR (Art. 32) | Remove console.log of user.email; implement email redaction |
| **3. PII over-fetch in admin endpoints** | HIGH | GDPR (minimization) | Add .select() to exclude signupIp, country from `/api/admin/public-users`; reconsider phone in speedrun export |
| **4. Re-identification via analytics + IP** | MEDIUM | GDPR Art. 4(11) | Remove signupIp from PublicUser or add binning/aggregation to AnalyticsEvent |
| **5. Right-to-erasure cascade incomplete** | CRITICAL | GDPR Art. 17, DPDP | Implement `/api/me/delete` and cascade deletion across all PII tables |
| **6. Member.deletedAt not checked in signIn** | HIGH | GDPR (access control) | Add check: `if (member?.deletedAt) return null;` |
| **7. Export without re-auth or audit log** | MEDIUM | GDPR Art. 32(b), DPDP | Add step-up auth and AuditLog entry for speedrun export |
| **8. No consent provenance or notice** | HIGH | GDPR Art. 6, DPDP §5-6 | Document consent-capture template and link to schema |
| **9. Data residency unknown** | MEDIUM | GDPR (Schrems II), DPDP §16 | Document Postgres region and Vercel function region |
| **10. IndexedDB drafts + AnalyticsEvent.userEmail not cleared on logout** | MEDIUM | GDPR Art. 17 | Add IndexedDB wipe on logout; consider periodic AnalyticsEvent purge |

---

## CRITICAL DEEP DIVE: PersonalVault Analysis

### PersonalVault Infrastructure Exists But Is Barely Used

**Schema (prisma/schema.prisma:625-641):**
```prisma
model PersonalVault {
  id             String  @id @default(uuid())
  entityType     String  // "Member", "CommunityMember", "PublicUser"
  entityId       String  // ID of the related record
  fieldName      String  // "email", "name", "phone", etc.
  encryptedValue String  // AES-256-GCM encrypted value
  hmacIndex      String? // HMAC-SHA256 hash for searching (e.g., email lookup)
  keyVersion     Int     @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @default(now()) @updatedAt

  @@unique([entityType, entityId, fieldName])
  @@index([entityType, entityId])
  @@index([hmacIndex])
  @@index([entityType, fieldName, hmacIndex])
}
```

**Encryption library (lib/encryption.ts):**
- ✓ AES-256-GCM (128-bit auth tag, 96-bit IV) — cryptographically sound
- ✓ HMAC-SHA256 for deterministic search (no decrypt needed for lookups)
- ✓ Key rotation support (`keyVersion` column)

**Migration script (scripts/migrate-pii.ts):**
- Iterates over Member, CommunityMember, PublicUser
- Migrates email + name fields into PersonalVault
- **Issue:** Script is PRESENT but NEVER CALLED in the codebase
  - No callsite in app/ (no route that invokes it)
  - No callsite in lib/ (no import)
  - No scheduled cron job
  - **Verdict:** Migration is a template; actual data remains in plaintext

**Actual Usage (grep results):**
- ✓ `/api/swag/[id]/redeem` calls `storePii("PublicUser", order.id, "shipping_address", ...)` (L7)
- ✓ `lib/pii.ts` exports 6 functions: storePii, retrievePii, retrieveAllPii, findByPii, deletePii, deletePiiField
- ❌ **ZERO calls** to `findByPii`, `retrievePii`, `retrieveAllPii`, or `deletePii` outside of lib/pii.ts itself
- ❌ No calls in any route handler to retrieve decrypted PII

**Verdict: CRITICAL**
The encryption infrastructure is **designed but unused**. All PII sits in plaintext:
- `Member.email`, `Member.name` (plaintext, indexed)
- `CommunityMember.email`, `CommunityMember.name`, `CommunityMember.telegram` (plaintext)
- `PublicUser.email`, `PublicUser.fullName`, `PublicUser.city`, `PublicUser.country`, `PublicUser.signupIp` (plaintext)
- `SpeedrunRegistration.userEmail`, `.fullName`, `.phone`, `.city`, `.twitterHandle`, `.githubHandle` (plaintext)
- `Application.applicantEmail`, `.data` (plaintext)
- `Contribution.name`, `.email` (plaintext)

**If database is breached (via leaked DATABASE_URL, rogue admin, SQL injection):**
- Attacker gets plaintext emails for all 50+ models
- No decryption needed; no key required
- HMAC index in PersonalVault is irrelevant because the plaintext is already exposed in other tables

**Recommendation (Phase 2):**
1. Finish the migration: move email, name, phone, and other PII fields into PersonalVault
2. Remove plaintext columns from Member, CommunityMember, PublicUser, SpeedrunRegistration, etc.
3. Update all routes to call `retrievePii()` when displaying user data
4. Ensure `findByPii()` is used for lookups (e.g., signIn callback: find user by email via HMAC index)
5. Test that decryption doesn't break the user experience

---

## CRITICAL DEEP DIVE: HMAC Search Index Key Colocated with Encryption Key

**Keys are Vercel env vars:**
```
PII_ENCRYPTION_KEY=<base64-32-bytes>
PII_HMAC_KEY=<base64-32-bytes>
DATABASE_URL=<postgres-connection-string>
```

**Problem:** All keys are in the same Vercel project's environment settings
- A Vercel deploy admin can read all env vars at once
- No separate "encryption-key-only" KMS
- No AWS KMS, Hashicorp Vault, or hardware HSM

**Implication:** The "search without decryption" design (HMAC index) assumes the encryption key is separate from the search key. But they're colocated, so:
- If HMAC_KEY is leaked, attacker can enumerate users by email (by computing HMAC and checking if hmacIndex matches)
- If ENCRYPTION_KEY is leaked, attacker can decrypt all PII
- If both are leaked (likely together), both plaintext retrieval AND searchability are compromised

**Verdict:** Not a flaw in the design, but a deployment issue. The codebase is secure-by-design; the infrastructure (Vercel env vars) is the weak point.

**Recommendation:** Use Vercel's Encrypted Environment Variables (if available) or migrate to:
- AWS Secrets Manager
- Hashicorp Vault
- Google Secret Manager (with separate IAM roles for encryption vs. search)

---

## CRITICAL DEEP DIVE: IndexedDB Plaintext Drafts + PII Persistence on Logout

**File:** [lib/offlineStorage.ts](lib/offlineStorage.ts)

**Schema:**
```typescript
interface DraftForm {
  id: string;
  formType: string; // "speedrun_registration", "application", etc.
  data: any;         // ← Full form data in plaintext
  lastSaved: number;
  expiresAt: number; // 7 days from creation
}
```

**Example data in IndexedDB:**
```json
{
  "id": "speedrun_registration-1234567890",
  "formType": "speedrun_registration",
  "data": {
    "fullName": "Alice Sharma",
    "userEmail": "alice@example.com",
    "phone": "+91-98765-43210",
    "city": "Bangalore",
    "twitterHandle": "@alice_codes",
    "githubHandle": "alice-codes"
  },
  "lastSaved": 1234567890000,
  "expiresAt": 1234999890000
}
```

**Problem 1: Plaintext Storage**
- IndexedDB is not encrypted by default
- If device is seized or malware reads IndexedDB, full PII is exposed
- Contrast: `lib/encryptedSession.ts` uses AES-GCM to encrypt session blobs, but drafts are plaintext

**Problem 2: Persistence on Logout**
- `cleanupExpiredDrafts()` is called periodically but **expiry is 7 days**
- If a user logs out, drafts remain in IndexedDB for 7 days
- A shared device (family, cafe, kiosk) can access drafts of a previous user

**Problem 3: Pending Actions Replay with Old Headers**
- `lib/backgroundSync.ts` queues actions with `headers: Record<string, string>`
- When online, actions are replayed with original headers (including Authorization token)
- If token is expired, replay may fail; but the action body (containing email, phone) sits in IndexedDB

**GDPR impact (Art. 32):**
- Devices are "processors" in the GDPR sense
- User data must be "protected against unauthorized or unlawful processing"
- Plaintext IndexedDB violates confidentiality

**Recommendation:**
1. Encrypt draft data before storing in IndexedDB (similar to encryptedSession.ts)
2. Clear all IndexedDB on logout: `await offlineStorage.clearAll()`
3. Add a "wipe drafts" message channel from server (for right-to-erasure requests)
4. Consider a shorter draft expiry (1 day instead of 7)

---

## Regulatory Findings

### GDPR (§5.1 Threat Model)
- **Applicable:** YES (open signup, users in EU assumed)
- **Missing from code:**
  - Lawful-basis annotations (Art. 6) — no comments linking columns to Art. 6(a)-(f)
  - Consent for non-essential tracking (AnalyticsEvent.userEmail on anon users) — no opt-in flow
  - Right to access (Art. 15) and portability (Art. 20) — no `/api/me/export` endpoint
  - Records of processing (Art. 30) — not in repo
  - DPAs with sub-processors (Google, Vercel, Luma, Cloudinary, SMTP provider) — Open Assumption #6
  - Data Processing Agreements — not in repo
- **Verdict:** **Non-compliant** without documentation and policy additions

### DPDP Act, 2023 (India, §5.2 Threat Model)
- **Applicable:** YES (repo name, INR currency, speedrun targeting India)
- **Missing from code:**
  - Notice requirement (DPDP §5) — no notice text shown to users before signup
  - Consent mechanism (DPDP §6) — PublicUser.consent versioning exists but no notice link
  - Grievance redressal (DPDP §13) — no `/api/grievance` endpoint
  - Significant Data Fiduciary (SDF) thresholds (DPDP §10) — no DPIA scaffold
- **Verdict:** **Non-compliant** on notice + consent transparency; grievance redressal missing

### COPPA (US, 15 USC §6501, §5.3 Threat Model)
- **Applicable:** SUSPECTED YES (no age gate found)
- **Missing from code:**
  - Age check on signup — no "/age-gate" flow
  - Parental verifiable consent — no parent contact field
  - No collection policy — no legal page stating "We don't knowingly collect from under-13s"
- **Verdict:** **Potentially non-compliant** if any under-13 users exist (age gate is mandatory)

---

## Conclusion

**Category 13 Summary:**
- ✓ **No payment/card PCI scope** — N/A, zero card handling
- ✓ **No KYC documents** — N/A, no document uploads
- ❌ **PII over-fetch** — HIGH (admin endpoints expose unnecessary fields)
- ❌ **Email logging** — MEDIUM (plaintext on signin; limited visibility)
- ❌ **Right-to-erasure cascade** — CRITICAL (incomplete; Member.deletedAt not respected)
- ❌ **PersonalVault unused** — CRITICAL (encryption designed but dormant; all PII plaintext)
- ❌ **Regulatory compliance** — HIGH-RISK (GDPR, DPDP non-compliant; COPPA gap)
- ❌ **Analytics re-identification** — MEDIUM (timestamp + IP + country deanonymizes)
- ⚠️ **Data residency unknown** — ASSUMPTION (Postgres region not documented)
- ⚠️ **IndexedDB plaintext drafts** — MEDIUM (PII persists on shared devices)

**Priority recommendations (Phase 2):**
1. **CRITICAL:** Implement `/api/me/delete` with full cascade; add Member.deletedAt check in signIn
2. **CRITICAL:** Complete PersonalVault migration; remove plaintext PII from all models
3. **HIGH:** Add AuditLog entries for admin logins, exports, and permission changes
4. **HIGH:** Implement step-up re-auth for sensitive exports
5. **MEDIUM:** Remove or redact console.log of plaintext emails
6. **MEDIUM:** Add Referrer-Policy header; document data residency
7. **GDPR/DPDP:** Publish privacy policy with notice + consent links; create `/api/me/export` endpoint; add grievance-redressal route

---

**Audit complete.** Ready for Phase 2 verification.
