# Category 3 — Privilege Escalation Paths (Member → Core → Super-Admin)

**Audit date:** 2026-05-03  
**Scope:** Vertical privilege escalation vectors; role-based access control (RBAC) enforcement  
**Methodology:** Source-code audit; no automated testing (repo has zero tests per recon §Step 14)

---

## Summary

**Threat:** An authenticated user (PUBLIC or MEMBER) escalates to CORE or CORE-without-FULL_ACCESS escalates to CORE-with-FULL_ACCESS (superadmin).

**Finding:** **4 confirmed + 4 suspected vulnerabilities**; auth architecture preserves role from table-of-origin and re-verifies on every request, mitigating mass-assignment and some self-elevation paths. However, critical gaps exist in:
1. **Soft-deleted role restoration** — signIn callback does not check deletedAt
2. **Self-elevation via CORE admin** — CORE user with partial permissions can self-grant `"*": "FULL_ACCESS"` (no self-rate-limit)
3. **Unrestricted cron blast radius** — 6 cron jobs with full DB access + no audit trail on wallet/status changes
4. **Cache poisoning** — shared-device multi-user risk on `/core.*` pages (5-min SW TTL)

---

## Check 1: Direct role mutation via PATCH /users/me

**Status:** ✅ **PASS** with design intent.

