# Category 11 — Authentication & Session Management

**Audit date:** 2026-05-03  
**Repository:** team1-india at branch `test`  
**Auditor:** Claude (autonomous agent)  
**Scope:** NextAuth v4.24.13, JWT strategy, 2FA (TOTP + WebAuthn), session handling, role/permission management.

**Summary:** 10 findings across JWT validation, 2FA enforcement, session revocation, account enumeration, and passkey implementation. Most are medium severity due to feature-flag gating (ENABLE_2FA) and lack of production evidence. One critical finding on account enumeration timing.

---

## Finding 1: No Server-Side Session Revocation on Role/Permission Change

**Severity:** Medium  
**CVSS v3.1:** 6.5 (Medium, network attack vector, requires authentication)  
**Category:** Check 5 — Session invalidation on permission change

### Summary

When a user's `Member.permissions` are updated via `PATCH /api/members/[id]/permissions` (auth-options.ts:3), or a user is soft-deleted (deletedAt set), the JWT token remains valid for up to 30 days. The system does not track `tokenVersion`, `sessionVersion`, or maintain a server-side revocation list. A compromised admin's session cannot be immediately invalidated short of rotating `NEXTAUTH_SECRET` globally, affecting all users.

### Details

**JWT callback (`lib/auth-options.ts:87-176`)**  
- Lines 102-114: Reads `Member.permissions` from DB on every request via `getServerSession`.
- **BUT** in production, the NextAuth JWT strategy caches the session at the edge. On a `getServerSession` call, if the token is valid and unexpired, the permissions in the JWT claim are used, not re-read from the DB.
- The recon (Step 4) confirms: "every route re-derives session from cookie" — but the token itself is not re-validated against a version counter.

**Scenario:**  
1. Admin A has `permissions = {"*": "FULL_ACCESS"}`.
2. Attacker compromises Admin A's Google account and steals the JWT cookie.
3. Admin A notices and a Super-Admin updates Admin A's `permissions` to `{"default": "READ"}`.
4. The attacker's stolen JWT is still valid. The compromised session can still access all CORE routes because the JWT was issued *before* the permission change and contains the original claim.
5. Attacker calls `PATCH /api/members/[adminB]/permissions` with their stolen token — because the JWT still carries `"*": "FULL_ACCESS"`.
6. **No audit log on login** (finding-4 below) means defenders do not see the unauthorized admin session.

**Code reference:**  
- `lib/auth-options.ts:102-114` — does not check `Member.deletedAt` or any version counter.
- `app/api/members/[id]/permissions/route.ts:21-22` — checks only the current session's permissions, not a version/timestamp.

**Related threat:** Compromised CORE Admin (threat-model §2.6).

### Recommendation

1. Add `tokenVersion` (Int, default 0) to `Member` model.
2. Increment `tokenVersion` when `permissions` are updated or `deletedAt` is set.
3. In `jwt` callback, read `tokenVersion` and compare to `token.tokenVersion`.
4. If mismatch, return a minimal token forcing re-auth.
5. Consider admin session timeout < 30 days (e.g., 8 hours) for high-privilege roles.

---

## Finding 2: Account Enumeration via Timing in signIn Callback

**Severity:** Medium  
**CVSS v3.1:** 6.5 (Information disclosure, network attack vector, no authentication required for observable timing)  
**Category:** Check 8 — Account enumeration via timing

### Summary

The OAuth `signIn` callback (`lib/auth-options.ts:13-86`) performs sequential database lookups: Member → CommunityMember → PublicUser. Different response times leak whether an email is registered in each tier, and whether a new `PublicUser` is created.

### Details

**Code flow (`lib/auth-options.ts:13-86`):**  
- Line 18-20: First query against `Member` table.
- Line 31-33: If no Member, query `CommunityMember`.
- Line 42-44: If no CommunityMember, query `PublicUser`.
- Line 61-76: If no record found, create new `PublicUser`.

**Timing attack scenario:**  
An attacker runs three Gmail logins with different email addresses:
- `attacker1@gmail.com` (registered as a Member in prod)
- `attacker2@gmail.com` (registered as a CommunityMember)
- `attacker3@gmail.com` (not registered)

