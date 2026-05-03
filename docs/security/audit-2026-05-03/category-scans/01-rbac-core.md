# Category 1 — RBAC Core: Role Definition, Assignment & Storage

**Audit date:** 2026-05-03  
**Scope:** All checks against [lib/auth-options.ts](lib/auth-options.ts), [lib/permissions.ts](lib/permissions.ts), [prisma/schema.prisma](prisma/schema.prisma), and member/permission endpoints under [app/api/members/](app/api/members/).

---

## Check 1: Role stored in JWT and re-verified at every privileged op

**Verdict:** Finding — Suspicious

**Details:**  
Role (`CORE`, `MEMBER`, `PUBLIC`) is stored in the JWT token at issuance ([lib/auth-options.ts:110,126,141](lib/auth-options.ts#L110-L141)). However, the JWT callback only runs on initial signin and on explicit `trigger === "update"` events; it does NOT re-verify the role against the database on every privileged operation.

Per [lib/auth-options.ts:97-153](lib/auth-options.ts#L97-L153), the `jwt` callback populates `token.role` **only if `user` is present** (which is true only on signin). Thereafter, the token is handed back unchanged per line 175. This means a user's role is cached in the JWT for up to 30 days without database re-validation.

Routes use `getServerSession(authOptions)` which decodes the JWT and projects its claims onto `session.user.role` ([lib/auth-options.ts:177-190](lib/auth-options.ts#L177-L190)). The role is read from the JWT token, not re-fetched from the database.

**Status:** **Suspected** — would confirm by inspecting whether a role downgrade (e.g., demoting CORE → PUBLIC) leaves a valid JWT token allowing access until expiry. No test suite exists to validate this; runtime observation needed.

---

## Check 2: Role mutable via mass assignment

**Verdict:** Finding — Not vulnerable

**Details:**  
The codebase **explicitly prevents mass assignment** of roles via Zod schemas on all member endpoints:

- [app/api/members/route.ts:11-20](app/api/members/route.ts#L11-L20): `CreateMemberSchema` and `UpdateMemberSchema` do NOT include a `role` field; only `permissions`, `tags`, and status are allowed.
- [app/api/members/[id]/permissions/route.ts:9](app/api/members/[id]/permissions/route.ts#L9): `PermissionsSchema` validates the `permissions` JSON object with strict enum values.
- No route accepts a `role` field in the request body.

Role assignment is **indirect**: a user's role is determined by which table they came from (`Member` → CORE, `CommunityMember` → MEMBER, `PublicUser` → PUBLIC), not by a mutable `role` column. Creating a `Member` row implicitly assigns CORE role; this is guarded by superadmin (`FULL_ACCESS`) checks, not a spreadable field.

**Status:** **N/A** — role is not directly mutable; it's derived from table-of-origin.

---

## Check 3: Role assignment endpoint missing role check

**Verdict:** Finding — High severity

**Location:** [app/api/members/[id]/permissions/route.ts:19-26](app/api/members/[id]/permissions/route.ts#L19-L26)

**Vulnerable code:**
```ts
// Check if user has FULL_ACCESS
const userPermissions = (session.user as any).permissions || {};
const hasFullAccess = userPermissions['*'] === 'FULL_ACCESS' || userPermissions['default'] === 'FULL_ACCESS';

if (!hasFullAccess) {
     return new NextResponse("Unauthorized. Requires FULL_ACCESS.", { status: 403 });
}
```

**Description:**  
The permissions endpoint checks the **cached JWT claim** `session.user.permissions`, not a re-validated database lookup. If a superadmin's permissions are revoked (e.g., `permissions` JSON is updated to remove `"*": "FULL_ACCESS"`), the old JWT still contains `"*": "FULL_ACCESS"` and the revocation is not enforced for up to 30 days. An attacker with a compromised admin token can modify permissions for any member until the token naturally expires.

**Attack scenario:**  
1. Admin Alice logs in, receiving a JWT with `token.permissions = { "*": "FULL_ACCESS" }`.
2. Alice's permissions are revoked by another admin: `Member.permissions` is updated to `{ "default": "READ" }`.
3. Alice's session is NOT invalidated; her JWT is still valid.
4. Alice can still call `PUT /api/members/[id]/permissions` and escalate Bob's permissions to CORE-level admin.
5. Access continues until the 30-day JWT expiry.

**Business impact:**  
- Compromised or revoked admin accounts can persist in elevated-permission state for 30 days, allowing unauthorized member escalations, permission changes, and audit trail manipulation.
- No alerting on permission revocation if the admin's session is not proactively cleared.

**Remediation:**  
- Add a `tokenVersion` counter to the `Member` table; increment it on every permission update.
- In the `jwt` callback, re-fetch `member.tokenVersion` from the database and compare against `token.tokenVersion`; if mismatch, silently degrade the token to the new permissions.
- Alternatively, use server-side session revocation list (e.g., Redis cache of invalidated JWTs) checked on every privileged operation.
- Send logout-all directive to client on permission change.

**Detection:**  
- Log permission revocation attempts + subsequent API calls from the same session.
- Alert if a member with `permissions.*.FULL_ACCESS` revoked, then that member makes a privileged API call within 30 days.
- Monitor `Log.action = "UPDATE" AND entity = "Member" AND field = "permissions"` followed by API calls in the same JWT session.

---

## Check 4: Role compared with case sensitivity / whitespace / unicode-confusable bug

**Verdict:** N/A

**Details:**  
Role values are hardcoded constants (`CORE`, `MEMBER`, `PUBLIC`) assigned in the `jwt` callback at lines 110, 126, 141 and never parsed from user input. String comparisons use exact match:
- [lib/permissions.ts:47](lib/permissions.ts#L47): `session.user.role !== 'CORE'`
- [lib/permissions.ts:70](lib/permissions.ts#L70): `session.user.role !== 'CORE'`
- Across app/api: `session.user.role !== 'CORE'`, etc.

No `.trim()`, `.toLowerCase()`, or `.toUpperCase()` is applied to role values in the comparison logic. Role strings come from the JWT token, not user input.

**Status:** **N/A** — roles are compile-time constants, not parsed from untrusted input.

---

## Check 5: Integer-hierarchy `<` vs `<=` bug

**Verdict:** N/A

**Details:**  
The role system uses a **string-set model**, not an integer hierarchy. Three distinct roles (CORE, MEMBER, PUBLIC) are identified by table-of-origin, and permission levels (READ, WRITE, FULL_ACCESS) are compared via `hasPermission()` at [lib/permissions.ts:10-40](lib/permissions.ts#L10-L40), which uses explicit string equality checks:
```ts
if (userLevel === 'FULL_ACCESS') return true;
if (requiredLevel === 'READ') { return userLevel === 'READ' || ... }
```

No numeric comparison (`<`, `<=`) is used.

**Status:** **N/A** — hierarchy is string-set; no numeric comparison operator risk.

---

## Check 6: Free-text role allowing trailing space / unicode-confusable

**Verdict:** N/A

**Details:**  
Role values are assigned as literals in the `jwt` callback ([lib/auth-options.ts:110,126,141](lib/auth-options.ts)) and are never parsed from free-text input. Email (which is used as the lookup key) is trimmed at lines 17, 99:
```ts
const emailToFind = user.email ? user.email.trim() : "";
```

Permission values in the `PermissionsSchema` are validated against a strict enum at [app/api/members/[id]/permissions/route.ts:9](app/api/members/[id]/permissions/route.ts#L9):
```ts
const PermissionsSchema = z.record(z.string(), z.enum(["READ", "WRITE", "FULL_ACCESS", "DENY"]));
```

No user-supplied role string is accepted.

**Status:** **N/A** — roles are not user-configurable free-text.

---

## Check 7: Default signup role is lowest tier (PUBLIC)

**Verdict:** Confirmed

**Details:**  
Per [lib/auth-options.ts:58-76](lib/auth-options.ts#L58-L76), the `signIn` callback creates a new `PublicUser` if the email is not found in `Member` or `CommunityMember`:
```ts
await prisma.publicUser.create({
    data: {
        email: emailToFind,
        roles: [],
        ...
    }
});
```

The `jwt` callback assigns `token.role = 'PUBLIC'` at line 141 for any user coming from the `PublicUser` table. PUBLIC is the lowest tier — it has no `permissions` JSON and cannot access admin features.

**Status:** **Confirmed** — default signup role is PUBLIC, the least privileged tier.

---

## Check 8: Role downgrade not invalidating old JWTs

**Verdict:** Finding — Critical

**Location:** [lib/auth-options.ts:87-176](lib/auth-options.ts#L87-L176) (JWT callback); [lib/auth-options.ts:198](lib/auth-options.ts#L198) (30-day maxAge)

**Vulnerable code:**
```ts
async jwt({ token, user, trigger, session }) {
  // ... role assignment ...
  return token;
}

session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

**Description:**  
When a user's role is downgraded (e.g., CORE → MEMBER by deleting their `Member` row or moving them to `CommunityMember`), their existing JWT token remains valid for up to 30 days. The `jwt` callback is **only called on signin, not on every request**. There is **no token revocation list, no tokenVersion counter, and no rotation check**.

If a user logs in today and is downgraded tomorrow, they retain admin access (via the cached JWT) until day 30. The recon notes explicitly (Step 5): *"No refresh-token rotation (NextAuth JWT renews via session callback when accessed). Logout clears cookie only — **no server-side JWT revocation list**, no `tokenVersion` counter."*

**Attack scenario:**  
1. Alice is a CORE admin with a valid JWT good until 2026-06-02.
2. On 2026-05-04, an incident occurs and Alice is demoted by deleting her `Member` row.
3. Alice's JWT is not invalidated; `token.role` still reads 'CORE'.
4. Alice can call any CORE-level API until 2026-06-02 (28 days later).
5. She escalates Bob to admin, modifies project data, etc., all undetected because she still has a valid token.

**Business impact:**  
- Fired / revoked admins retain elevated access for 30 days unless browser session is manually cleared.
- No audit trail of the privilege revocation is tied to session invalidation.
- Incident response cannot instantly remove admin access; 30-day grace period is a severe liability.

**Remediation:**  
1. Add `tokenVersion` (Int) to `Member` model, increment on every permission/status change.
2. Store `tokenVersion` in JWT at issuance.
3. On every privileged API call, compare JWT `tokenVersion` against database; reject if mismatch.
4. Alternatively: use sliding-window session tokens with shorter maxAge (e.g., 1-7 days) + active refresh.
5. Implement a server-side revocation list (Redis/Memcached) indexed by JWT `jti` claim, checked on every auth-gated route.
6. Send a `logout-all` directive to the client on any role change, forcing a re-auth.

**Detection:**  
- Monitor `Member` table DELETEs or status/permission UPDATEs; cross-reference against subsequent API calls by that user's email in logs.
- Alert on any API call by a user whose `Member` row has `deletedAt` set within the last 30 days.
- Monitor AuditLog for permission downgrades, then look for subsequent activity from that user's `token.id`.

---

## Check 9: Role escalation audit trail forgeable / prunable

**Verdict:** Finding — Medium

**Location:** [lib/audit.ts:34-64](lib/audit.ts#L34-L64); [prisma/schema.prisma:277-296](prisma/schema.prisma#L277-L296)

**Vulnerable code:**
```ts
export async function logAudit(params: AuditLogParams) {
    try {
        await prisma.auditLog.create({
            data: {
                action: params.action,
                resource: params.resource,
                resourceId: params.resourceId,
                actorId: params.actorId || null,
                metadata: params.metadata || {},
            }
        });
    } catch (error) { /* fail silent */ }
}

model AuditLog {
  id         String    @id @default(uuid())
  ...
  deletedAt  DateTime?  // <-- soft-delete possible
  ...
}
```

**Description:**  
The `AuditLog` table has a `deletedAt` column ([prisma/schema.prisma:284](prisma/schema.prisma#L284)), enabling soft deletes. There is **no database-level constraint** (e.g., `@@deny` rule, PostgreSQL trigger, or CDC append-only log) preventing audit log deletion. If an attacker gains database-write access or a future developer adds a `prisma.auditLog.update({ data: { deletedAt: now() } })` endpoint, audit trails can be erased retroactively.

Additionally, permission changes are logged via `logActivity()` ([app/api/members/[id]/permissions/route.ts:49-55](app/api/members/[id]/permissions/route.ts#L49-L55)), which writes to the `Log` table, not `AuditLog`. The two tables are separate, and there is **no integration** between them for permission-change events. If a malicious admin changes permissions and then deletes the corresponding `Log` entry, the change is unaudited.

**Attack scenario:**  
1. Attacker gains a database connection (e.g., via SQL injection, compromised deploy key).
2. They fetch AuditLog entries for their malicious action: `SELECT * FROM "AuditLog" WHERE action = 'UPDATE' AND resource = 'MEMBER' AND createdAt > X`.
3. They soft-delete those rows: `UPDATE "AuditLog" SET deletedAt = NOW() WHERE id = ...`.
4. The audit trail is erased; no forensic record of the privilege escalation exists.

**Business impact:**  
- Malicious privilege escalations are undetectable post-hoc.
- Regulatory / compliance audits (SOC2, ISO27001) require immutable audit logs; soft deletes fail that requirement.
- Insider threat / privilege escalation cannot be reconstructed.

**Remediation:**  
1. Remove `deletedAt` from `AuditLog` schema; replace with a marker field if soft-delete is needed (e.g., `isActive: Boolean @default(true)`, no mutations after creation).
2. Implement PostgreSQL append-only table: `CREATE TABLE AuditLog (...) WITH (fillfactor=10);` to prevent HOT updates.
3. Use PostgreSQL trigger to prevent UPDATE/DELETE on `AuditLog`: 
   ```sql
   CREATE TRIGGER audit_log_immutable BEFORE UPDATE OR DELETE ON "AuditLog" 
   FOR EACH ROW EXECUTE FUNCTION raise_immutable_error();
   ```
4. Add a second audit sink (external log service: Axiom, DataDog, Splunk) that receives audit events asynchronously and stores immutably.
5. Unify permission-change audit logging: use `logAudit()` with `resource = 'MEMBER_PERMISSIONS'` instead of `logActivity()`.

**Detection:**  
- Baseline: generate a daily hash of the AuditLog table (all rows not soft-deleted) and store it in an external log service.
- Alert if the hash changes (e.g., if an UPDATE/DELETE query ran against AuditLog).
- Monitor Postgres logs for any UPDATE/DELETE on the `AuditLog` table.

---

## Check 10: Denylist-style check (`!== 'super_admin'`)

**Verdict:** N/A

**Details:**  
The codebase uses explicit **allowlist checks**, not denylist checks:
- [lib/permissions.ts:47](lib/permissions.ts#L47): `if (session.user.role !== 'CORE')` — enforces that the user IS CORE.
- [app/api/members/route.ts:61](app/api/members/route.ts#L61): `const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';` — checks for explicit FULL_ACCESS.
- Permission checks use: `userLevel === 'FULL_ACCESS'` (allowlist), not `userLevel !== 'DENY'` (denylist).

One instance of explicit DENY check: [lib/permissions.ts:20](lib/permissions.ts#L20): `if (userLevel === 'DENY' || userLevel === 'deny')` — this is allowlist for denial, not a denylist default.

**Status:** **N/A** — authorization uses allowlist model throughout.

---

## Check 11: Multiple-role array bypass

**Verdict:** N/A

**Details:**  
Each user has **exactly one role** (CORE, MEMBER, or PUBLIC) determined by which table they came from. There is no `roles: string[]` array on `Member`, `CommunityMember`, or `PublicUser`. The `roles` field on `PublicUser.roles` and `MemberExtraProfile.roles` are **profile metadata** (interests/skills), not authorization roles.

In the JWT, `token.role` is a single string, not an array. The `session` callback copies it as a scalar ([lib/auth-options.ts:181](lib/auth-options.ts#L181)).

**Status:** **N/A** — role model is single-role, not array-based.

---

## Check 12: Stale role cached past rotation (JWT age vs role changes)

**Verdict:** Finding — Critical (covered in Check 8)

**Details:**  
See Check 8. JWT maxAge is 30 days; role is cached at issuance and never re-validated. This is a critical finding.

**Status:** **Confirmed** — duplicate of Check 8 (role downgrade grace period).

---

## Check 13: Role bound to user_id only, not session

**Verdict:** Finding — Medium

**Details:**  
The JWT stores `token.id` (member/user ID) and `token.role`. The role is **indexed only by user_id**, not by session ID or request ID. 

If a user logs in from two devices (or two sessions concurrently), both sessions share the same cached role. A role downgrade on one device does not invalidate the role on the other device until JWT expiry.

Additionally, there is **no session table** in the Prisma schema (JWT-only strategy per [lib/auth-options.ts:197](lib/auth-options.ts#L197)). This means there is **no way to selectively revoke a single session** without revoking the entire user's role. The only option is full logout (cookie deletion), which affects all open sessions.

**Attack scenario:**  
1. Alice logs in from her laptop (Session A) and phone (Session B), each receiving a JWT with `token.role = 'CORE'`.
2. On the laptop, she is demoted: `Member.permissions` → `{ "default": "READ" }`.
3. On the phone, she still has `token.role = 'CORE'` and can call privileged APIs for 30 days.
4. The downgrade only took effect on new logins (Session C+), not existing sessions.

**Business impact:**  
- Multi-device access creates a window where role downgrades apply unevenly.
- A user with CORE access on a shared device can perform privileged actions even after revocation is attempted.

**Remediation:**  
1. Store session metadata (session ID, device fingerprint, created_at) in the JWT `sid` claim.
2. Implement a session table: `Session { id, userId, createdAt, expiresAt }`.
3. On every privileged operation, look up the session and verify it's still active and matches the JWT `sid`.
4. On role downgrade, mark all sessions for that user as invalidated: `UPDATE Session SET isInvalidated = TRUE WHERE userId = X`.

**Detection:**  
- Log session creation and termination.
- Alert if a user has more than one active session with different permissions claims.

---

## Check 14: Soft-deleted users still validating

**Verdict:** Finding — Medium

**Location:** [lib/auth-options.ts:13-86](lib/auth-options.ts#L13-L86) (signIn callback); [prisma/schema.prisma:23,61](prisma/schema.prisma#L23-L61) (Member.deletedAt, CommunityMember.deletedAt)

**Vulnerable code:**
```ts
async signIn({ user }) {
  const member = await prisma.member.findFirst({
    where: { email: { equals: emailToFind, mode: 'insensitive' } },
  });
  if (member) {
    await prisma.member.update({ where: { id: member.id }, data: { name: user.name, image: user.image } });
    return true;
  }
  // ... similarly for CommunityMember, PublicUser ...
}
```

**Description:**  
The `signIn` callback queries `Member.findFirst()` without filtering on `deletedAt IS NULL`. A soft-deleted member can still log in and receive a JWT with `token.role = 'CORE'`. The queries do not enforce the constraint:
```ts
where: { email: ..., deletedAt: null }
```

The same issue applies to `CommunityMember` and `PublicUser` lookups.

**Attack scenario:**  
1. Alice is a CORE admin with a `Member` row.
2. Alice is offboarded; her `Member.deletedAt = NOW()`.
3. Alice tries to log in via Google OAuth.
4. The `signIn` callback finds her (soft-deleted) `Member` row because `deletedAt` is not checked.
5. Alice receives a JWT with `token.role = 'CORE'` and regains admin access.

**Business impact:**  
- Offboarded or fired employees can re-login indefinitely and regain their old access level.
- Offboarding workflow is broken; soft-delete is cosmetic.

**Remediation:**  
1. Update `signIn` callback to filter: `where: { email: ..., deletedAt: null }`.
2. Similarly in the `jwt` callback at lines 102, 119, 134.
3. Consider: is soft-delete the right model for user revocation? Hard-delete or a separate `status` field (e.g., `status: 'active' | 'archived'`) may be clearer.
4. Add a pre-signin check: if `Member.deletedAt` is set, return false / redirect to an "access denied" page.

**Detection:**  
- Monitor `Member.findFirst()` / `CommunityMember.findFirst()` calls without explicit `deletedAt` filters.
- Alert if a login event's email matches a `Member` row with `deletedAt` set within the last 90 days.

---

## Check 15: Service accounts / API keys with implicit elevated roles

**Verdict:** Finding — High

**Location:** [app/api/cron/expire-points/route.ts:7-12](app/api/cron/expire-points/route.ts#L7-L12); [vercel.json:2-31](vercel.json#L2-L31)

**Vulnerable code:**
```ts
const authHeader = request.headers.get("authorization");
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Description:**  
The `CRON_SECRET` is a single bearer token used to authenticate **7 cron jobs** (per recon Step 3 and [vercel.json](vercel.json)). All cron endpoints check the same header: `Authorization: Bearer ${CRON_SECRET}`. There is **no rate limiting, no HMAC, no IP allowlist** per the recon (Step 3).

The `CRON_SECRET` grants implicit elevated access to:
- [app/api/cron/expire-points/route.ts](app/api/cron/expire-points/route.ts) — modifies `WalletTransaction`, `PointsBatch` (user economy).
- [app/api/cron/sync-events/route.ts](app/api/cron/sync-events/route.ts) — polls Luma API and syncs events.
- [app/api/cron/cleanup/route.ts](app/api/cron/cleanup/route.ts) — deletes old data.
- [app/api/cron/speedrun-status/route.ts](app/api/cron/speedrun-status/route.ts) — modifies speedrun state.
- And 3 more.

If the `CRON_SECRET` is leaked (e.g., in a git commit, env var exposure, or Vercel logs), an attacker can:
1. Repeatedly call `/api/cron/expire-points` to force expiry of all users' points.
2. Call `/api/cron/speedrun-status` to corrupt speedrun data.
3. Call any cron endpoint to trigger cascading side effects.

**Attack scenario:**  
1. A developer commits `CRON_SECRET=xyz123` to a public repo or exposes it in Vercel logs.
2. Attacker discovers the secret via GitHub code search or Vercel audit logs.
3. Attacker calls `POST /api/cron/expire-points?authorization: Bearer xyz123` repeatedly.
4. All users' points expire; the economy collapses.
5. Attacker is not rate-limited and leaves no token-level audit trail (no user ID in the request).

**Business impact:**  
- Unauthorized modification of critical system state (points, events, speedrun status).
- No audit trail of who triggered the cron job (bearer token is device-agnostic).
- Single-secret model means one leak affects ALL cron jobs; no role granularity.

**Remediation:**  
1. Use individual secrets per cron job (e.g., `CRON_SECRET_EXPIRE_POINTS`, `CRON_SECRET_SYNC_EVENTS`).
2. Add request signature verification (HMAC-SHA256 of body + timestamp) instead of bearer token alone.
3. Add IP allowlist: whitelist Vercel's cron IP ranges or use Vercel's native cron trigger mechanism (which Vercel internally authenticates).
4. Add rate limiting to cron endpoints (e.g., 1 call per 24h).
5. Log all cron invocations with timestamp, parameters, and result to AuditLog.
6. Rotate `CRON_SECRET` monthly; implement secret versioning.

**Detection:**  
- Monitor `/api/cron/*` endpoints for unexpected call frequency (alerts on >2 calls in 1h per endpoint).
- Log every cron call to stdout/AuditLog with full parameters.
- Alert if cron calls originate from non-Vercel IP ranges.

---

## Check 16: Impersonation feature

**Verdict:** N/A

**Details:**  
A grep for `"impersonate"`, `"act_as"`, `"su"`, `"sudo"` across [app/api](app/api) returns no matches. There is no impersonation endpoint.

**Status:** **N/A** — impersonation feature does not exist.

---

## Check 17: Role-changing actions without 4-eyes approval

**Verdict:** N/A

**Details:**  
[app/api/members/[id]/permissions/route.ts](app/api/members/[id]/permissions/route.ts) requires only a single superadmin (`"*": "FULL_ACCESS"`) to update another member's permissions. There is no second-approver requirement, no approval workflow, or time-delay check.

However, this is a typical pattern for admin-only operations and is not considered a RBAC core vulnerability (it's an access control policy choice). The endpoint **does** enforce that only FULL_ACCESS users can call it, which is correct.

**Status:** **N/A** — single-approver for permission changes is a policy choice, not a RBAC flaw. Recommend adding a second approver workflow in Category 6 (Access Control Weaknesses).

---

## Check 18: Role storage centralization

**Verdict:** Confirmed

**Details:**  
The source of truth for role is **always the table-of-origin**:
- `Member` row → CORE role.
- `CommunityMember` row → MEMBER role.
- `PublicUser` row → PUBLIC role.

The role is **not stored as a mutable field**; it's derived at JWT issuance from which table the user is found in. This is the **correct, centralized design**.

The JWT caches the role for performance, but the cache is a projection, not a separate source of truth.

**Status:** **Confirmed** — role storage is centralized and correct.

---

## Check 19: Role-bearing claims propagated to downstream services correctly

**Verdict:** N/A

**Details:**  
Per recon Step 10, there are **no internal microservices**. The application is a single Next.js monolith with external API calls (Google OAuth, Luma, SMTP, Cloudinary, Vercel Blob, Web Push). There are no downstream services that consume role claims.

**Status:** **N/A** — no internal microservices; not applicable.

---

## Summary Table

| Check | Verdict | Severity | CWE | OWASP |
|---|---|---|---|---|
| 1. JWT re-verification | Suspected | — | — | — |
| 2. Role mass assignment | N/A | — | — | — |
| 3. Permission endpoint auth | **Finding** | High | CWE-639 | A1:2021-Broken Access Control |
| 4. Case sensitivity | N/A | — | — | — |
| 5. Integer hierarchy | N/A | — | — | — |
| 6. Free-text role | N/A | — | — | — |
| 7. Default signup role | Confirmed | — | — | — |
| 8. Role downgrade JWT | **Finding** | Critical | CWE-613 | A7:2021-Identification & Auth Failures |
| 9. Audit trail prunability | **Finding** | Medium | CWE-434 | A1:2021-Broken Access Control |
| 10. Denylist check | N/A | — | — | — |
| 11. Multi-role array | N/A | — | — | — |
| 12. Stale role cache | **Duplicate of 8** | Critical | CWE-613 | A7:2021-Identification & Auth Failures |
| 13. Session binding | **Finding** | Medium | CWE-613 | A7:2021-Identification & Auth Failures |
| 14. Soft-deleted users | **Finding** | Medium | CWE-613 | A7:2021-Identification & Auth Failures |
| 15. CRON_SECRET service account | **Finding** | High | CWE-276 | A1:2021-Broken Access Control |
| 16. Impersonation | N/A | — | — | — |
| 17. 4-eyes approval | N/A | — | — | — |
| 18. Centralized storage | Confirmed | — | — | — |
| 19. Downstream propagation | N/A | — | — | — |

---

## Critical Findings (3)

1. **Check 8 / 12: Role downgrade not invalidating old JWTs** — 30-day grace period for revoked admins.
2. **Check 3: Permission endpoint cached JWT validation** — admin revocation not enforced for 30 days.
3. **Check 15: CRON_SECRET single-secret model** — one leaked token breaks all cron operations.

## High Findings (2)

1. **Check 3: Permission endpoint** — should re-validate database permissions on every call.
2. **Check 15: CRON_SECRET** — need per-job secrets and signature verification.

## Medium Findings (3)

1. **Check 9: Audit log soft-delete** — AuditLog.deletedAt allows retroactive erasure.
2. **Check 13: Session binding** — role is user-level, not session-level; multi-device downgrade inconsistency.
3. **Check 14: Soft-deleted users** — signIn does not check deletedAt; offboarded users can re-login.

---

## Remediation Priority

1. **Immediate (Week 1):**
   - Remove `deletedAt` from `AuditLog` or add PostgreSQL append-only trigger.
   - Add `deletedAt` filter to all `signIn` and `jwt` callbacks.
   - Implement `tokenVersion` counter on `Member`; verify on every privileged API call.

2. **High (Week 2-3):**
   - Implement per-cron-job secrets; add HMAC signature verification.
   - Re-fetch member permissions from DB (not JWT) on every permission-update call.
   - Add session table and session-level revocation on role change.

3. **Medium (Month 2):**
   - Implement external append-only audit log sink (Axiom/Splunk).
   - Rotate secrets monthly; implement secret versioning.
   - Add monitoring/alerting for detected patterns (Check 8, 13, 14, 15).