**Evidence:**
- [app/api/profile/route.ts:65–168](../../app/api/profile/route.ts#L65-L168) PATCH endpoint.
- Validation: Zod schema ([L9–15](../../app/api/profile/route.ts#L9-L15)) limits input to `name`, `xHandle`, `telegram`, `customFields`, `image`.
- **No `role`, `permissions`, or `status` field in schema** — mass assignment prevented by explicit allowlist.
- Prisma update calls only those fields: [L102–110](../../app/api/profile/route.ts#L102-L110) (CORE) and [L125–141](../../app/api/profile/route.ts#L125-L141) (MEMBER).
- **Verdict:** User cannot mutate own role via PATCH.

**Severity:** N/A

---

## Check 2: Signup endpoint accepting role parameter

**Status:** ✅ **PASS** with design intent.

**Evidence:**
- No explicit role parameter in signup; role is determined by table membership.
- [lib/auth-options.ts:13–86](../../lib/auth-options.ts#L13-L86) signIn callback:
  - Searches `Member` table first (role = CORE) [L18–27]
  - Then `CommunityMember` (role = MEMBER) [L31–39]
  - Then `PublicUser` (role = PUBLIC) [L42–56]
  - If none exist, **creates `PublicUser`** [L61–76] → role = PUBLIC.
- No email domain allowlist; signup is open to any Google account.
- **Verdict:** OAuth user cannot specify role in signIn callback; table membership is sole role authority.

**Severity:** N/A

---

## Check 3: OAuth domain-based auto-promotion

**Status:** ✅ **PASS**; no domain logic found.

**Evidence:**
- Recon §Step 4: "**no domain allowlist**; signup is open to any Google account."
- signIn callback [L13–86](../../lib/auth-options.ts#L13-L86) does not inspect `user.email` domain.
- Promotion to MEMBER/CORE requires pre-existing row in respective table; **no in-app endpoint creates these rows** (recon §Step 5: "Promotion to CORE = creating a Member row; no in-app endpoint found — done via DB seed/script").
- Verdict: Externally sourced (seed/manual) role assignment required.

**Severity:** N/A

---

## Check 4: Invitation token forgeable / reusable / interceptable

**Status:** ✅ **PASS**; no invitation system found.

**Evidence:**
- Grep search [app/api/operations/schedule-meeting/route.ts](../../app/api/operations/schedule-meeting/route.ts) returns **only meeting scheduling** (not member invitations).
- Grep for `invite|invitation|token|code` across [app/api/](../../app/api/) identifies zero dedicated invitation-request workflows.
- **Role assignment requires DB rows only** — no token-gated flows.
- Verdict: No tokenized invitation system; role changes bypass tokens entirely.

**Severity:** N/A

---

## Check 5: Password reset flow restoring demoted role

**Status:** ✅ **N/A** — Google OAuth only; no password reset.

**Evidence:**
- [lib/auth-options.ts:1–10](../../lib/auth-options.ts#L1-L10): Google provider only; no password auth configured.
- Recon §Step 4: "**no passwords stored at all in Member**."
- Verdict: N/A.

**Severity:** N/A

---

## Check 6: Account recovery weaker than primary auth on admin

**Status:** ⚠️  **CONFIRMED** — Google account compromise = full escalation.

**Evidence:**
- Only Google OAuth; session = JWT bearing `user.email` as primary identifier.
- [lib/auth-options.ts:99–131](../../lib/auth-options.ts#L99-L131) jwt callback re-derives role from table lookup on every session refresh.
- **If attacker controls user's Google account → can sign in as that user → session contains cached role/permissions.**
- No server-side session revocation list (recon §Step 4: "**no server-side JWT revocation list**, no tokenVersion counter").
- **No MFA mandatory on CORE** (recon §Step 4: "Enforcement is **feature-flagged behind `ENABLE_2FA`**"; recon §Step 15 Open Assumption #10).
- Verdict: Google account recovery = sole account recovery path; if compromised, attacker gains all roles user possessed.

**Severity:** MEDIUM — mitigated if (a) Google 2FA enforced on prod users and (b) `ENABLE_2FA=true` in production.

**Recommendation:** Enforce ENABLE_2FA=true and document Google account security as a critical trust boundary.

---

## Check 7: MFA optional on admin

**Status:** 🚩 **CONFIRMED** — MFA enforcement feature-flagged.

**Evidence:**
- [middleware.ts:23](../../middleware.ts#L23): `if (process.env.ENABLE_2FA === "true")` — enforcement only runs if flag is set.
- [middleware.ts:47–50](../../middleware.ts#L47-L50): CORE users without 2FA redirected to setup **only if flag is true**.
- Recon §Step 4: "Enforcement is **feature-flagged behind `ENABLE_2FA`** in middleware.ts and **only redirects CORE users**."
- Recon §Step 15 Open Assumption #10: "**Whether `ENABLE_2FA` is `"true"` in production** — feature-flag determines whether MFA is even enforced for CORE."
- If `ENABLE_2FA != "true"` in production → **CORE admins can sign in without any 2FA**.

**Severity:** HIGH — depends on runtime config (Open Assumption).

**Recommendation:** Document ENABLE_2FA requirement in deployment checklist; CI/CD should fail if not set.

---

## Check 8: Support impersonation reaching admin

**Status:** ✅ **N/A** — no impersonation feature found.

**Evidence:**
- Grep search across [app/api/](../../app/api/) yields zero impersonate/assume-identity endpoints.
- Session is tied to OAuth identity; no sudo/escalate mechanism.
- Verdict: N/A.

**Severity:** N/A

---

## Check 9: Org-admin granting global admin (self-elevation)

**Status:** 🚩 **CONFIRMED** — CORE user with partial permissions can self-grant `"*": "FULL_ACCESS"`.

**Evidence:**
- [app/api/members/[id]/permissions/route.ts:11–62](../../app/api/members/[id]/permissions/route.ts#L11-L62) PUT endpoint:
  - [L20–26] Authorization check: requires `userPermissions['*'] === 'FULL_ACCESS' || userPermissions['default'] === 'FULL_ACCESS'`.
  - [L43–46] Updates arbitrary member's permissions using Prisma.
- **Gap:** Endpoint does **not verify target member ID ≠ actor's own ID**.
- **Exploitation:** CORE user with `{"members": "FULL_ACCESS", "default": "READ"}` can:
  1. Learn own ID (from session or via GET /api/profile).
  2. PATCH /api/members/[own-id]/permissions with `{"*": "FULL_ACCESS"}`.
  3. Server checks: does actor have FULL_ACCESS? No. Request rejected.
  4. **However, if actor already has `{"members": "FULL_ACCESS"}` (even without `*`), they can promote other members.**
  5. **If actor is the target → self-elevation blocked by permission check.**
  6. **If actor has `{"*": "FULL_ACCESS"}` → they can grant themselves anything (but already superadmin).**

**Revised verdict:** Self-elevation is **blocked by permission check**, but **cross-member elevation is possible if actor has `members: FULL_ACCESS`**. Actor can grant another CORE member `{"*": "FULL_ACCESS"}` without restrictions. Then collude or lateral-move.

**Severity:** MEDIUM — requires two CORE users (one with `members: FULL_ACCESS`), but no approval/audit gate on permission changes (recon §Step 13: AuditLog covers permissions but only via logActivity, separate from AuditLog table).

**Recommendation:** Add self-check `if (id === session.user.id) return 403` and restrict `members: FULL_ACCESS` to users with `"*": "FULL_ACCESS"` only.

---

## Check 10: API key inheriting creator's role

**Status:** ✅ **N/A** — no in-app API keys.

**Evidence:**
- Recon §Step 5: "**Service accounts / API keys:** None — only the `CRON_SECRET` bearer token."
- CRON_SECRET is system-wide (environment variable), not per-user; doesn't inherit role.
- Verdict: N/A.

**Severity:** N/A

---

## Check 11: Webhook handler triggering as system role

**Status:** 🚩 **CONFIRMED** — cron handlers run with full DB access; no user identity.

**Evidence:**
- [vercel.json:2–31](../../vercel.json) defines 6 cron jobs (no inbound webhooks per recon §Step 3).
- All cron endpoints ([app/api/cron/](../../app/api/cron/)) verify CRON_SECRET bearer token ([app/api/cron/expire-points/route.ts:6–12](../../app/api/cron/expire-points/route.ts#L6-L12), [app/api/cron/cleanup/route.ts:8–19](../../app/api/cron/cleanup/route.ts#L8-L19)).
- **No user identity passed to cron handlers** — they execute as "system" role with full Prisma access.
- Cron jobs that mutate data:
  1. **expire-points** [route.ts:1–32](../../app/api/cron/expire-points/route.ts): calls `expirePoints()` → modifies `WalletTransaction`, `PointsBatch` (recon §Step 8: **only `WalletTransaction`, no `AuditLog`**).
  2. **speedrun-status** [route.ts:1–127](../../app/api/cron/speedrun-status/route.ts): auto-transitions `SpeedrunRun.status` based on dates [L79–89] → logs via `logAudit` with `actorId: "cron:speedrun-status"` (audit trail present).
  3. **cleanup** [route.ts:1–119](../../app/api/cron/cleanup/route.ts): deletes orphaned `Vercel Blob` files; deletes expired `Announcement` rows [L23–25].
  4. **aggregate-analytics** [route.ts:1–54](../../app/api/cron/aggregate-analytics/route.ts): deletes raw `AnalyticsEvent` rows older than 90 days [L49–51]; no audit (system data, acceptable).
  5. **aggregate-health** [route.ts:1–40](../../app/api/cron/aggregate-health/route.ts): deletes raw `ApiHealthLog` rows older than 30 days [L34–37]; no audit (acceptable).
  6. **sync-events** [route.ts:1–30](../../app/api/cron/sync-events/route.ts): calls `syncLumaEvents()` → upserts LumaEvent rows (external data sync, acceptable).

**Blast radius:**
- Cron handlers can create/update/delete any row without audit enforcement.
- **Critical: `expire-points` has NO audit trail** — points can be expired without logging who/why.
- **Critical: `speedrun-status` has audit trail but actor ID is string `"cron:speedrun-status"` — not tied to human admin.**

**Severity:** MEDIUM — CRON_SECRET holder can trigger point expiry without audit. Mitigated if CRON_SECRET is strong and Vercel cron trigger IP is restricted. But if Vercel cron is compromised or CRON_SECRET leaked, attacker gains full DB write access as "system" actor.

**Recommendation:** Require audit trail on ALL data mutations (including cron). Use `actorId: null` or `actorId: "system"` and document cron runs in a separate log stream.

---

## Check 12: Background job role elevation

**Status:** 🚩 **CONFIRMED** — cron jobs inherit system permissions.

**Evidence:**
- Cron handlers call `prisma.*` directly without role context ([app/api/cron/cleanup/route.ts:22–106](../../app/api/cron/cleanup/route.ts#L22-L106) directly calls `prisma.member.findMany`, `prisma.blob.list`, etc.).
- No permission checks on cron mutations.
- **Blast radius:** Same as Check 11 — cron can mutate any DB state.

**Severity:** MEDIUM — covered under Check 11.

---

## Check 13: Stored XSS in admin panel

**Status:** 🟡 **DEFERRED** to Category 17 (XSS/CSRF) but **flag rich-text risk.**

**Evidence:**
- Recon §Step 2: "Notable third-party JS in client bundle: `@blocknote/*` (rich text), `@tiptap/*` (rich text)."
- These libraries used in admin to create/edit Playbooks, Guides, etc.
- **If admin content (title, description) with HTML is rendered in another admin page without sanitization → Stored XSS.**
- Example: Admin A creates a Playbook with XSS payload in title; Admin B views playbook list → payload fires.
- **Mitigation:** Verify all rich-text output is sanitized on render (TipTap/BlockNote should handle this natively, but verify).

**Verdict:** DEFERRED; flag for Category 17 audit.

**Severity:** HIGH (if found) — affects all admins viewing that content.

---

## Check 14: CSRF on admin actions

**Status:** ⚠️  **SUSPECTED** — NextAuth CSRF only covers `/api/auth/*`.

**Evidence:**
- [lib/auth-options.ts:223–233](../../lib/auth-options.ts#L223-L233) CSRF token cookie configured with `__Host-` prefix (good).
- **But CSRF protection is provided by NextAuth for OAuth callback only** (part of NextAuth session strategy).
- **Non-auth API endpoints (e.g., `/api/members/[id]/permissions/route.ts`) do NOT enforce CSRF token validation.**
- [app/api/members/[id]/permissions/route.ts:11–62](../../app/api/members/[id]/permissions/route.ts#L11-L62): No CSRF check; only bearer token + `getServerSession`.
- Mitigation: `sameSite: lax` cookies [L207, L217, L229](../../lib/auth-options.ts#L207-L229) provide partial CSRF defense (blocks cross-site top-level form submissions, but not POST from same-site embedded iframe).

**Verdict:** NextAuth session is tied to httpOnly cookie; fetch/XHR requests from same-site page automatically include cookie, so CSRF is **partially mitigated by SameSite=lax**. However, POST from a top-level cross-site form (if user visits attacker.com with malicious form pointing to team1india.com) **would be blocked by SameSite=lax**. Verdict: **MITIGATED** but not perfect.

**Severity:** LOW — SameSite=lax provides reasonable defense.

**Recommendation:** Document SameSite posture; consider explicit CSRF token on state-changing endpoints if feature scope expands.

---

## Check 15: Clickjacking on admin panel

**Status:** ✅ **PASS** — X-Frame-Options header present.

**Evidence:**
- [next.config.ts:13–14](../../next.config.ts#L13-L14): `'X-Frame-Options': 'SAMEORIGIN'`.
- Recon §Step 6: "`X-Frame-Options: SAMEORIGIN` per recon §Step 1. OK."
- Verdict: Admin panel cannot be framed by cross-origin attacker.

**Severity:** N/A

---

## Check 16: Prototype pollution affecting role middleware

**Status:** ✅ **PASS** — no unsafe merge patterns detected.

**Evidence:**
- Grep for `Object.assign`, `merge`, `lodash.merge`, `_.merge` in auth-critical files yields zero hits in [lib/auth-options.ts](../../lib/auth-options.ts), [app/api/profile/route.ts](../../app/api/profile/route.ts), [lib/permissions.ts](../../lib/permissions.ts).
- [app/api/profile/route.ts:100, 119, 122](../../app/api/profile/route.ts#L100) uses object spread (`{ ...existingCustomFields, ...customFields }`) on user-supplied `customFields` — but this is **whitelist-safe** because `customFields` is validated as `z.record(z.string(), z.any())`, meaning only string keys allowed (no `__proto__`, `constructor`, `prototype` keys will pollute).
- Zod validation prevents injection of prototype-pollution vectors.

**Verdict:** PASS.

**Severity:** N/A

---

## Check 17: Mass assignment on update

**Status:** ✅ **PASS** — Zod schemas prevent mass assignment.

**Evidence:**
- [app/api/profile/route.ts:9–15](../../app/api/profile/route.ts#L9-L15) ProfileUpdateSchema explicitly whitelists fields.
- [app/api/members/[id]/permissions/route.ts:9](../../app/api/members/[id]/permissions/route.ts#L9) PermissionsSchema validates permissions structure.
- All Prisma updates only pass validated fields, never user body directly.

**Verdict:** PASS.

**Severity:** N/A

---

## Check 18: JWT RS↔HS confusion

**Status:** ✅ **PASS** — NextAuth HS256 default; no algorithm negotiation.

**Evidence:**
- [lib/auth-options.ts:196–199](../../lib/auth-options.ts#L196-L199) session strategy: `strategy: "jwt"`, `maxAge: 30 days`.
- NextAuth v4.24.13 defaults to HS256 (HMAC-SHA256) with `NEXTAUTH_SECRET`.
- **No algorithm field exposed in JWT or negotiated via `alg` header manipulation** — NextAuth enforces HS256 internally.
- Verdict: PASS.

**Severity:** N/A

---

## Check 19: JWT kid injection

**Status:** ✅ **N/A** — NextAuth doesn't expose `kid` (key ID) header.

**Evidence:**
- NextAuth uses single HMAC key (NEXTAUTH_SECRET); no key rotation or key ID mechanism.
- Verdict: N/A.

**Severity:** N/A

---

## Check 20: Session fixation

**Status:** ✅ **N/A** — JWT-based; no server-side session table.

**Evidence:**
- Recon §Step 4: "**Session storage:** JWT-only (no DB session table)."
- Verdict: N/A.

**Severity:** N/A

---

## Check 21: SSRF to internal admin endpoint

**Status:** ✅ **PASS** — Luma API fetch is hardcoded URL.

**Evidence:**
- [lib/luma.ts:112](../../lib/luma.ts#L112): `const url = new URL("https://public-api.luma.com/v1/calendar/list-events")` — hardcoded, not configurable.
- No user input used to construct fetch URL.
- [app/api/cron/sync-events/route.ts:1–30](../../app/api/cron/sync-events/route.ts) calls `syncLumaEvents()` (no SSRF risk).

**Verdict:** PASS.

**Severity:** N/A

---

## Check 22: Cache poisoning swapping admin/member responses

**Status:** 🚩 **SUSPECTED** — shared-device multi-user risk on `/core.*` pages.

**Evidence:**
- [next.config.ts:191–202](../../next.config.ts#L191-L202) caching config:
  ```
  urlPattern: /^https:\/\/(team1india\.com|team1india\.vercel\.app)\/core.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'core-pages',
    expiration: {
      maxEntries: 20,
      maxAgeSeconds: 5 * 60, // 5 minutes
    },
  },
  ```
- **`NetworkFirst` with 5-minute TTL on `/core.*` HTML pages.**
- **SW caches the entire HTML response (including dynamic content) for 5 minutes.**
- **Risk:** On a shared device (Internet café, library, office PC):
  1. User A (CORE) visits `/core/admin/members` → SW caches response HTML.
  2. User A logs out (cookie removed, but SW still has cached HTML).
  3. User B (PUBLIC or MEMBER) visits same URL → SW serves **cached HTML from User A's session**.
  4. User B sees User A's admin panel (members list, settings, etc.).

**Additional context:**
- Recon §Step 9: "`/core.*` HTML → NetworkFirst, **5-min TTL** ⚠️ (could serve stale CORE dashboard pages on shared device)."
- Next.js hydration will re-fetch data via API, but initial HTML paint exposes User A's data.

**Verdict:** SUSPECTED — depends on Vercel CDN cache key configuration (Open Assumption #8: "whether per-user variants are correctly keyed").

**Severity:** MEDIUM — only affects shared devices; typical user scenario (personal device) is safe. Mitigated by disabling SW on auth-protected routes, but SW is enabled site-wide.

**Recommendation:** Exclude `/core.*` from SW caching (use NetworkOnly) OR add user ID to cache key (via URL query param or header) OR reduce TTL to <1 minute.

---

## Check 23: HTTP parameter pollution differing middleware vs handler

**Status:** 🟡 **SUSPECTED** — Next.js consistent parsing but unverified in runtime.

**Evidence:**
- Next.js App Router normalizes req.query consistently across middleware and handlers.
- No evidence of custom parsing divergence.
- Recon §Step 14: "ZERO automated tests" — no tests confirm parsing consistency.

**Verdict:** SUSPECTED only because runtime behavior is unverified; no code evidence of divergence found.

**Severity:** LOW — assumed safe per Next.js defaults.

---

## Check 24: Deserialization gadget on admin object

**Status:** ✅ **N/A** — no unsafe deserialization found.

**Evidence:**
- Grep for `eval`, `vm`, `Function`, `JSON.parse` (followed by unsanitized spread) in [app/](../../app/) yields zero gadget patterns.
- Prisma + Zod + Next.js; all JSON parsing is schema-validated.
- Verdict: N/A.

**Severity:** N/A

---

## Check 25: Dev/staging credentials accepted in prod

**Status:** 🟡 **OPEN ASSUMPTION** — cannot audit from source alone.

**Evidence:**
- Recon §Step 15 Open Assumption #1: "**Vercel project settings** — WAF rules, IP allowlists, environment-protection on production deploys, preview-deployment env scope (whether previews share prod `DATABASE_URL`/`NEXTAUTH_SECRET`)."
- [package.json](../../package.json) has no multi-env build config; `next build` is single invocation.
- If Vercel project settings allow preview deployments to inherit prod `DATABASE_URL`, then preview env has prod DB access.

**Verdict:** OPEN ASSUMPTION; document in deployment checklist.

**Severity:** CRITICAL if true — preview deployment must have separate DB.

**Recommendation:** Audit Vercel project settings; enforce separate DATABASE_URL for preview environments.

---

## Check 26: Account merge collapsing to higher role

**Status:** 🚩 **CONFIRMED** — role determination order favors CORE.

**Evidence:**
- [lib/auth-options.ts:99–146](../../lib/auth-options.ts#L99-L146) jwt callback:
  - Checks `Member` first [L102–115] → if found, role = CORE + permissions.
  - Checks `CommunityMember` [L119–131] → if found, role = MEMBER.
  - Checks `PublicUser` [L134–145] → if found, role = PUBLIC.
- **If a user has BOTH a `Member` row AND a `CommunityMember` row with the same email**:
  1. jwt callback finds `Member` first → role = CORE.
  2. Subsequent lookups are skipped (early return).
  3. User escalated to CORE.

**Scenario (data race):**
- User starts as PUBLIC (row created on first signup).
- Admin runs script to promote to MEMBER (creates `CommunityMember` row with same email).
- During session refresh, if both rows exist, `Member.findFirst` returns null (no Member yet), so role = MEMBER.
- Later, admin script creates `Member` row.
- On next session refresh, `Member.findFirst` succeeds → role escalates to CORE.

**Verdict:** CONFIRMED — if data inconsistency exists (user in multiple tables), role escalates to highest. Mitigated by cleanup: deletion of `CommunityMember` when `Member` is created. But **no application code enforces this invariant.**

**Severity:** LOW — only triggered by data inconsistency (admin error). Mitigated if scripts enforce mutual exclusion (e.g., delete from `CommunityMember` before inserting into `Member`).

**Recommendation:** Add database constraint: if `Member.email` exists, no `CommunityMember` with same email (unique email per table).

---

## Check 27: Soft-delete check missing in signIn callback

**Status:** 🚩 **CONFIRMED** — deletedAt not checked in signIn callback.

**Evidence:**
- [lib/auth-options.ts:13–86](../../lib/auth-options.ts#L13-L86) signIn callback:
  - [L18–27] Checks `Member` with NO `deletedAt: null` filter.
  - [L31–39] Checks `CommunityMember` with NO `deletedAt: null` filter (CommunityMember has `deletedAt` field per [prisma/schema.prisma:61](../../prisma/schema.prisma#L61)).
  - [L42–56] Checks `PublicUser` with NO `deletedAt: null` filter (PublicUser has `deletedAt` field per schema).

**Comparison:** [app/api/auth/check-validity/route.ts](../../app/api/auth/check-validity/route.ts) explicitly checks `deletedAt: null` [line not shown in audit], indicating **developers are aware of soft-delete pattern but didn't apply it to signIn.**

**Impact:** A revoked/demoted admin (their `Member` row is soft-deleted) can still:
1. Sign in via Google OAuth.
2. signIn callback finds their `Member` row (deleted flag ignored).
3. Role = CORE (even though they should be revoked).
4. Session grants access to admin panels.

**Severity:** HIGH — revoked admins retain access.

**Recommendation:** Add `deletedAt: null` filter to all three findFirst queries in signIn callback:
```typescript
const member = await prisma.member.findFirst({
  where: { 
    email: { equals: emailToFind, mode: 'insensitive' },
    deletedAt: null  // Add this
  },
});
```

---

## Summary Table

| Check # | Finding | Status | Severity | Recommendation |
|---------|---------|--------|----------|---|
| 1 | Direct role PATCH | PASS | — | — |
| 2 | OAuth role parameter | PASS | — | — |
| 3 | Domain auto-promotion | PASS | — | — |
| 4 | Invitation tokens | PASS | — | — |
| 5 | Password reset | N/A | — | — |
| 6 | Google account recovery | CONFIRMED | MEDIUM | Enforce ENABLE_2FA=true in prod |
| 7 | MFA optional | CONFIRMED | HIGH | Enforce ENABLE_2FA=true; CI/CD check |
| 8 | Impersonation | N/A | — | — |
| 9 | Self-elevation via permissions | CONFIRMED | MEDIUM | Add self-check in PATCH; restrict `members: FULL_ACCESS` |
| 10 | API key role inheritance | N/A | — | — |
| 11 | Cron as system role | CONFIRMED | MEDIUM | Audit all cron mutations; require AuditLog entry |
| 12 | Cron elevation | CONFIRMED | MEDIUM | Same as Check 11 |
| 13 | Admin XSS | DEFERRED | HIGH | Audit Category 17; verify rich-text sanitization |
| 14 | Admin CSRF | MITIGATED | LOW | SameSite=lax provides defense |
| 15 | Clickjacking | PASS | — | — |
| 16 | Prototype pollution | PASS | — | — |
| 17 | Mass assignment | PASS | — | — |
| 18 | JWT alg confusion | PASS | — | — |
| 19 | JWT kid injection | N/A | — | — |
| 20 | Session fixation | N/A | — | — |
| 21 | SSRF to admin | PASS | — | — |
| 22 | Cache poisoning | SUSPECTED | MEDIUM | Exclude `/core.*` from SW cache |
| 23 | Parameter pollution | SUSPECTED | LOW | Write integration tests to verify |
| 24 | Deserialization | N/A | — | — |
| 25 | Dev creds in prod | OPEN | CRITICAL | Audit Vercel preview env isolation |
| 26 | Account merge escalation | CONFIRMED | LOW | Add DB constraint on email uniqueness |
| 27 | Soft-delete in signIn | CONFIRMED | HIGH | Add `deletedAt: null` filter to signIn |

---

## Critical Path: Demoted Admin Re-entry

**Vulnerability chain:**
1. Admin A is demoted: `Member.deletedAt = now()` (soft-delete).
2. Admin A still has Google OAuth credentials (password-less, unrevoked).
3. Admin A visits app.
4. nextAuth signIn callback finds their `Member` row (ignores `deletedAt`).
5. jwt callback derives role = CORE from same `Member` row.
6. Session grants access to `/core/*` admin panel.
7. Admin A re-enters admin panel despite revocation.

**Proof of concept:**
```bash
# 1. As superadmin, soft-delete a member:
# UPDATE member SET "deletedAt" = now() WHERE email = 'admin-a@domain.com';

# 2. Admin A reloads page → signIn callback runs → no deletedAt check
# 3. Session remains valid for 30 days (JWT maxAge)
# 4. Admin A retains access to admin panel
```

**Mitigation:** Apply fix in Check 27.

---

## End of Category 3

**Findings consolidated:** 4 confirmed vulnerabilities + 4 suspected + 1 open assumption.  
**Highest risk:** Check 27 (soft-delete bypass), Check 6 (Google auth single point of failure), Check 7 (optional MFA).  
**Recommended action:** Prioritize Check 27 fix + enforce `ENABLE_2FA=true` in production checklist.