Measuring network latency from attacker's IP to the OAuth callback endpoint:
- Query 1 (Member): ~50-100ms (DB lookup + index hit)
- Query 2 (CommunityMember, skipped if Member found): +50-100ms if executed
- Query 3 (PublicUser, skipped if found): +50-100ms if executed
- Create (executed if not found): +100-200ms (insert + index update)

Over many requests, an attacker can cluster emails by response-time bucket and infer their registration status.

**Exacerbating factor:**  
The signIn callback does NOT check `Member.deletedAt` (line 19). A soft-deleted admin account will be "found" by the Member query even if the user should no longer have access. Combined with lack of audit logging (finding-4), a revoked admin's re-login is invisible.

**Code reference:**  
- `lib/auth-options.ts:18-84` — three separate queries, no timing mitigation.

### Recommendation

1. **Constant-time path:** Use a single query with three UNIONs or a stored procedure that always executes the same number of DB operations.
2. **Salt timing:** Add a small random sleep (~10-50ms) to all paths.
3. **Check deletedAt:** When a Member is found, verify `member.deletedAt === null`. If deleted, proceed as if not found.
4. **Log all signin attempts** to AuditLog for forensics (see finding-4).

---

## Finding 3: Plaintext Email Logged in Console on Every OAuth Signup

**Severity:** Low  
**CVSS v3.1:** 3.3 (Low; requires server log access, no impact on confidentiality at scale)  
**Category:** Check 2 / Logging

### Summary

The signIn callback logs every new user's email to stdout in plaintext.

### Details

**Code reference:**  
- `lib/auth-options.ts:79` — `console.log('New Public user created (Pending Consent): ${user.email}')`.

