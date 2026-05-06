# Category 5 — Separate Admin Panels: Isolation & Cross-Panel Attacks

**Audit date:** 2026-05-03  
**Scope:** Admin panel isolation, cookie scope, shared authentication, cross-panel CSRF, re-authentication on destructive actions, PWA caching, and sensitive state leaks.  
**Key finding:** **Single-origin monolithic architecture; all admin, member, and public surfaces share JWT cookie, bundle, and API layer.** Blast radius on any client-side vulnerability (XSS) affects all roles.

---

## Executive Summary

Per recon §Step 6, this application has **only one Next.js app, one origin, one bundle pipeline, and one JWT cookie**. The admin panel (`/app/core/`) is not a separate deployment, not behind IP allowlist / VPN / mTLS, and not in a separate subdomain. It is a route within the same app as the member and public surfaces.

This design has **inherent security consequences:**
- A single XSS in a public or member page can steal admin session tokens (because `__Secure-next-auth.session-token` is shared).
- No separate rate limits, no separate WAF rules, no separate observability per panel.
- All API endpoints are in the same Lambda / Vercel function pool.
- Database credentials (shared `DATABASE_URL`) grant root DB access to every function.

**Verdicts below frame checks as "confirmed" or "N/A due to monolithic design" with explicit blast-radius documentation.**

---

## ✅ Check 1: Admin panel on same origin / shared cookies / shared localStorage

**Verdict: CONFIRMED YES — Critical design risk.**

**Evidence:**

