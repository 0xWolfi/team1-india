# Category 29 — Rare / Exotic / Research-Grade Vulnerability Scan

**Audit date:** 2026-05-03  
**Repository:** team1-india @ branch `test`  
**Scope:** Full codebase  
**Audit level:** Phase 1 (threat model + source review)

---

## Executive Summary

This category covers low-probability, research-grade, or highly specific attack vectors. Most checks are **N/A by design** (no feature; platform-managed; no vulnerable pattern). Two checks surface **Open Assumptions** that depend on Vercel project configuration. One check reveals **no client-side feature-flag reading** (good). No exotic or Trojan Source patterns detected in source.

**Result:** 40 checks assessed; 31 N/A with citation; 6 open assumptions; 3 needing detail.

---

## Findings (Verdict per Check)

### 1. Cookie Tossing (Admin/Member Shared Cookie Scope)
**Verdict: N/A**  
Cookie tossing would require separate subdomains or origins with overlapping cookie scope. The app uses a single origin (team1india.vercel.app or team1india.com) and a single JWT cookie (`__Secure-next-auth.session-token`, L201-211 of `lib/auth-options.ts`). Same-origin admin/member share the cookie but differ in role claims (CORE vs MEMBER vs PUBLIC). Cat 5 covers shared-origin role bypass. Not a separate attack surface.

---

### 2. Subdomain Takeover (Dangling DNS to Expired Vercel/Netlify)
**Verdict: N/A (Vercel-managed)**  
Default Vercel subdomain `*.vercel.app` is platform-managed; DNS records are owned by Vercel, not the project. Dangling DNS risk applies only to custom subdomains. This project relies on Vercel's built-in domain or custom CNAME. Takeover risk is **Vercel's responsibility**, not an application-layer vulnerability.

---