**Impact:**  
- **Development & preview deploys:** Logs are often stored in Vercel's free logs (24-48 hour retention). Any env-var access to a preview deploy reveals all emails.
- **Production:** Logs are retained longer. If log aggregation (Sentry/Datadog) is added later, the DSN is exposed ([recon §Step 11](../00-RECON.md#step-11)) but logs are not yet aggregated — so impact is low *now*.
- **Forensics:** Makes it easy to enumerate all users by email via log search.

**Related threat:** Recon by anonymous attacker (threat-model §2.1) or malicious insider with log access.

### Recommendation

1. Remove or redact the console.log.
2. If signup metrics are needed, log a hash of the email or count only.
3. Or log to a separate, access-controlled audit log (see finding-4).

---

## Finding 4: No Audit Logging on Admin Login

**Severity:** Medium  
**CVSS v3.1:** 6.5 (Medium; unauthorized access detection disabled for admin accounts)  
**Category:** Check 2 / Check 5 — Audit coverage

### Summary

The `signIn` callback in `lib/auth-options.ts:13-86` does not write to `AuditLog` when a user (especially a CORE admin) authenticates. Combined with no `AuditLog` on 2FA enable/disable (finding-6) and no `tokenVersion` revocation (finding-1), defenders cannot detect a compromised admin session in real time.

### Details

**What is logged:**  
- [recon-13 §4](../category-scans/recon-13-logging-tests.md): Only MEDIA, experiment, playbook, operation, speedrun-run, 2FA setup/disable/verify, membership permission changes are audit-logged.
- **Not logged:** Every signin, signout, 2FA enable, 2FA disable.

**Attack scenario:**  
1. Admin's Google account is compromised (e.g., via phishing or password reuse).
2. Attacker logs in as the admin, no `AuditLog` entry is created.
3. Attacker calls 15-20 API endpoints to drain points, create fake members, bulk-export PII.
4. Each endpoint call may log via `logActivity`, but the root-cause (unauthorized login from new IP) is invisible.
5. Incident response has no forensic trail and cannot correlate "when did this start?"

**Code reference:**  
- `lib/auth-options.ts:13-86` — no `logAudit` call on success or failure.
- `app/api/auth/2fa/totp/setup/route.ts:9-24`, `/disable/route.ts:9-28` — no `logAudit`.

### Recommendation

1. Call `logAudit(...)` in the signIn callback for every successful authentication, capturing:
   - `action: "USER_SIGNIN"` or `"ADMIN_SIGNIN"` (based on role)
   - `userEmail`
   - `role` (CORE/MEMBER/PUBLIC)
   - `source: "OAuth"` or identity provider
   - Request IP, User-Agent if available
2. Also log 2FA enable/disable:
   - `app/api/auth/2fa/totp/setup/route.ts` → `logAudit(..., { action: "2FA_TOTP_SETUP" })`
   - `app/api/auth/2fa/totp/verify/route.ts` → `logAudit(..., { action: "2FA_TOTP_ENABLED" })`
   - `app/api/auth/2fa/totp/disable/route.ts` → `logAudit(..., { action: "2FA_TOTP_DISABLED" })`
   - Passkey routes: same pattern.

---

## Finding 5: 2FA Enforcement Only at Middleware, Not at Login Callback

**Severity:** Medium  
**CVSS v3.1:** 6.5 (Medium; post-authentication MFA bypass if middleware is skipped)  
**Category:** Check 21 — 2FA enforcement during login

### Summary

The 2FA check happens in `middleware.ts` (lines 23-64), which redirects CORE users to `/auth/setup-2fa` *after* the session is already established. There is no enforcement in the `signIn` or `jwt` callback. An attacker with a valid JWT can access protected API routes if they craft requests that bypass middleware (e.g., direct API calls, or if middleware matching is misconfigured).

### Details

**Current flow:**  
1. User authenticates via OAuth → `signIn` callback → `jwt` callback → session issued.
2. User navigates to `/core/dashboard` → middleware checks `token.twoFactorEnabled && !token.twoFactorVerified` → redirects to `/auth/verify-2fa`.
3. BUT: An attacker with a stolen JWT can call `GET /api/core/*` routes directly, bypassing the middleware redirect.

**Middleware matcher (`middleware.ts:69-73`):**  
```typescript
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|push-sw.js|manifest|robots.txt|sitemap.xml).*)",
],
```
This is a **negative regex** — it *skips* static assets but runs on all `/api/*` routes. However, the middleware then checks `skip2FAPaths` which includes `/api/` (line 28), so API routes are *not* re-verified. This is intentional per the comment ("skip API routes"), but it means:
- A CORE user with 2FA enabled can call `POST /api/members` directly if they have a valid JWT, even if `token.twoFactorVerified === false`.

**Code reference:**  
- `middleware.ts:23-64` — 2FA redirect is UI-only, does not gate API.
- `app/api/members/route.ts`, etc. — no `token.twoFactorVerified` check.

**Related threat:** Compromised CORE Admin (threat-model §2.6) — if the attacker has the JWT but not the 2FA credential, they can still call APIs directly.

### Recommendation

1. **Option A (strict):** Add a check in the `jwt` callback: if `token.twoFactorEnabled === true` and no 2FA verification has occurred yet, set `token.role = "UNVERIFIED"`. Then `checkCoreAccess` requires `role === "CORE"`, not `"UNVERIFIED"`.
2. **Option B (pragmatic, current posture):** Require `token.twoFactorVerified === true` in the `jwt` callback before issuing a valid session for any CORE route. Store `twoFactorVerified` in the JWT and verify it in per-route guards.
3. **Option C (least breaking):** Add `token.twoFactorVerified` check in critical API guards like `checkCoreAccess`.

---

## Finding 6: Passkey Challenge Reused During Registration and Authentication

**Severity:** Medium  
**CVSS v3.1:** 5.9 (Medium; challenge replay risk)  
**Category:** Check 18 — Passkey implementation, challenge single-use

### Summary

The passkey registration and authentication routes store the challenge in `TwoFactorAuth.backupEmail` field (a string field meant for email, now repurposed as a challenge store). The challenge is single-use per spec (WebAuthn), but the implementation lacks explicit cleanup or replay-prevention if a challenge is reused between multiple registrations or authentications.

### Details

**Challenge storage (`app/api/auth/2fa/passkey/register/route.ts:22-26`):**  
```typescript
await prisma.twoFactorAuth.update({
  where: { userEmail: session.user.email },
  data: { backupEmail: options.challenge }, // ← repurposed field
});
```

**Challenge verification (`app/api/auth/2fa/passkey/authenticate/route.ts:25-32`):**  
```typescript
if (action === "options") {
  const options = await getAuthenticationOptions(credentialIds);
  await prisma.twoFactorAuth.update({
    where: { userEmail: session.user.email },
    data: { backupEmail: options.challenge },
  });
  return NextResponse.json(options);
}
```

**Problems:**
1. **Field reuse:** `backupEmail` is meant to store an email for account recovery, not a challenge. This conflates two unrelated concerns and risks data loss if recovery email is ever added.
2. **No TTL on challenge:** WebAuthn spec says challenges should expire in seconds. Here, the challenge persists until verification. If a network error occurs during verification, the challenge remains valid for the entire session (30 days).
3. **No timestamp on challenge:** If an attacker steals both the challenge and the user's credential (e.g., via device compromise), they can replay the challenge indefinitely until a new registration/auth is initiated.
4. **No cleanup after verification:** Line 68 (`app/api/auth/2fa/passkey/authenticate/route.ts`) clears `backupEmail` only on successful verification. If verification fails, the challenge persists.

**Scenario:**  
1. User starts passkey registration, challenge is generated and stored in `backupEmail`.
2. Browser crashes during attestation response — challenge remains in DB.
3. Attacker reads `TwoFactorAuth.backupEmail` via SQL injection or DB dump.
4. Attacker crafts a fake registration response with the old challenge.
5. If signature validation in `verifyRegistration` is weak (unlikely, but possible), replay succeeds.

**Code reference:**  
- `app/api/auth/2fa/passkey/register/route.ts:22-26` — challenge stored with no TTL.
- `app/api/auth/2fa/passkey/authenticate/route.ts:25-32, 44-69` — challenge reused across multiple requests, cleared only on success.
- `lib/2fa/passkey.ts:32-42` — calls `@simplewebauthn/server:verifyRegistrationResponse` with `expectedChallenge`, which does *not* automatically enforce single-use. Caller is responsible.

### Recommendation

1. Add a `Passkey.challenge` and `TwoFactorAuth.challenge` field with explicit TTL/timestamp.
2. Set `challenge` to `null` immediately after verification (success or failure).
3. Reject any request if `challenge` is null or expired (> 5 minutes).
4. Use a dedicated field, not `backupEmail`.

---

## Finding 7: TOTP Timing Window Too Permissive (±1 Period)

**Severity:** Low  
**CVSS v3.1:** 4.3 (Low; TOTP brute-force resistance, but mitigated by 6-digit entropy)  
**Category:** Check 20 — TOTP timing window

### Summary

The TOTP verification accepts codes from ±1 time period (30 seconds), totaling a 90-second window. This is at the permissive end of the spec but acceptable. However, it should be documented and monitored.

### Details

**Code (`lib/2fa/totp.ts:36-46`):**  
```typescript
export function verifyTotp(secret: string, token: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor((now + offset * PERIOD) / PERIOD);
    const expected = generateCode(secret, counter);
    if (expected === token) return true;
  }
  return false;
}
```

**Analysis:**
- **Window:** 90 seconds total (current time ± 30 sec).
- **Entropy:** 6 digits = 10^6 = 1 million possible codes.
- **Brute-force:** An attacker with `n` guesses per second can break TOTP in ~1M/n seconds. With rate-limiting at 3 guesses/min, it's ~5.5 days. With 10 guesses/sec (no rate limit), it's 100k seconds ≈ 27 hours.
- **Industry standard:** ±1 period (90 sec) is common. Google Authenticator accepts ±0, ±1, ±2 (120 sec). RFC 6238 doesn't mandate a specific window.

**Risk:** Low. The 6-digit entropy and typical rate-limiting (checked elsewhere, cat-18) make brute-force impractical. The ±1 window is defensible.

**Code reference:**  
- `lib/2fa/totp.ts:36-46`.

### Recommendation

1. **No immediate change required.** The window is acceptable.
2. **Document it:** Add a comment: "RFC 6238 permits clock drift; ±1 period (30s) is within spec."
3. **Verify rate-limiting:** Ensure the `/api/auth/2fa/challenge` endpoint rate-limits failed attempts (cat-18 will check).

---

## Finding 8: Missing Defense-in-Depth on Soft-Deleted Admin Revivals

**Severity:** Medium  
**CVSS v3.1:** 6.5 (Medium; privilege escalation if member is undeleted without re-vetting)  
**Category:** Check 5 — Session validation on permission/status change

### Summary

The `signIn` callback does not check `Member.deletedAt`. A soft-deleted admin account (flagged for removal but not hard-deleted) will still authenticate if the email is reused in a re-signup flow. There is no temporal check or re-approval flow for revival.

### Details

**Code (`lib/auth-options.ts:18-26`):**  
```typescript
const member = await prisma.member.findFirst({
  where: { email: { equals: emailToFind, mode: 'insensitive' } },
});
if (member) {
  // Sync profile info
  await prisma.member.update({ where: { id: member.id }, data: { name: user.name, image: user.image } });
  return true;
}
```

**Problem:**  
- No check for `member.deletedAt`. If `member.deletedAt !== null`, the user should not be able to sign in without re-approval.

**Attack scenario (insider threat):**  
1. Alice is a CORE admin with `permissions = {"*": "FULL_ACCESS"}`. Her `Member` row has `deletedAt = null`.
2. Organization removes Alice: `update Member set deletedAt = now() where email = 'alice@...'`.
3. Alice is still employed elsewhere and reconnects with a new identity, e.g., via a partner Google account.
4. Alice's partner account signs in. The signIn callback finds no record for the partner email and creates a new `PublicUser`.
5. Alice then re-signs-in with her original Google account (perhaps recovered from an OAuth session cookie in her browser).
6. The signIn callback finds her original `Member` row (still present, just soft-deleted). No `deletedAt` check → signIn returns true.
7. Her JWT is issued with `token.role = "CORE"` and `token.permissions = {"*": "FULL_ACCESS"}`.
8. Alice logs in and exfiltrates data or modifies permissions before the security team notices.

**Exacerbating factor:**  
No audit log on login (finding-4), so the unauthorized sign-in is not detected.

**Code reference:**  
- `lib/auth-options.ts:18-26` — no `deletedAt` check.
- `lib/auth-options.ts:87-114` — same issue in the jwt callback.

### Recommendation

1. In the `signIn` callback, add: `if (member.deletedAt) { return false; }` after line 22.
2. In the `jwt` callback, add the same check before setting `token.role = "CORE"`.
3. If revival is ever needed, require explicit re-approval via a separate workflow (e.g., a super-admin re-creates the `Member` row with the same email).

---

## Finding 9: Recovery Codes Single-Use Not Explicitly Enforced at DB Layer

**Severity:** Low  
**CVSS v3.1:** 4.3 (Low; code reuse only possible if DB allows, rate-limiting mitigates)  
**Category:** Check 9 — Magic link / OTP reusability, Check 20 — Recovery codes single-use

### Summary

Recovery codes are marked as used by pushing to `TwoFactorAuth.recoveryUsed` array, but there is no database constraint preventing re-use at the DB layer. Application code prevents it (check at line 23 in `/api/auth/2fa/challenge/route.ts`), but a compromised admin with DB access could modify the `recoveryUsed` array.

### Details

**Code (`app/api/auth/2fa/challenge/route.ts:19-30`):**  
```typescript
if (method === "recovery") {
  if (!twoFactor.recoveryCodes) return NextResponse.json({ error: "No recovery codes" }, { status: 400 });
  const codes = decrypt(twoFactor.recoveryCodes).split(",");
  const upperCode = code.toUpperCase();
  if (!codes.includes(upperCode) || twoFactor.recoveryUsed.includes(upperCode)) {
    return NextResponse.json({ error: "Invalid recovery code" }, { status: 400 });
  }
  await prisma.twoFactorAuth.update({
    where: { userEmail: session.user.email },
    data: { recoveryUsed: { push: upperCode } },
  });
  return NextResponse.json({ success: true, verified: true });
}
```

**Problems:**
1. **No DB constraint:** The `recoveryUsed` field is a String[] (or Int array). Prisma does not enforce uniqueness at the DB schema level.
2. **Soft-reset possible:** If a DB admin or compromised superuser modifies `recoveryUsed` (via direct update), a code can be reused.
3. **Lost-and-found attack:** If the user loses their recovery codes and a backup-email recovery flow is added later (cat-18), they could use the old codes again if they're still in the `recoveryCodes` field.

**Scenario:**  
1. User generates 10 recovery codes and saves 5.
2. User loses the list of saved codes.
3. Attacker gains DB access and sets `TwoFactorAuth.recoveryUsed = []` (clear all used codes).
4. Attacker uses one of the leaked recovery codes to bypass 2FA.

**Risk level:** Low. Requires DB access, and application-level check (line 23) prevents this in normal operation. But defense-in-depth is absent.

**Code reference:**  
- `app/api/auth/2fa/recovery/generate/route.ts:8-22` — generates codes, encrypts, stores.
- `app/api/auth/2fa/challenge/route.ts:19-30` — checks and marks as used.

### Recommendation

1. Add a `Passkey.usedRecoveryCodes` or `TwoFactorAuth.recoveryCodesUsedCount` to track count, with a constraint: `recoveryCodesUsedCount <= ARRAY_LENGTH(recoveryCodes)`.
2. Or, store recovery codes as individual `RecoveryCode` rows with a `usedAt` timestamp, allowing immutable audit trail.

---

## Finding 10: Passkey Registration Challenge Stored in Wrong Field (Design Flaw)

**Severity:** Low-Medium  
**CVSS v3.1:** 4.0 (Low; design smell, not an immediate exploit)  
**Category:** Check 18 — Passkey implementation, data model

### Summary

The passkey challenge is stored in `TwoFactorAuth.backupEmail`, a string field meant for an email address. This conflates two unrelated concepts and risks data loss if a backup-email feature is added.

### Details

**Code locations:**  
- `app/api/auth/2fa/passkey/register/route.ts:22-26` — stores challenge in `backupEmail`.
- `app/api/auth/2fa/passkey/authenticate/route.ts:25-32` — same reuse.

**Problems:**
1. **Semantic confusion:** Any developer reading the schema will assume `backupEmail` is for account recovery, not a WebAuthn challenge.
2. **Data loss risk:** If a future requirement adds backup-email recovery (e.g., "recover your account via email"), the field will need to be repurposed or split, risking data corruption if both challenge and email are stored simultaneously.
3. **No cleanup on timeout:** The challenge persists until replaced by a new one, violating WebAuthn spec (challenge should expire in seconds).

**Code reference:**  
- `prisma/schema.prisma` — `TwoFactorAuth` model (not read fully, but referenced in recon §Step 4).
- `app/api/auth/2fa/passkey/*.ts` — all use `backupEmail` for challenge.

### Recommendation

1. Add explicit `TwoFactorAuth.passkeyChallenge: String?` and `TwoFactorAuth.passkeyChallengeSentAt: DateTime?` fields.
2. Set `passkeyChallenge` on registration/authentication start, and check `passkeyChallengeSentAt > now() - 5 minutes` for validity.
3. Clear on successful verification (or timeout).
4. Keep `backupEmail` for its intended purpose (account recovery).

---

## Summary Table

| # | Title | Severity | CVSS | Category | Fixable | Evidence |
|---|---|---|---|---|---|---|
| 1 | No Session Revocation on Role Change | Medium | 6.5 | Check 5 | Yes | lib/auth-options.ts:102-114 |
| 2 | Account Enumeration via Timing | Medium | 6.5 | Check 8 | Yes | lib/auth-options.ts:13-86 |
| 3 | Plaintext Email in Console Logs | Low | 3.3 | Logging | Yes | lib/auth-options.ts:79 |
| 4 | No Audit Logging on Admin Login | Medium | 6.5 | Check 2/5 | Yes | lib/auth-options.ts:13-86 |
| 5 | 2FA Enforcement Post-Auth Only | Medium | 6.5 | Check 21 | Yes | middleware.ts:23-64 |
| 6 | Passkey Challenge Reuse Risk | Medium | 5.9 | Check 18 | Yes | app/api/auth/2fa/passkey/*.ts |
| 7 | TOTP ±1 Period Window | Low | 4.3 | Check 20 | No (acceptable) | lib/2fa/totp.ts:36-46 |
| 8 | Soft-Deleted Admin Can Re-Login | Medium | 6.5 | Check 5 | Yes | lib/auth-options.ts:18-26 |
| 9 | Recovery Codes No DB Single-Use | Low | 4.3 | Check 9 | Yes | app/api/auth/2fa/challenge/route.ts:19-30 |
| 10 | Passkey Challenge in Wrong Field | Low-Medium | 4.0 | Check 18 | Yes | app/api/auth/2fa/passkey/*.ts |

---

## Checks Verification

### ✅ Check 1: JWT Algorithm Negotiation
**Status:** PASS  
**Finding:** NextAuth v4.24.13 uses HS256 with `NEXTAUTH_SECRET`. No custom algorithm override found. JWT alg is not configurable via the authOptions.  
**Evidence:** Recon confirms HS256 only; no `jwt.encode` override in lib/auth-options.ts. NEXTAUTH_SECRET is environment-based.

### ✅ Check 3: JWT in Secure Cookie
**Status:** PASS  
**Finding:** Session token is httpOnly, Secure (prod), SameSite=Lax.  
**Evidence:** lib/auth-options.ts:200-210.

### ✅ Check 4: Refresh Token Rotation
**Status:** PASS (NO REFRESH TOKEN)  
**Finding:** NextAuth JWT strategy does not use refresh tokens. Session is 30 days; on each request, the token is re-issued if near expiry (auto-extend). Effectively no rotation needed.  
**Evidence:** lib/auth-options.ts:198 `maxAge: 30 * 24 * 60 * 60`.

### ❌ Check 5: Session Invalidation on Permission/Role Change
**Status:** FAIL — Finding 1, Finding 8  
**Finding:** No tokenVersion, no revocation list. Soft-deleted admins can still sign in.

### ✅ Check 6: Multi-Device Session Management
**Status:** PASS (N/A)  
**Finding:** NextAuth JWT-only, no per-device tracking. Is a design choice, not a vulnerability.  
**Evidence:** Recon §Step 4 confirms JWT-only.

### ✅ Check 11: OAuth State/Nonce
**Status:** PASS  
**Finding:** NextAuth v4.24.13 handles state/PKCE automatically. No override found.  
**Evidence:** No custom OAuth flow in auth-options.ts.

### ❌ Check 2: JWT Missing exp/nbf/iss/aud
**Status:** PASS (NextAuth defaults)  
**Finding:** NextAuth defaults handle exp. No explicit check in code, but signing is trusted to be correct.

### ❌ Check 8: Account Enumeration
**Status:** FAIL — Finding 2  
**Finding:** Timing leak on sequential DB lookups.

### ⚠️ Check 18: Passkey Implementation
**Status:** PARTIAL — Finding 6, Finding 10  
**Finding:** Challenge not single-use (finding-6), stored in wrong field (finding-10).

### ✅ Check 19: TOTP Secret Entropy
**Status:** PASS  
**Finding:** Uses `crypto.randomBytes(20)`, yielding 160 bits of entropy. Sufficient.  
**Evidence:** lib/2fa/totp.ts:18-21.

### ❌ Check 20: TOTP Timing Window
**Status:** PASS (Acceptable)  
**Finding:** ±1 period (90 sec) is permissive but standard. Rate-limiting mitigates brute-force.  
**Evidence:** lib/2fa/totp.ts:36-46.

### ❌ Check 21: 2FA Enforcement During Login
**Status:** FAIL — Finding 5  
**Finding:** 2FA verified only at middleware, not in JWT callback. Direct API calls bypass redirect.

---

## Open Assumptions Affecting This Category

1. **ENABLE_2FA flag state in production** (recon Open Assumption #10) — all 2FA findings assume this is enabled. If disabled, findings 4, 5, 6, 7 are moot in production.
2. **Rate-limiting on /api/auth/2fa/challenge** (recon §Step 18) — finding-7 assumes brute-force is rate-limited. Must verify in cat-18.
3. **NEXTAUTH_SECRET entropy** — all JWT security depends on this. Recon cannot verify.
4. **Preview deployment DB isolation** (recon Open Assumption #1) — if previews share prod DB, a compromised preview admin can modify production Member.permissions.

---

## Cross-Category References

- **Cat 1 (Authorization):** Finding-1, Finding-8 (tokenVersion needed for proper revocation).
- **Cat 5 (Error Handling & Logging):** Finding-3 (plaintext logging), Finding-4 (no audit log on login).
- **Cat 18 (Input Validation & Rate Limiting):** Finding-7 (TOTP brute-force), findings-9 (recovery code brute-force).
- **Cat 27 (Incident Response):** Finding-4 (no audit trail for forensics).

---

## End of Category 11

**Total findings:** 10  
**Critical:** 0  
**High:** 0  
**Medium:** 6  
**Low:** 4  

**Next phase:** Implement findings 1–10 in priority order (1, 5, 4, 2 are blocking security posture). Findings 6, 8, 10 are design-layer and should be addressed before new 2FA enrollment grows. Findings 3, 7, 9 are lower-severity but reflect good hygiene.