| Aspect | Finding |
|--------|---------|
| **Origin** | Single `https://team1india.vercel.app` (recon §Step 6) |
| **Cookie name** | `__Secure-next-auth.session-token` (prod) ([lib/auth-options.ts:202-204](../../../lib/auth-options.ts#L202-L204)) |
| **Scope** | Same cookie shared across `/public/*`, `/member/*`, `/core/*` routes |
| **JWT payload** | `token.role`, `token.permissions`, `token.id` populated in [lib/auth-options.ts:87-176](../../../lib/auth-options.ts#L87-L176) for all roles |
| **Bundle** | Same Next.js webpack pipeline; no separate bundle for admin ([next.config.ts](../../../next.config.ts) shows single config) |

**Blast radius:**

1. **XSS in public or member page → admin session hijack:** A public user or member page could be compromised (e.g., via unsafe `dangerouslySetInnerHTML`, third-party script injection, or upstream NPM package XSS). An attacker can then:
   - Read `document.cookie` for `__Secure-next-auth.session-token`.
   - Make authenticated requests as the admin via `fetch()` with credentials.
   - Access `/api/admin/*`, `/api/members/*`, `/api/quests/*` (DELETE/PATCH).
   - Impersonate the admin to any external service (OAuth, email, SMTP).

2. **No HTTPOnly bypass in modern browsers:** Mitigation is strong (cookie is `httpOnly: true`, [lib/auth-options.ts:206](../../../lib/auth-options.ts#L206)), but the risk of DOM XSS → DOM-based token leakage persists if an attacker can exfiltrate from other client-side state (e.g., Redux, IndexedDB, sessionStorage).

3. **Service worker caches authenticated pages:** `/core.*` pages are cached with 5-min TTL via PWA ([next.config.ts:193-202](../../../next.config.ts#L193-L202)). On a shared device, a public user hitting `/core/*` (even after logout) could receive a cached page containing sensitive state.

**Recommendation:** Monolithic architecture is inherent risk. Mitigations:
- Enforce **strong CSP** (currently has `script-src 'unsafe-eval' 'unsafe-inline'` — [next.config.ts:32](../../../next.config.ts#L32) — which weakens XSS defense).
- **Subresource Integrity (SRI)** on all third-party scripts.
- **Regular penetration testing** of public/member pages for XSS.
- Consider **separate admin URL** (e.g., `admin.team1india.com`) with separate cookies + separate deployment if high-value data is at stake.

---

## ✅ Check 2: Cookie scope set to `.example.com` leaking to subdomain

**Verdict: NOT VULNERABLE — No explicit domain attribute.**

**Evidence:**

[lib/auth-options.ts:200-211](../../../lib/auth-options.ts#L200-L211):
```typescript
cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // ← NO `domain` attribute set
      },
    },
```

**Analysis:** NextAuth's default cookie config omits the `domain` attribute, meaning the cookie is **host-only** (bound to exact hostname `team1india.vercel.app`, not `.team1india.vercel.app`). This **prevents subdomain leakage.**

**No risk:** ✅

---

## ✅ Check 3: Shared JWT signing secret between panels

**Verdict: N/A (single app) — but document the implication.**

**Evidence:**

- Single `NEXTAUTH_SECRET` env var used by all roles (recon §Step 11).
- No separate secrets per role or per panel.
- JWT callback [lib/auth-options.ts:87-176](../../../lib/auth-options.ts#L87-L176) populates `token.role` = `"CORE" | "MEMBER" | "PUBLIC"`.

**Implication:** All panels sign and verify tokens with the same secret. If `NEXTAUTH_SECRET` is leaked, **all roles' sessions become forgeable.** Attacker can create arbitrary `token.role`, `token.permissions`, `token.id` and impersonate any user.

**Mitigation:** Ensure `NEXTAUTH_SECRET` has high entropy (audit assumption #5). Rotate weekly. No second factor (e.g., HMAC keying by IP) present.

---

## ✅ Check 4: Admin and member API on same Lambda with role branching

**Verdict: CONFIRMED YES — Single Vercel deployment.**

**Evidence:**

[vercel.json](../../../vercel.json) contains **no `functions` override** — defaults to Vercel's behavior of **one function per route file.** All routes under [app/api/](../../../app/api/) are deployed as part of a single Next.js project.

- Admin routes: `[app/api/admin/](../../../app/api/admin/)`, `[app/api/members/](../../../app/api/members/)` (CORE-only checks via `getServerSession` + `checkCoreAccess`).
- Member/public routes: `[app/api/quests/](../../../app/api/quests/)`, `[app/api/bounty/](../../../app/api/bounty/)`, etc. (mixed auth checks).

**Role branching:** Each route independently calls `getServerSession(authOptions)`, then checks `session.user.role !== 'CORE'` (e.g., [app/api/quests/[id]/route.ts:32-35](../../../app/api/quests/[id]/route.ts#L32-L35)). No centralized role-based function dispatch.

**Risk:** If one route's auth check is misconfigured, the same cold-start process executes both that route and nearby sensitive routes (e.g., DELETE operations). No hard boundary.

**Verdict: Risk is inherent to monolithic design.**

---

## ✅ Check 5: Admin and member sharing service-role / admin DB key

**Verdict: CONFIRMED YES — Single DATABASE_URL grants root DB access.**

**Evidence:**

- Single `DATABASE_URL` env var ([recon §Step 11](../../../docs/security/audit-2026-05-03/00-RECON.md#step-11--secrets-env-vars-configuration)).
- Prisma client ([lib/prisma.ts](../../../lib/prisma.ts)) initializes with that URL; used by all route handlers.
- No per-role Prisma client instances, no RLS (Row-Level Security) policies in schema.

**Implication:** Any Vercel function (admin, member, public) that calls `prisma.*` gets **full database read/write access.** There is no database-layer enforcement of role restrictions.

Example: If member API route `[app/api/bounty/route.ts](../../../app/api/bounty/route.ts)` has a bug (e.g., missing role check), attacker can directly modify `Member.permissions` via `prisma.member.update(...)`.

**Mitigation:**
- Add **PostgreSQL RLS policies** per role (requires schema refactor; not present).
- Use **row-based encryption** for sensitive data (e.g., `Member.permissions`).
- Regular **application-level code review** of permission checks in every route.

---

## ✅ Check 6: Super-admin and core panel sharing auth backend without scope

**Verdict: CONFIRMED YES — Same JWT, same callbacks.**

**Evidence:**

- `token.role` is set once per user in JWT callback ([lib/auth-options.ts:108-146](../../../lib/auth-options.ts#L108-L146)).
- No distinction between super-admin and regular CORE user in JWT; only `token.permissions` map differs.
- Both super-admin (`permissions["*"] = "FULL_ACCESS"`) and regular CORE (`permissions["default"] = "READ"`) use the same callback path.

**Risk:** Token claims are **not scoped to specific resources or time windows.** A CORE user with `"default": "READ"` has the same JWT structure as a super-admin; the difference is purely in the `permissions` map, which is **client-controlled in token claims.**

If a super-admin's token is stolen, attacker can read it, see `permissions["*"] = "FULL_ACCESS"`, and impersonate that super-admin indefinitely (until token expires after 30 days).

**Mitigation:**
- Implement **step-up auth** for destructive actions (e.g., re-prompt password / MFA before permission grant).
- Use **short-lived access tokens** (e.g., 15 min) + **refresh token rotation** (not present; JWT maxAge is 30 days).
- Add **device binding** (e.g., tie token to IP hash or device ID).

---

## ✅ Check 7: Admin panel reachable from public internet without IP allowlist / VPN / mTLS

**Verdict: CONFIRMED YES — No access control.**

**Evidence:**

- [app/core/layout.tsx:20-23](../../../app/core/layout.tsx#L20-L23): Only auth check is `if (userRole !== 'CORE') { redirect(...) }` — no IP restriction, no VPN check, no mTLS.
- [middleware.ts](../../../middleware.ts): Global middleware only enforces 2FA redirect (feature-flagged), not IP/VPN.
- [vercel.json](../../../vercel.json): No `restrictedPath` or `ipWhitelist` config.

**Risk:** Anyone with a CORE account can log in from anywhere (Starbucks WiFi, coffee shop, VPN-on-demand). No audit trail of login location. Compromised credentials = instant remote access.

**Recommendation:**
- Add **IP allowlist** at Vercel project level (available in Vercel Pro/Enterprise).
- Log **login IP + timestamp + device** to `AuditLog` (see Cat 5 §Check 20).
- Alert on **anomalous login patterns** (e.g., login from two countries in 1 minute).

---

## ✅ Check 8: Admin panel index revealing existence (verbose 404 vs 401 vs 200)

**Verdict: INFORMATION DISCLOSURE — Non-unauthenticated user gets 401 (login redirect), revealing `/core` exists.**

**Evidence:**

[app/core/layout.tsx:12-14](../../../app/core/layout.tsx#L12-L14):
```typescript
if (!session) {
    redirect('/public?error=login_required');
}
```

**Flow:**
1. Unauthenticated user visits `/core` → `getServerSession()` returns `null`.
2. Layout calls `redirect('/public?error=login_required')`.
3. HTTP response is **302 redirect** (reveals `/core` accepted and checked for auth).

**Vs. ideal:** Return **404 Not Found** for unauthenticated users, **200 OK** with login form for authenticated, **403 Forbidden** for wrong role.

**Impact:** LOW — An attacker can infer `/core` is a protected admin route (standard convention). No sensitive data disclosed.

**Verdict: Acceptable for this application.**

---

## ✅ Check 9: Admin panel login lacking MFA

**Verdict: CONFIRMED — MFA is optional + feature-flagged.**

**Evidence:**

[recon §Step 4](../../../docs/security/audit-2026-05-03/00-RECON.md#step-4--authentication--identity-map):
- MFA (TOTP + passkeys) is in `TwoFactorAuth` and `Passkey` models ([prisma/schema.prisma:1146-1177](../../../prisma/schema.prisma#L1146-L1177)).
- Enforcement is **feature-flagged behind `ENABLE_2FA`** in [middleware.ts:23](../../../middleware.ts#L23).
- If `ENABLE_2FA` is **not** `"true"` in production, CORE users can log in without MFA.

**Risk:** If feature flag is disabled or forgotten in production, admins have no second factor. Compromised password or token = immediate access.

**Check:** Confirm `ENABLE_2FA=true` in production `.env`. If not, this is **Critical** risk.

---

## ✅ Check 10: Admin panel session timeout same as member

**Verdict: CONFIRMED — 30-day JWT maxAge for all roles.**

**Evidence:**

[lib/auth-options.ts:196-198](../../../lib/auth-options.ts#L196-L198):
```typescript
session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
},
```

**Risk:** An admin user can stay logged in for **30 days without re-authentication.** If a shared device / compromised device, attacker has 30 days to use a stolen token before it expires.

**Mitigation:**
- Set **shorter admin maxAge** (e.g., 8 hours) in separate config.
- Implement **refresh token rotation** with shorter-lived tokens.
- Add **device/IP binding** to detect token theft.

---

## ✅ Check 11: Admin panel allowing remember-me / long-lived tokens

**Verdict: CONFIRMED — Implicit 30-day remember-me via JWT strategy.**

**Evidence:**

[lib/auth-options.ts:196-198](../../../lib/auth-options.ts#L196-L198): `maxAge: 30 * 24 * 60 * 60` is the **default and only option.**

No UI toggle for "remember me" found, but **all logins are implicitly remembered for 30 days.** This is equivalent to a hardcoded "remember me" for every session.

**Risk:** Indistinguishable from Check 10 — long session duration is the risk.

---

## ✅ Check 12: Admin panel HTML cacheable by CDN

**Verdict: CONFIRMED RISK — `/core.*` HTML cached for 5 minutes on shared device.**

**Evidence:**

[next.config.ts:191-202](../../../next.config.ts#L191-L202):
```typescript
{
  urlPattern: /^https:\/\/(team1india\.com|team1india\.vercel\.app)\/core.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'core-pages',
    expiration: {
      maxEntries: 20,
      maxAgeSeconds: 5 * 60, // 5 minutes - shorter TTL for dashboard
    },
    networkTimeoutSeconds: 5,
  },
},
```

**Attack scenario (shared device):**
1. Admin logs in, visits `/core/dashboard`.
2. Service Worker caches the HTML response for 5 minutes.
3. Admin logs out (clears cookie).
4. Public user visits the shared device.
5. Public user navigates to `/core/dashboard` within 5 minutes → **SW serves cached admin page from step 1.**
6. Cached page may contain:
   - Admin UI components (e.g., "Delete User" buttons).
   - Sensitive data rendered in the HTML (e.g., user list, permissions).
   - Even without data, the **admin-only UI leaks the fact that admin role exists.**

**Mitigation:**
- Set cache TTL to **0 seconds** (no caching) for authenticated pages.
- Or: **Clear cache on logout** (add logout handler to SW).
- Or: **Tag cached responses with userEmail** and invalidate on role change.

---

## ✅ Check 13: Admin JS bundle including member code / vice versa

**Verdict: DEPENDS ON CODE SPLITTING — standard Next.js behavior.**

**Evidence:**

- No custom webpack config overriding code splitting in [next.config.ts](../../../next.config.ts) (no `webpack` function).
- Next.js App Router **automatically code-splits per route file** by default.
- Admin code in `[app/core/*/page.tsx](../../../app/core/)` and API in `[app/api/admin/](../../../app/api/admin/)` is separate route chunks.

**Sample:** [app/core/admin/page.tsx](../../../app/core/admin/page.tsx) (if exists) would be bundled into a chunk like `_app/core/admin/page.js` (~50 KB estimated). Public pages bundle separately.

**Risk:** If a page imports member-only utility (e.g., `import { earnPointsForm } from '@/components/member/earn-points'`), that component is bundled into the admin chunk. If component has XSS (e.g., `dangerouslySetInnerHTML`), admin page is affected.

**Verdict:** Risk is **low** (good separation), but depends on developers avoiding cross-panel imports. No enforcement mechanism.

---

## ✅ Check 14: Admin endpoints discoverable in member source map

**Verdict: SOURCE MAPS NOT FOUND in production config — **safe by omission.**

**Evidence:**

[next.config.ts](../../../next.config.ts): No `productionBrowserSourceMaps: true` — defaults to **false**, meaning **source maps are not generated in production.**

**Check:** Run `grep -i "sourcemap\|sourceMap" next.config.ts` → **no match.**

**Verdict:** ✅ Safe.

---

## ✅ Check 15: Different auth providers but shared identity (Google login)

**Verdict: N/A — Only Google OAuth present.**

**Evidence:**

[lib/auth-options.ts:6-10](../../../lib/auth-options.ts#L6-L10): Only `GoogleProvider` configured; no credentials, no GitHub, no Okta.

No cross-provider account linking. No risk vector.

---

## ✅ Check 16: Cross-panel CSRF — SameSite=Lax allows top-level navigation CSRF

**Verdict: MITIGATED BY NEXTAUTH CSRF TOKEN — But check for state-changing GETs.**

**Evidence:**

[lib/auth-options.ts:223-233](../../../lib/auth-options.ts#L223-L233): NextAuth issues CSRF token in `__Host-next-auth.csrf-token` (also `httpOnly`, `sameSite: 'lax'`). All form submissions via NextAuth routes are CSRF-protected.

**State-changing GET endpoints:** Searched [app/api/](../../../app/api/) for `export async function GET` + state mutation — **none found.** All mutations (create, update, delete) use POST, PATCH, or DELETE methods.

**Verdict:** ✅ Safe — standard NextAuth CSRF protection + no state-changing GETs.

---

## ✅ Check 17: Cross-panel postMessage without origin check

**Verdict: NO postMessage in source code — safe.**

**Evidence:**

Searched source tree for `postMessage` in client/server code ([app/](../../../app/), [lib/](../../../lib/), [components/](../../../components/)) — **zero matches** (only type definitions in node_modules).

No SW-to-window or window-to-window messaging in app code.

**Verdict:** ✅ Safe.

---

## ✅ Check 18: Step-up auth missing on destructive admin actions

**Verdict: CONFIRMED VULNERABLE — No re-authentication required.**

**Evidence:**

Destructive endpoints examined:
- `[app/api/quests/[id]/route.ts:66-83](../../../app/api/quests/[id]/route.ts#L66-L83)`: DELETE (soft-delete quest) — only checks `session.user.role !== 'CORE'`.
- `[app/api/members/[id]/permissions/route.ts:11-62](../../../app/api/members/[id]/permissions/route.ts#L11-L62)`: PUT (change member permissions) — only checks FULL_ACCESS, no step-up.
- `[app/api/admin/send-email/route.ts:6-51](../../../app/api/admin/send-email/route.ts#L6-L51)`: POST (send mass email to hardcoded recipients) — only checks `session.user.role === 'CORE'`.
- `[app/api/bounty/submissions/[id]/route.ts:10-100](../../../app/api/bounty/submissions/[id]/route.ts#L10-L100)`: PATCH (approve bounty, award XP/points) — only checks CORE role.

**No endpoint requires:**
- Password re-entry.
- MFA re-verification (TOTP code, passkey tap).
- Email confirmation.
- Approval from second admin.

**Attack scenario:**
1. Admin's browser is compromised (XSS in member page).
2. Attacker calls `PATCH /api/bounty/submissions/[id]` with `{ status: "approved", ... }` → instantly grants points.
3. Or: `PUT /api/members/[id]/permissions` → changes target user to super-admin.
4. Or: `DELETE /api/quests/[id]` → deletes quest.

All happen with zero additional friction.

**Verdict: CONFIRMED CRITICAL — Recommend step-up auth for all role/permission changes.**

---

## ✅ Check 19: Admin actions performable via API with weaker checks than UI

**Verdict: N/A (same code path) — API and UI use identical route handlers.**

**Evidence:**

Next.js App Router pattern: API routes under `[app/api/](../../../app/api/)` are plain Node.js handlers. UI calls them via `fetch()`. No separate DTO, no separate auth checks.

Example: Creating a quest:
- **UI:** `fetch('/api/quests', { method: 'POST', body: JSON.stringify(...) })`
- **API direct:** Same endpoint, same Zod validation, same `checkCoreAccess()` call.

**Verdict:** No separate API path; same checks apply to UI and direct API calls. ✅

---

## ✅ Check 20: Admin actions logged client-side only

**Verdict: CONFIRMED SAFE — Actions logged server-side.**

**Evidence:**

[recon §Step 13](../../../docs/security/audit-2026-05-03/00-RECON.md#step-13--logging-monitoring-audit):
- Permission changes logged via `logActivity()` ([app/api/members/[id]/permissions/route.ts:49-55](../../../app/api/members/[id]/permissions/route.ts#L49-L55)) → `Log` table.
- Media creates logged via `logAudit()` ([app/api/media/route.ts:66-75](../../../app/api/media/route.ts#L66-L75)) → `AuditLog` table.

**Gaps (for reference, not this check):**
- Point grants, bounty approvals, login events NOT audited (covered in Cat 13).

**Verdict:** ✅ Destructive actions ARE server-side logged (where implemented).

---

## ✅ Check 21: Admin error pages echoing query params

**Verdict: NO ERROR PAGES FOUND — Default Next.js behavior.**

**Evidence:**

Searched [app/core/](../../../app/core/) for `error.tsx`, `not-found.tsx`, `catch-all.tsx` — **none exist.** Application uses Next.js default error handling (generic error page, no custom echoing).

**Verdict:** ✅ Safe by default.

---

## ✅ Check 22: Admin file upload without strict content-type / sandbox origin

**Verdict: STRONG CONTENT-TYPE VALIDATION — Low risk.**

**Evidence:**

[app/api/upload/token/route.ts:19-29](../../../app/api/upload/token/route.ts#L19-L29):
```typescript
onBeforeGenerateToken: async (pathname) => {
  return {
    allowedContentTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
    maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
    addRandomSuffix: true,
  };
},
```

**Validation:**
- Only image MIME types allowed (no `application/javascript`, no SVG with `<script>` tags).
- Max 10 MB.
- Random suffix added (prevents overwriting).
- Uploaded to **Vercel Blob** (separate origin, not served from app origin).

**Auth:**
- [app/api/upload/token/route.ts:8-11](../../../app/api/upload/token/route.ts#L8-11): Requires `session.user.id` and role `CORE` or `MEMBER`.

**Verdict:** ✅ Strong validation, proper auth, sandboxed origin.

---

## ✅ Check 23: Admin link-preview / unfurl with admin-network reachability

**Verdict: N/A — No link preview / unfurl feature found.**

**Evidence:**

Searched [app/api/](../../../app/api/) for `fetch(`, `http.get`, `unfurl`, `preview`, `og:` — zero matches in route handlers.

No feature that fetches user-supplied URLs (Cat 18 SSRF scope).

**Verdict:** N/A.

---

## ✅ Check 24: Sensitive admin state in window globals

**Verdict: NO WINDOW GLOBALS FOUND — Safe by design.**

**Evidence:**

Searched [app/](../../../app/) for `window.__`, `globalThis.__`, `window.ADMIN_STATE` — **zero matches** in app code.

Session state is passed via NextAuth's `useSession()` hook (client-side cache), not via global variables.

**Verdict:** ✅ Safe.

---

## Summary Table

| Check | Finding | Severity |
|-------|---------|----------|
| 1. Shared origin & cookies | CONFIRMED YES — XSS → admin hijack | 🔴 Critical |
| 2. Cookie domain scope | NOT VULNERABLE — host-only | ✅ Safe |
| 3. Shared JWT secret | N/A (single app) — implication: high entropy needed | 🟠 Medium |
| 4. Same Lambda + role branching | CONFIRMED YES — monolithic | ⚠️ Medium |
| 5. Shared DB credential | CONFIRMED YES — no RLS | 🔴 Critical |
| 6. Super-admin + core same auth | CONFIRMED YES — no scope | 🔴 Critical |
| 7. Admin reachable from internet | CONFIRMED YES — no IP gate | 🔴 Critical |
| 8. Admin existence revealed | ACCEPTABLE — 302 redirect on unauth | 🟢 Low |
| 9. MFA optional & flagged | CONFIRMED — verify flag in prod | 🔴 Critical |
| 10. Session timeout 30 days | CONFIRMED — too long for admin | 🔴 Critical |
| 11. Implicit remember-me | CONFIRMED — same as #10 | 🔴 Critical |
| 12. `/core` HTML cached 5 min | CONFIRMED — shared device risk | 🟠 High |
| 13. Bundle separation | DEPENDS — good by default, no enforcement | 🟢 Low |
| 14. Source maps in prod | SAFE — not enabled | ✅ Safe |
| 15. Multi-provider | N/A — Google only | ✅ N/A |
| 16. CSRF | SAFE — NextAuth CSRF token + no state-changing GETs | ✅ Safe |
| 17. postMessage | SAFE — no postMessage in code | ✅ Safe |
| 18. Step-up auth missing | CONFIRMED VULNERABLE — no re-auth | 🔴 Critical |
| 19. API weaker than UI | N/A — same code path | ✅ N/A |
| 20. Client-side logging only | SAFE — server-side logging present | ✅ Safe |
| 21. Error pages echo input | SAFE — default Next.js | ✅ Safe |
| 22. File upload validation | STRONG — content-type + size + sandboxed | ✅ Safe |
| 23. Link preview SSRF | N/A — no feature | ✅ N/A |
| 24. Window globals | SAFE — no globals | ✅ Safe |

---

## Recommendations (Priority Order)

### 🔴 Critical — Address immediately

1. **Enforce MFA on CORE role** (Check 9)
   - Set `ENABLE_2FA=true` in production.
   - Make TOTP/passkey mandatory, not optional.
   - Test in staging first.

2. **Add step-up auth for destructive actions** (Check 18)
   - Destructive actions: permission grant, role change, delete users/quests, send emails.
   - Require MFA re-verification (TOTP code or passkey tap).
   - Or: require password (not present; consider adding optional password recovery).

3. **Reduce admin session timeout** (Checks 10, 11)
   - Set admin JWT maxAge to **8 hours** (not 30 days).
   - Member/public can remain 30 days.
   - Implement refresh token rotation + sliding window re-auth.

4. **Add IP allowlist for admin panel** (Check 7)
   - Enable Vercel Pro IP blocking on `/core/*`.
   - Or: Implement custom middleware to check IP against allowlist.
   - Log all admin logins with IP + timestamp.

5. **Separate admin subdomain** (Check 1 blast radius)
   - Deploy admin panel to `admin.team1india.com` with separate cookies/JWT.
   - Separate webpack bundle for admin (no member/public code included).
   - Mitigates XSS → admin hijack risk.
   - **Long-term recommendation** (high effort).

### 🟠 High — Address within 1 sprint

6. **Clear PWA cache on logout** (Check 12)
   - Add logout handler to Service Worker to invalidate `/core.*` cache.
   - Or: set `/core` cache TTL to 0 (disable caching for authenticated pages).

7. **Add strong CSP** (Check 1 mitigation)
   - Remove `'unsafe-eval'`, `'unsafe-inline'` from `script-src`.
   - Use `script-src 'nonce-...'` or hash-based CSP.
   - Block third-party inline scripts.

8. **Add RLS (Row-Level Security) to Postgres** (Check 5)
   - Implement database-level access control per role.
   - Ensures that even if application auth is bypassed, DB enforces role restrictions.
   - Requires schema refactor; medium effort.

9. **Audit logging for login + 2FA events** (Check 9, 10 mitigation)
   - Log every CORE login with IP, user-agent, MFA status.
   - Alert on multiple failed 2FA attempts or unusual patterns.

### 🟢 Low — Monitor

10. **Review code imports** (Check 13)
    - Ensure admin pages don't import member/public utilities.
    - Add ESLint rule to prevent cross-panel imports.

11. **Monitor source map generation** (Check 14)
    - Periodically verify that source maps are not accidentally enabled in production.

---

## Open Questions (Audit Assumptions)

- **Is `ENABLE_2FA=true` in production?** (Critical path forward; assume **false** for this report).
- **Number of CORE admins?** (Scope of "separation of duties" for approval workflows).
- **Database network ACL:** Is PostgreSQL publicly reachable or VPC-restricted? (Can mitigate Check 5 externally).
- **Vercel project settings:** Are there additional IP allowlists / WAF rules enabled outside of code?

---

## Conclusion

**Category 5 risk is HIGH due to monolithic architecture.** The primary risk is a **single XSS in a public/member page cascading to admin session hijack**. Mitigations exist (CSP, MFA, step-up auth, IP allowlist) but require immediate implementation.

**Status:** 🔴 **CRITICAL — Do not deploy to production until MFA + step-up auth + IP allowlist are implemented.**