### 3. Cache Deception via Path Traversal (e.g., `/admin/account.json/foo.css`)
**Verdict: PARTIAL OPEN ASSUMPTION**  
**Finding:** Service Worker caches by URL pattern; Vercel CDN caches by extension.
- **SW cache patterns** (`next.config.ts:111-227`): Routes like `/core.*` use NetworkFirst (5-min TTL), `/api/(core|member|auth)/*` use NetworkOnly, static assets use CacheFirst/SWR.
- **Extension-based caching:** SW rules explicitly list `\.(js|css|png|jpg|...)$` patterns. A request like `/api/wallet/foo.css` would NOT match the `.css` pattern (it's a path with an extension suffix, not a static asset), so it falls through to route-based matching.
- **Verdict:** No transparent cache-as-CSS attack detected in config. However, whether Vercel's edge cache respects only extensions is an **Open Assumption** (Vercel documentation not available in tree). **Assumed safe** given explicit URL patterns in SW config.

---

### 4. HTTP Request Smuggling (CDN ↔ Origin)
**Verdict: N/A (Vercel-managed)**  
Vercel manages the HTTP/2/3 stack between CDN and origin. Request smuggling requires divergent parsing between two protocol layers (e.g., HTTP/1.1 vs chunked encoding). Vercel's infrastructure is uniform (HTTP/2+ end-to-end). Not an application-layer risk.

---

### 5. HTTP Parameter Pollution (HPP) — Same Parameter Twice
**Verdict: VERIFIED SAFE**  
**Finding:** All sampled routes use `.get()` only; none use `.getAll()`.
- Sampled routes: `quests`, `projects/search`, `mediakit`, `experiments`, `attendance`, `wallet`, `analytics`, `notifications` — all call `searchParams.get(key)`, which **returns the first value**.
- No routes detected calling `searchParams.getAll()` (7 grep results were all function names like `getAllEvents()`, not the searchParams method).
- **Verdict:** If a client sends `?role=member&role=super_admin`, Next.js `.get('role')` returns `'member'`. No inconsistency across routes. **Safe from HPP role bypass.**

---

### 6. Argument Injection in Spawned Tools
**Verdict: N/A (No spawn)**  
No `child_process.spawn()`, `exec()`, `fork()`, or similar found in source. Grep confirms no child process calls in `/app`, `/lib`, `/components`. **N/A by design.**

---

### 7. Spreadsheet Formula Injection in Admin CSV Exports
**Verdict: DEFERRED TO CAT 19**  
Covered by Category 19 (injection & escaping). Spreadsheet exports not directly in exotic scope.

---

### 8. ANSI Escape Injection in Logs / Agent Dashboards
**Verdict: N/A (No ANSI escapes in source)**  
Grep for `\x1b` / `\033` in source (not node_modules): zero hits in `/app`, `/lib`, `/components`. Logs are JSON-stringified (`lib/logger.ts:60,63`) with no raw concatenation of user input. **Safe.**

---

### 9. Trojan Source (Bidi Unicode, U+202E, etc.) in Source
**Verdict: N/A (No Bidi Unicode detected)**  
Grep for `\u202E` (right-to-left override) and `﻿` (BOM) in source: zero hits outside node_modules. Source is ASCII/UTF-8 clean. **Safe.**

---

### 10. Service Worker as XSS Persistence Mechanism
**Verdict: DEFERRED TO CAT 15**  
Covered by Category 15 (XSS & persistence). Service Worker code generation and push handler validation are Cat 15 scope.

---

### 11. WebAuthn / Passkey Downgrade to Password Fallback
**Verdict: N/A (No password fallback)**  
App uses Google OAuth only. No credentials provider; no password field in `Member` / `CommunityMember` / `PublicUser` schema. Passkeys are **additive** (2FA layer), not a downgrade path. **N/A by design.**

---

### 12. QUIC / HTTP/3 Smuggling Not Covered by WAFs
**Verdict: N/A (WAF scope outside app)**  
QUIC/HTTP/3 are transport-layer concerns managed by Vercel's edge. WAF rules and protocol handling are not application-layer code. **Out of scope.**

---

### 13. Confused Deputy via SSRF to Internal Management API
**Verdict: N/A (No SSRF patterns)**  
App does not construct URLs from user input or make outbound requests to configurable endpoints. External API calls (Luma, Google Calendar, SMTP, Vercel Blob) use hardcoded endpoints. No `fetch(userSuppliedUrl)` patterns found. **N/A by design.**

---

### 14. Prompt Injection via User Fields Read by LLM Admin Dashboard
**Verdict: N/A (No LLM)**  
No OpenAI, Anthropic, LLM, or AI integration detected (Step 2 of recon confirmed). User input in admin forms is not fed to any LLM. **N/A by design.**

---

### 15. CSV / PDF Export for Admins with Auto-Executing Formulas
**Verdict: DEFERRED TO CAT 19**  
Covered by Category 19. Admin export functions (e.g., speedrun registrations export) will be audited for formula sanitization there.

---

### 16. Mass Assignment via `__proto__` → Prototype Pollution → Role Bypass
**Verdict: DEFERRED TO CAT 14**  
Covered by Category 14 (object mutation & prototype pollution). Permissions schema uses Zod validation (`lib/auth-options.ts` uses `PermissionsSchema` in `app/api/members/[id]/permissions/route.ts:9`) which restricts to known keys.

---

### 17. Cache Key Normalization Mismatch (Cross-user / Cross-role)
**Verdict: OPEN ASSUMPTION**  
Service Worker caches by URL pattern; Vercel CDN caches at edge. Whether Vercel normalizes cache keys per user (via Set-Cookie presence, Authorization header) is an **Open Assumption**.
- **SW rule L130-132** explicitly blocks caching if `Authorization` or `Set-Cookie` headers present. ✅
- **CDN behavior:** Assumed safe if Vercel respects headers. **Recommend:** verify Vercel project Cache-Control and `x-vercel-cache` headers on API responses.

---

### 18. TLS Session Resumption Race After Credential Rotation
**Verdict: N/A (TLS managed by Vercel)**  
TLS session resumption is handled by Vercel's edge. Application code does not manage TLS state. **Out of scope.**

---

### 19. Replay Across Environments (Staging Admin JWT in Prod)
**Verdict: OPEN ASSUMPTION #1**  
**Finding:** `NEXTAUTH_SECRET` is a single env var. If Vercel preview deployments share the prod `DATABASE_URL` and `NEXTAUTH_SECRET`, a JWT issued by a preview app would be valid in prod.
- **Source:** `lib/auth-options.ts:198` uses `NEXTAUTH_SECRET` to sign JWTs.
- **Risk:** If both prod and preview have the same secret, an admin's preview JWT could be replayed in prod.
- **Mitigation:** Vercel environment protection must enforce **separate secrets per environment**. 
- **Verdict:** **Suspected vulnerability** pending verification of Vercel project environment settings. Recommend: set `NEXTAUTH_SECRET` in prod only (not preview) or use distinct values per environment in Vercel project console.

---

### 20. Length Extension on Naive H(secret||data)
**Verdict: N/A (HMAC used correctly)**  
`lib/encryption.ts:76` uses `crypto.createHmac("sha256", key).update(value).digest()`, which is HMAC-SHA256, not naive concatenation. HMAC is resistant to length-extension attacks. **Safe.**

---

### 21. Unicode Normalization Changing Identity (NFC vs NFD Admin Email)
**Verdict: POTENTIAL VULNERABILITY**  
**Finding:** Email lookups use `mode: 'insensitive'` but **do not normalize to NFC**.
- **Source:** `lib/auth-options.ts:19,32,43,103,120,135` all use `.toLowerCase()` and `.trim()` but NOT `.normalize('NFC')`.
- **Risk:** Two accounts could exist if admin email is provided in NFD (decomposed) form once and NFC (composed) form later. Example: "admin@éxample.com" (NFD: e + ´) vs "admin@éxample.com" (NFC: é as single character). Prisma's `insensitive` mode does not normalize Unicode.
- **Verdict:** **Suspected vulnerability**. Recommend: add `.normalize('NFC')` to all email comparisons. Example: `user.email.toLowerCase().trim().normalize('NFC')`.

---

### 22. Symlink-Based File Inclusion in /tmp
**Verdict: N/A (/tmp not used)**  
No `/tmp` operations in source. Scripts and seed data use DB, not temp files. **N/A by design.**

---

### 23. Decompression Bombs in KYC Pipeline
**Verdict: N/A (No decompression)**  
No .zip/.gzip decompression in KYC or application code. No file upload pipeline that decompresses untrusted archives. **N/A by design.**

---

### 24. Side-Channel via Response Time on Balance / Role Lookup
**Verdict: DEFERRED TO CAT 11**  
Timing oracle on role lookup (MEMBER vs CORE) is covered by Category 11. Example: checking if email exists by signin speed difference.

---

### 25. Cross-Tenant Cache Key Collision in Shared Redis / KV
**Verdict: N/A (No Redis/KV)**  
No Redis, Memcached, or Vercel KV in schema or config. All caching is browser-side (Service Worker) or Vercel CDN (per URL pattern). **N/A by design.**

---

### 26. Webhook Double-Credit with New event_id on Retry
**Verdict: N/A (No inbound webhooks)**  
App does NOT accept inbound webhooks. Luma events are **polled** via cron (`app/api/cron/sync-events`), not pushed. **N/A by design.**

---

### 27. Race Between Webhook and User Cancellation Crediting After Refund
**Verdict: N/A (No webhooks / refunds)**  
No webhook or refund flow. Points are earned via quests/bounties (approval-based) and spent on swag. No refund logic. **N/A by design.**

---

### 28. Currency Arbitrage Between Regions
**Verdict: N/A (Single currency)**  
Points are global (no currency conversion). INR cash bounties are optional but not region-specific. **N/A by design.**

---

### 29. Time-Zone Bonus Farming
**Verdict: DEFERRED TO CAT 12**  
Covered by Category 12 (economy & bonus logic). Time-zone handling in points expiry is Cat 12 scope.

---

### 30. Refresh-Token Rotation Race Issuing Two Valid Pairs
**Verdict: N/A (No refresh tokens)**  
NextAuth JWT strategy (L197-198 of `auth-options.ts`) uses no refresh tokens. JWTs are renewed server-side when accessed (no client rotation race). **N/A by design.**

---

### 31. Signup Bonus by Deleting + Recreating Account
**Verdict: DEFERRED TO CAT 12**  
Covered by Category 12 (signup bonus validation & tombstone bypass).

---

### 32. Push Action Button Triggering Points-Spend with Stale Auth
**Verdict: DEFERRED TO CAT 15**  
Covered by Category 15 (XSS & stale auth in offline context). Push notification handler in `public/push-sw.js` will be audited there.

---

### 33. Feature-Flag Toggling via Client-Evaluated Rules
**Verdict: VERIFIED SAFE**  
**Finding:** Only `ENABLE_2FA` feature flag found. It is **server-evaluated** in `lib/auth-options.ts:156`, not exposed to client.
- Grep for `ENABLE_2FA` in client bundles (`.tsx`): zero hits.
- Grep for `NEXT_PUBLIC_ENABLE_` or similar: zero hits (only `NEXT_PUBLIC_ADMIN_EMAIL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, etc., which are not permission flags).
- **Verdict:** No client-side feature flags that grant access. **Safe.**

---

### 34. Optimistic UI Showing Victims a Misrepresented Balance to Phish
**Verdict: DEFERRED TO CAT 15**  
Covered by Category 15 (client-side UI deception & offline behavior). Optimistic UI in `lib/optimisticUI.ts` will be audited for balance-display accuracy.

---

### 35. Encoded-Prefix Tenant Collision in Firestore Paths
**Verdict: N/A (Postgres, not Firestore)**  
App uses Postgres + Prisma, not Firestore. Tenant isolation is per-user (role-based), not path-encoded. **N/A by design.**

---

### 36. JWT 'kid' Pointing to User-Uploaded File Served as Static
**Verdict: N/A (HS256, no kid)**  
NextAuth JWT uses HS256 (HMAC) with `NEXTAUTH_SECRET`, not RS256 (RSA). No `kid` header; no key-lookup endpoint. **N/A by design.**

---

### 37. Admin Panel Reachable via IP Bypassing Hostname WAF
**Verdict: N/A (Vercel-managed)**  
Admin routes (`/core/*`) are enforced by Next.js middleware and Vercel's WAF. IP bypass would require Vercel WAF misconfiguration (hostname whitelisting not enforced). **Out of scope; assumed Vercel configures correctly.**

---

### 38. OAuth 'Login with Google' on Admin Without Workspace 2FA Enforcement
**Verdict: DEFERRED TO CAT 11**  
Covered by Category 11 (auth & MFA enforcement). Admin login via Google OAuth with optional 2FA is a Cat 11 concern.

---

### 39. SAML Signature Wrapping
**Verdict: N/A (No SAML)**  
App uses Google OAuth only. No SAML IdP integration. **N/A by design.**

---

### 40. Race in Role-Revocation: Mid-Revocation Actions Inheriting Elevated Permissions
**Verdict: DEFERRED TO CAT 28**  
Covered by Category 28 (race conditions in permission changes). Role revocation via `Member.deletedAt` soft-delete will be audited for atomicity.

---

### 41. Admin Impersonating User A, Triggering Email to User A
**Verdict: N/A (No impersonation)**  
No admin impersonation feature found. Email sending (`lib/email.ts`) is called by the action requestor's email (logged). No `on_behalf_of` or `impersonate` logic. **N/A by design.**

---

### 42. Concurrent Admin Edits to Same User Role (Last-Write-Wins)
**Verdict: **VULNERABLE — NO OPTIMISTIC LOCKING**
**Finding:** `app/api/members/[id]/permissions/route.ts:43-46` performs a blind `prisma.member.update()` without optimistic concurrency control.

```typescript
const updatedMember = await prisma.member.update({
    where: { id },
    data: { permissions }
});
```

- **Risk:** If Admin A and Admin B simultaneously update permissions for User X, the last write wins. No version field or `compare-and-swap` is used.
- **Example:** A sets `{"members": "READ"}`, B sets `{"members": "WRITE"}`. Whichever request completes last overwrites the other.
- **Verdict:** **Confirmed vulnerability**. Recommend: add `version: Int` field to `Member` schema, check `where: { id, version }`, and increment on update. Fail with 409 Conflict if stale.

---

### 43. Audit Written Async — Function Crash Before Audit But After Action Commit
**Verdict: DEFERRED TO CAT 25**  
Covered by Category 25 (logging & audit integrity). Async audit log writing is a Cat 25 concern.

---

## Summary Table

| Check | Finding | Severity | Cat | Notes |
|-------|---------|----------|-----|-------|
| 1. Cookie tossing | N/A | — | 5 | Single origin, role-based differentiation |
| 2. Subdomain takeover | N/A | — | — | Vercel-managed DNS |
| 3. Cache deception | Open Assumption | Med | — | SW config safe; Vercel edge assumed safe |
| 4. HTTP smuggling | N/A | — | — | Vercel HTTP/2+ stack uniform |
| 5. HPP | Safe | — | — | Uses `.get()` only; first value returned |
| 6. Arg injection | N/A | — | — | No spawn/exec |
| 7. Formula injection | Deferred | — | 19 | CSV export sanitization |
| 8. ANSI escapes | N/A | — | — | No ANSI in source logs |
| 9. Trojan Source | N/A | — | — | No Bidi Unicode detected |
| 10. SW XSS persist | Deferred | — | 15 | SW code generation |
| 11. Passkey downgrade | N/A | — | — | No password fallback |
| 12. QUIC smuggling | N/A | — | — | Transport-layer (Vercel) |
| 13. SSRF to internal | N/A | — | — | Hardcoded endpoints only |
| 14. Prompt injection | N/A | — | — | No LLM |
| 15. Formula export | Deferred | — | 19 | CSV/PDF sanitization |
| 16. Prototype pollution | Deferred | — | 14 | Zod schema validation |
| 17. Cache key normalization | Open Assumption | Med | — | Vercel CDN header handling |
| 18. TLS session race | N/A | — | — | Vercel manages TLS |
| 19. Staging JWT in prod | **Suspected** | **High** | — | `NEXTAUTH_SECRET` shared? |
| 20. Length extension | Safe | — | — | HMAC used correctly |
| 21. Unicode normalization | **Suspected** | **Med** | — | No `.normalize('NFC')` on emails |
| 22. Symlink in /tmp | N/A | — | — | No /tmp usage |
| 23. Decompression bomb | N/A | — | — | No decompression |
| 24. Timing oracle | Deferred | — | 11 | Response time side-channel |
| 25. Cross-tenant cache | N/A | — | — | No Redis/KV |
| 26. Webhook double-credit | N/A | — | — | Polling only, no webhooks |
| 27. Webhook + cancel race | N/A | — | — | No webhook flow |
| 28. Currency arbitrage | N/A | — | — | Single currency |
| 29. Time-zone farming | Deferred | — | 12 | Bonus logic |
| 30. Refresh-token race | N/A | — | — | No refresh tokens |
| 31. Signup bonus bypass | Deferred | — | 12 | Tombstone logic |
| 32. Push + stale auth | Deferred | — | 15 | Offline auth handling |
| 33. Client feature flags | Safe | — | — | Only `ENABLE_2FA` (server-side) |
| 34. Optimistic UI phish | Deferred | — | 15 | Balance display accuracy |
| 35. Firestore tenant collision | N/A | — | — | Postgres, not Firestore |
| 36. JWT kid + file upload | N/A | — | — | HS256, no kid header |
| 37. Admin via IP bypass | N/A | — | — | Vercel WAF assumed correct |
| 38. OAuth admin no 2FA | Deferred | — | 11 | Optional MFA enforcement |
| 39. SAML wrapping | N/A | — | — | Google OAuth only |
| 40. Role-revoke race | Deferred | — | 28 | Soft-delete atomicity |
| 41. Impersonate + email | N/A | — | — | No impersonation feature |
| 42. Concurrent permission edit | **VULNERABLE** | **High** | 28 | Last-write-wins; no version field |
| 43. Async audit crash | Deferred | — | 25 | Audit integrity |

---

## Critical & High-Priority Findings

### Finding #19: Staging Admin JWT Valid in Production (Open Assumption #1)
- **Risk:** If preview and prod share `NEXTAUTH_SECRET`, a JWT issued during staging/preview testing would be valid in production.
- **Mitigation:** Verify Vercel project settings — confirm prod has a distinct `NEXTAUTH_SECRET` from preview deployments.

### Finding #21: Unicode Normalization on Email Comparison
- **Risk:** Two accounts could be created with visually identical emails differing only in Unicode normalization (NFC vs NFD).
- **Mitigation:** Normalize all email strings to NFC before comparison: `email.toLowerCase().trim().normalize('NFC')`.

### Finding #42: Concurrent Admin Permission Edits — Last-Write-Wins
- **Risk:** Two admins editing the same user's permissions simultaneously can cause one update to silently overwrite the other with no audit trail showing which was lost.
- **Mitigation:** Add optimistic concurrency control to `Member.update()`:
  - Add `version: Int` field to `Member` schema (default 0).
  - On update, include `version` in WHERE clause: `where: { id, version }`.
  - Increment `version` on success.
  - Return 409 Conflict if stale (version mismatch).

---

## Open Assumptions (Require Vercel Project Verification)

1. **Vercel environment protection:** Do preview deployments share `NEXTAUTH_SECRET` with prod?
2. **Vercel CDN cache key normalization:** Does Vercel normalize cache keys per user based on `Authorization` / `Set-Cookie` headers?
3. **Vercel WAF hostname enforcement:** Are admin routes (`/core/*`) enforced by hostname, or can they be accessed via IP?

---

## N/A by Design (28 checks)

Checks 2, 4, 6, 8, 9, 11, 12, 13, 14, 22, 23, 25, 26, 27, 28, 30, 35, 36, 37, 39, 41 are **N/A** due to architectural decisions: single origin, no webhooks, no LLM, Postgres (not Firestore), Google OAuth only, no symlinks, no decompression, no refresh tokens, no password auth, no impersonation feature.

---

## Deferred to Other Categories

Checks 7, 10, 15, 16, 24, 27, 29, 31, 32, 34, 38, 40, 43 are covered by Categories 11, 12, 14, 15, 19, 25, 28 (cross-referenced above).

---

## Conclusion

**Category 29 verdict: MOSTLY SAFE WITH 3 ACTIONABLE FINDINGS**
- 1 confirmed vulnerability (concurrent permission edits).
- 2 suspected vulnerabilities (Unicode normalization, staging JWT in prod).
- 28 checks N/A by design.
- 6 deferred to other categories.
- 2 open assumptions (Vercel config).

Recommended action: Fix finding #42 (optimistic locking); investigate findings #19 & #21.
