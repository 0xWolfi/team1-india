# Auth & Authorization Audit — Team1India

Scope: Next.js 15 App Router codebase at `/Users/sarnavo/Development/Team1India`. Focused on authentication, authorization, IDOR, JWT/session handling, mass assignment, and CSRF. ~74 API route files audited, ~168 HTTP handlers.

---

## Critical context (verified before audit)

**The edge layer is dead.** `app/proxy.ts` exists and uses `next-auth/middleware` `withAuth`, but Next.js only loads middleware from `middleware.ts` (or `src/middleware.ts`) at project root. No such file exists. **The proxy file is never executed.** Every protection you think is happening at the edge — the `/api/*` 401 check, the `/api/upload` role gate, the `/api/member` role gate, the `/core` UI block — is not running. Every route stands on its own in-handler checks.

**"Authenticated" means anyone with a Google account.** `lib/auth-options.ts:58-73` auto-creates a `PublicUser` row on first sign-in. There is no email allowlist. Any Google user on Earth can become a logged-in PUBLIC user. aRoutes that "only check session exists" are effectively world-writable with a one-click sign-in.

**Cookies are fine:** `httpOnly=true`, `sameSite=lax`, `secure=true` in prod, `__Host-`/`__Secure-` prefixes. JWT strategy, HS256 with `NEXTAUTH_SECRET`. No `alg:none`, no `localStorage`. CSRF covered by NextAuth for `/api/auth/*` and by `sameSite=lax` for custom routes (weak — see M1).

---

## Per-route table

Legend: **A** = Authenticated? **Z** = Authorized? **I** = IDOR-safe?

### Safe routes (standard CORE + `hasPermission()` or equivalent)

All pass: `action-items` (all methods), `attendance` (all), `bounty` POST/PATCH/DELETE/reset, `bounty/submissions` (role-gated), `community-members` (all), `contributions` (all), `members` (POST/DELETE superadmin, `[id]/permissions`, `[id]/status`), `playbooks` GET/POST/PUT/DELETE, `applications/[id]` PATCH, `event-feedback`, `leaderboard`, `seed/announcements` (prod-blocked + superadmin), `public/*` read endpoints (rate-limited, no mutations), `profile` GET, `public/profile` GET/PATCH (correctly role-gated to PUBLIC).

### Broken or weak routes

| Route + Method | A | Z | I | Issue |
|---|---|---|---|---|
| `admin/send-email` POST | **NO** | NO | N/A | **No auth at all.** Hardcoded recipients limit blast radius but it's an unauth SMTP relay |
| `upload/token` POST | **NO** | NO | N/A | **Unauth Vercel Blob token minting** — previously "protected" by dead proxy |
| `push/send` POST | **WEAK** | NO | NO | `getServerSession()` missing `authOptions` → always null session; also no IDOR check on target `userId` |
| `push/subscribe` POST | **WEAK** | NO | NO | Same `getServerSession()` bug; `userId` from body, not session |
| `push/subscribe/[userId]` DELETE | **WEAK** | NO | NO | Same bug; any user deletes any user's subs |
| `push/preferences/[userId]` GET/PUT | **WEAK** | NO | NO | Same bug; cross-user read/write |
| `announcements` POST | YES | **NO** | N/A | Any PUBLIC Google user can broadcast announcements |
| `announcements` DELETE | YES | **NO** | NO | Any PUBLIC user can delete any announcement by `id` |
| `data-grid/[table]` POST | YES | YES | N/A | **Mass assignment**: `...body` spread into `prisma.create` — a CORE user with `members:WRITE` can set `permissions:{"*":"FULL_ACCESS"}` and self-promote |
| `data-grid/[table]/[id]` PATCH | YES | YES | NO | Same mass-assignment; also no ownership predicate |
| `data-grid/[table]/[id]` DELETE | YES | YES | N/A | Hard delete; schema uses `deletedAt` elsewhere — permanent data loss |
| `data-grid/[table]/config` POST | YES | **NO** | N/A | No role check; any PUBLIC user can overwrite grid configs |
| `guides/[id]` PUT | YES | **NO** | **NO** | No role check, no ownership — any logged-in user edits any guide |
| `guides/[id]` DELETE | YES | **NO** | **NO** | Same |
| `media/[id]` PUT | YES | **NO** | **NO** | Same pattern — IDOR |
| `operations` POST | YES | **NO** | N/A | No role check |
| `operations/[id]` PUT/DELETE | YES | **NO** | **NO** | No role, no ownership |
| `media` POST | YES | **NO** | N/A | No role check; any authenticated user creates media |
| `content` POST | YES | **NO** | N/A | No role check |
| `comments` POST | YES | **NO** | N/A | No role check; no mediaId visibility validation |
| `experiments` POST | YES | **NO** | N/A | Any PUBLIC user can post experiments |
| `experiments/[id]/comments` POST | YES | **NO** | N/A | Same |
| `experiments/[id]` PATCH | YES | WEAK | N/A | Superadmin check uses `permissions['*']==='FULL_ACCESS'` — doesn't match `hasPermission()` semantics used elsewhere |
| `applications` POST | YES | **NO** | N/A | **Object spread overrides trusted fields**: `{ name, email, ...body.data }` — `body.data` can overwrite name/email |
| `applications` GET | YES | WEAK | N/A | Custom superadmin check instead of `hasPermission('applications','READ')` |
| `admin/public-users` GET | YES | WEAK | N/A | Same pattern |
| `members/[id]/tags` PUT | YES | WEAK | N/A | Uses `permissions['default']==='WRITE'` — wrong key semantics |
| `profile` PATCH | YES | WEAK | YES | No role check; `customFields: z.record(z.any())` accepts anything |
| `auth/check-validity` GET | YES | YES | N/A | Doesn't filter `deletedAt`/`status!=='active'` before returning `valid:true` |
| `cron/cleanup` GET | NO (shared secret) | YES | N/A | Shared secret — verify `CRON_SECRET` is strong & env-gated; no rate limit |
| `cron/sync-events` GET | NO (shared secret) | YES | N/A | Same |
| `settings` PATCH | YES | YES | N/A | CORE-only but no key allowlist — writable settings can become config injection sink |

All other routes pass.

---

## Findings by severity

### CRITICAL

**C1. Edge middleware is dead code** — `app/proxy.ts` (entire file)
Next.js does not load `app/proxy.ts`. The edge-layer gate that was supposed to return 401 for unauthenticated `/api/*` traffic, enforce `/api/upload` role, and block `/core` UI doesn't run. Every route is only as safe as its own handler.
**Fix:** Rename to `/middleware.ts` at project root. Test on deploy with an unauthenticated `curl` to `/api/members` — should get 401 from edge, not from the handler.

**C2. `/api/upload/token` POST — fully unauthenticated**
`app/api/upload/token/route.ts` — no `getServerSession` call at all. Any internet user can mint a signed Vercel Blob upload URL.
**Fix:**
```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id || (session.user.role !== 'CORE' && session.user.role !== 'MEMBER')) {
  return new NextResponse('Unauthorized', { status: 401 });
}
```

**C3. `/api/admin/send-email` POST — fully unauthenticated** — `app/api/admin/send-email/route.ts:1-44`
No session check. Recipients are hardcoded, so it's a spam-the-admins relay, not arbitrary SMTP — but still exploitable.
**Fix:** Add session + superadmin check, or delete the route if unused.

**C4. Mass assignment in DataGrid = self-privilege-escalation** — `app/api/data-grid/[table]/route.ts:~107` (POST) and `app/api/data-grid/[table]/[id]/route.ts:38` (PATCH)
`data: { ...body }` is handed to Prisma. The `members` table is allowlisted. A CORE user with `members:WRITE` (which is normal for admins) can PATCH their own member row with `{"permissions":{"*":"FULL_ACCESS"}}` and become superadmin. Same vector for `status`, `deletedAt`, foreign keys.
**Fix:** Define a Zod schema per allowed table and `.parse(body)` before the spread. Whitelist: `members` → `{name, tags, customFields}` only. `permissions` field must be mutated ONLY via `/api/members/[id]/permissions` which correctly requires `FULL_ACCESS`.

**C5. `/api/push/*` — `getServerSession()` called without `authOptions`**
`app/api/push/send/route.ts`, `push/subscribe/route.ts`, `push/subscribe/[userId]/route.ts`, `push/preferences/[userId]/route.ts` all call `getServerSession()` with no argument. Without `authOptions`, NextAuth cannot decode the JWT cookie → returns `null`. The downstream `if (!session?.user)` return 401 either:
- Blocks everyone (route is dead), OR
- With older versions, silently returns an empty session — meaning the `userId` body/param is trusted without verification and any authenticated-in-theory caller can push-spam, subscribe, or read any user's preferences via IDOR.

Either way it's broken.
**Fix:** Replace every `getServerSession()` with `getServerSession(authOptions)` and add `if (userId !== session.user.id && session.user.role !== 'CORE') return 403;`.

---

### HIGH

**H1. Anyone with a Google account gets a session** — `lib/auth-options.ts:58-73`
The `signIn` callback auto-creates a `PublicUser` for unknown emails. Combined with any route that only checks `session?.user`, the real threat model is "any Google user", not "Team1India members". If membership is supposed to be curated, add an email allowlist in `signIn` and return `false` / redirect for unknown emails.

**H2. IDOR cluster — guides, media, operations**
`app/api/guides/[id]/route.ts` PUT/DELETE, `app/api/media/[id]/route.ts` PUT, `app/api/operations/[id]/route.ts` PUT/DELETE all check `session?.user?.id` only, then `prisma.update({ where: { id } })`. Anyone logged-in can mutate any row. No role, no creator check.
**Fix:** For each, fetch the record first, verify `record.createdById === session.user.id || session.user.role === 'CORE'`, then mutate.

**H3. `/api/announcements` POST/DELETE — no RBAC** — `app/api/announcements/route.ts:56-177`
Any PUBLIC Google user can broadcast announcements to the whole community and delete any announcement by id. No role check.
**Fix:** `if (session.user.role !== 'CORE') return 403` at the top of POST and DELETE, plus `hasPermission(session.user.permissions, 'announcements', 'WRITE')`.

**H4. `/api/data-grid/[table]/config` POST — no RBAC** — `app/api/data-grid/[table]/config/route.ts`
Any authenticated user can rewrite the column config of any data-grid table. Only an email existence check is done.
**Fix:** Add CORE role + permission check.

**H5. Application POST object-spread overrides trusted fields** — `app/api/applications/route.ts:85-97`
```js
data: { name: userName, email: applicantEmail, ...body.data, submittedAt }
```
In JS the later keys win. A hostile client sends `body.data = { name: 'Someone Else', email: 'victim@example.com' }` and that replaces the session-derived values.
**Fix:** Put `...body.data` first, trusted fields last. Better: validate `body.data` against a Zod schema that prohibits `name`/`email` keys.

**H6. Authenticated-only mutation endpoints** — `media` POST, `content` POST, `experiments` POST, `experiments/[id]/comments` POST, `comments` POST, `operations` POST
All check `session?.user?.id` only. Any Google-authenticated PUBLIC user can create these records. `operations` in particular looks like an internal CORE-only surface.
**Fix:** Add role gate appropriate to each (CORE for operations, CORE/MEMBER for content/media, at minimum).

**H7. Weak/inconsistent superadmin checks** — `experiments/[id]` PATCH, `applications` GET, `admin/public-users` GET
These use `permissions['*'] === 'FULL_ACCESS'` inline instead of `hasPermission()`. Not immediately exploitable, but the codebase has two different semantics for superadmin and they will drift. Plus `members/[id]/tags` PUT uses `permissions['default'] === 'WRITE'` which is almost certainly wrong — `default` isn't a resource name.
**Fix:** Grep for `permissions\[` across `app/api/**` and replace every ad-hoc check with `hasPermission(permissions, resource, level)`.

**H8. `/api/profile` PATCH accepts `customFields: z.record(z.any())`** — `app/api/profile/route.ts`
Profile update has no role check and accepts an arbitrary JSON blob as `customFields`. If any server-side code reads specific keys out of `customFields` with trust, this becomes privilege escalation.
**Fix:** Replace `z.record(z.any())` with a concrete schema of known keys. At minimum, reject keys like `role`, `permissions`, `email`, `id`.

**H9. `/api/settings` PATCH has no key allowlist** — `app/api/settings/route.ts:42-50`
Any CORE user can upsert any key into `SystemSettings`. Some of these keys drive feature flags read elsewhere — this is a configuration-injection vector.
**Fix:** Hardcode the allowed setting keys in a const and reject unknown keys.

---

### MEDIUM

**M1. CSRF on custom `/api/*` routes** — NextAuth's CSRF cookie only protects `/api/auth/*`. Custom mutating routes rely entirely on `sameSite=lax`. Lax allows top-level cross-site GETs and some `<form>` POSTs with `application/x-www-form-urlencoded`. Since routes expect JSON, browser preflight would typically block it — but worth explicit CSRF tokens on CORE-only mutations. Not exploitable today as far as I can see, but close to the line.

**M2. `/api/bounty/reset` DELETE** — `app/api/bounty/reset/route.ts:8-20` — checks `role === 'CORE'` but not `bounty: FULL_ACCESS`. Any CORE user (even with only `bounty:READ`) can wipe bounty state.
**Fix:** `hasPermission(permissions, 'bounty', 'FULL_ACCESS')`.

**M3. `/api/auth/check-validity`** — returns `valid:true` before checking `deletedAt`/`status`. A soft-deleted member still looks valid.
**Fix:** Reorder checks; reject on `deletedAt != null || status !== 'active'`.

**M4. `data-grid/[id]` DELETE does hard delete** — `app/api/data-grid/[table]/[id]/route.ts:71` — schema uses `deletedAt` soft delete elsewhere. Inconsistent and unrecoverable.
**Fix:** Use `{ data: { deletedAt: new Date() } }` instead of `prisma.delete`.

**M5. Rate limiter fails open** — `lib/rate-limit.ts:87` — if Postgres throws, the limiter returns `allowed: true`. An attacker who exhausts DB connections bypasses all rate limits (the login/enumeration ones especially).
**Fix:** Fail closed on DB error for sensitive endpoints, log loudly.

**M6. Cron routes have no rate limit** — `app/api/cron/cleanup` does destructive file cleanup. If `CRON_SECRET` leaks (it's a long-lived env var), an attacker can hammer the endpoint.
**Fix:** Rate-limit by IP even with valid secret.

**M7. `react-markdown` rendering guide bodies without sanitization** — `components/guides/GuideDetail.tsx` — stored content from guide bodies is rendered as markdown. Depending on plugins, stored XSS is possible. Separate from auth but flagged because the IDOR on guides PUT means any user can plant XSS in any guide.

**M8. `customEmailBody` on application approval emails** — `app/api/applications/[id]/route.ts:55-70` and `lib/email.ts:222` — HTML is `.trim()`ed then interpolated raw into the email template. Only superadmin can send it, but there's no reason not to sanitize.
**Fix:** `sanitize-html` with a small allowlist.

---

### LOW

- **Session maxAge = 30 days** — `lib/auth-options.ts:170`. Consider 7d + refresh.
- **`sameSite: 'lax'`** — fine, note for awareness. `'strict'` would be stricter.
- **CSP has `'unsafe-inline'`** for scripts in prod — `next.config.ts:34`. Reduces XSS defense-in-depth.
- **Encrypted offline session KDF** — `lib/encryptedSession.ts:33` uses hardcoded salt `'team1-pwa-salt'`. Not a server auth issue but weak crypto hygiene.
- **`/api/push/vapid-key` GET** is public (fine — it's a public key, by design).

---

## Items needing clarification

1. **Is auto-provisioning PUBLIC users on first Google sign-in intentional?** If Team1India is a curated community, you likely want an email allowlist in the `signIn` callback and `return false` for unknown emails. This single change massively shrinks the blast radius of every "authN only, no authZ" finding above. If it's intentional so public users can submit to public bounties, fine — but then the PUBLIC role must be treated as fully untrusted, which it currently isn't.

2. **Was `app/proxy.ts` ever working?** It might be a file from a Next.js 12/13 pages-router mental model. Renaming it to `middleware.ts` at project root would light up the edge-layer protections — but it would also change observable behavior for code that currently "works" because the edge isn't running. Worth checking whether anything depends on the current unprotected state before flipping it.

3. **`/api/admin/send-email`** — is this used by anything, or dead? It has hardcoded recipients, no auth, and looks like a prototype. Easiest fix is deletion if unused.

4. **Cron secret** — is `CRON_SECRET` set in Vercel production env and is it a strong random value? Cron routes depend entirely on it.

---

## Recommended fix order

1. **C1** — rename `app/proxy.ts` → `middleware.ts` (one line, massive coverage) *after* confirming nothing regresses
2. **C2, C3** — add auth to `/api/upload/token` and `/api/admin/send-email` (or delete the latter)
3. **C5** — fix the `getServerSession()` missing-arg bug in all `/api/push/*` routes (mechanical)
4. **C4** — add Zod whitelist schemas to `/api/data-grid/[table]` POST/PATCH — clearest privilege-escalation path
5. **H1** — email allowlist in `signIn` callback if curated membership is intended
6. **H2** — IDOR cluster (guides, media, operations) — same fix pattern, one PR
7. **H3, H4, H5, H6, H8, H9** — add role/permission gates to the "authN-only" routes
8. Clean up **H7** inconsistencies in a follow-up
9. Mediums as time allows

---
---

# Part 2 — Secrets Management & Crypto Misuse Audit

Scope: hardcoded secrets, secret leakage (logs/responses/client bundle), weak randomness, weak/obsolete crypto, timing-safe comparisons, TLS disabling, and missing env var validation.

## Summary of what's clean

- **No hardcoded API keys** anywhere in source. Greps for `sk_live_`, `AIza`, `ghp_`, `SG.`, `xoxb-`, `AKIA`, `-----BEGIN`, `postgres://`, `mysql://`, `mongodb://`, literal JWTs, and literal bearer tokens all came back clean.
- **No `.env*` committed.** `.gitignore` lists `.env*` and `git ls-files` shows none tracked.
- **No MD5/SHA1** used for auth/token/integrity purposes.
- **No deprecated `createCipher`** (would default to weak key derivation). AES-GCM with proper random IV is used in `lib/encryptedSession.ts:105` — IV generation is correct (`crypto.getRandomValues(new Uint8Array(12))`), per-encryption.
- **No `rejectUnauthorized: false`** in any TLS client. No `NODE_TLS_REJECT_UNAUTHORIZED=0` reference.
- **No custom password hashing.** No `bcrypt`/`argon2`/`scrypt` in `package.json` either — which is correct, because the app has NO passwords (Google OAuth only). Any password-hashing code would be a red flag; there is none.
- **No third-party crypto libs** (`crypto-js`, `node-forge`, etc.) — code uses Node.js built-in `crypto` and Web Crypto `subtle` API, which is the right call.
- **JWT signing** is handled by NextAuth using HS256 with `NEXTAUTH_SECRET`. No `alg: none`, no `localStorage` token storage for the NextAuth session (it's an httpOnly cookie).

## Findings

### CRITICAL

**CR1. Cron cleanup route fails OPEN when `CRON_SECRET` env var is missing** — `app/api/cron/cleanup/route.ts:10`
```ts
if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
}
```
If `CRON_SECRET` is unset (or empty string), the guard short-circuits and **anyone on the internet can call this endpoint**, which then runs `prisma.announcement.deleteMany(...)` and `del(...)` on Vercel Blob files. The sibling route `app/api/cron/sync-events/route.ts:9` has the correct logic (`if (!process.env.CRON_SECRET || authHeader !== ...)`), confirming the inconsistency is a bug, not a design.
**Exploit impact:** Unauthenticated destructive endpoint: delete expired announcements + delete Vercel Blob files. Only requires `CRON_SECRET` to be absent from the env — which is the typical state during a misconfigured deploy or a new preview environment.
**Fix:**
```ts
const secret = process.env.CRON_SECRET;
if (!secret || authHeader !== `Bearer ${secret}`) {
  return new NextResponse('Unauthorized', { status: 401 });
}
```
Better still, use `crypto.timingSafeEqual` (see CR2).

**CR2. Offline-session encryption key is derived from a predictable device ID + static salt** — `lib/encryptedSession.ts:33` and `:154`
Two problems compound:
- **Line 33:** `salt: new TextEncoder().encode('team1-pwa-salt')` — hardcoded PBKDF2 salt. Same salt for every user, every device.
- **Line 154:** `deviceId = \`device-${Date.now()}-${Math.random().toString(36).substr(2, 16)}\`` — the device ID that acts as the PBKDF2 password is built from a timestamp + `Math.random()`. `Math.random()` is not cryptographic; V8's xorshift128+ state can be recovered from a handful of samples. The timestamp narrows it further.

The derived AES-GCM key encrypts offline session tokens (`accessToken`, `refreshToken`) in `sessionStorage`. If an attacker can read sessionStorage (via an XSS, a malicious browser extension, or device access), they can decrypt it trivially — and because the salt is static and the password has ~60 bits of weak entropy, even without reading the "password" directly, an offline brute force is cheap.
**Exploit impact:** The offline session encryption offers essentially no protection beyond obscurity. Stored `accessToken`/`refreshToken` should be treated as plaintext.
**Fix:**
```ts
// Line 154 — use cryptographic RNG:
deviceId = `device-${crypto.randomUUID()}`;

// Line 33 — generate a random salt once and persist it in localStorage
// alongside the device-id (still not a secret, but no longer precomputable):
let saltB64 = localStorage.getItem('session-salt');
if (!saltB64) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  saltB64 = btoa(String.fromCharCode(...salt));
  localStorage.setItem('session-salt', saltB64);
}
const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
```
Honestly, if this offline session feature isn't actively used, consider deleting `lib/encryptedSession.ts` entirely — storing bearer tokens in browser storage is a well-known antipattern and the NextAuth httpOnly cookie already handles session persistence correctly.

### HIGH

**H10. Webhook URLs exposed to the client bundle** — `lib/alertNotifications.ts:32, 41, 50`
```ts
if (process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL) { ... }
if (process.env.NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT) { ... }
if (process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL) { ... }
```
Anything prefixed `NEXT_PUBLIC_` is inlined into the JavaScript bundle shipped to every visitor. Slack incoming-webhook URLs are effectively bearer tokens — possession of the URL lets you post any message to the channel. Same threat model for the other two.
**Exploit impact:** Anyone who views the compiled JS (trivial — open DevTools) gets your Slack webhook and can post arbitrary messages, impersonate bots, or spam the alerts channel. Custom webhooks similar.
**Fix:** Move to server-only env vars (`SLACK_WEBHOOK_URL`, `ALERT_WEBHOOK_URL`) and call them from a server route. Never expose a webhook URL as `NEXT_PUBLIC_*`. For a client that needs to trigger an alert, POST to an internal `/api/alerts/report` route which forwards server-side.

**H11. Cron bearer token compared with `!==`** — `app/api/cron/cleanup/route.ts:10` and `app/api/cron/sync-events/route.ts:9`
Not a practical timing attack in most environments (network jitter dominates), but it's also trivial to fix and the code is already handling a secret. Do it right.
**Fix:**
```ts
import { timingSafeEqual } from 'crypto';
const expected = `Bearer ${secret}`;
const got = authHeader ?? '';
const ok = got.length === expected.length &&
  timingSafeEqual(Buffer.from(got), Buffer.from(expected));
if (!ok) return new NextResponse('Unauthorized', { status: 401 });
```

### MEDIUM

**M9. `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` default to empty string** — `lib/auth-options.ts:8-9`
```ts
clientId: process.env.GOOGLE_CLIENT_ID || "",
clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
```
An empty client secret doesn't "let any user log in" (Google rejects the token exchange), but it *does* mean the server boots, accepts requests, and fails auth silently with opaque errors instead of failing loudly at startup. Combined with the lack of startup env-var validation, a misconfigured deploy will present as "login is broken" rather than "required secret missing."
**Fix:** Remove the `|| ""` fallback, OR add a centralized startup check (see M11).

**M10. API routes leak `error.message` in responses** — `app/api/cron/cleanup/route.ts:~110`, `app/api/experiments/route.ts:73, 144`, `app/api/experiments/[id]/comments/route.ts:117`, `app/api/announcements/route.ts:175, 196`
Several routes return `NextResponse.json({ error: 'Internal Error', details: error.message })` or interpolate `error.message` directly. Prisma errors leak table/column names; other errors leak file paths and stack context.
**Exploit impact:** Information disclosure that helps shape follow-up attacks (DB schema discovery, infra fingerprinting).
**Fix:** In production, return a generic message and log the detail server-side:
```ts
console.error('route failed:', error);
const detail = process.env.NODE_ENV === 'production' ? undefined : String((error as Error)?.message);
return NextResponse.json({ error: 'Internal Error', detail }, { status: 500 });
```

**M11. No startup validation of required env vars** — whole app
`NEXTAUTH_SECRET`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `SMTP_PASSWORD`, `LUMA_API` are all referenced with no centralized presence check. Missing values manifest as runtime errors mid-request (bad UX) or — as in CR1 — as silent fail-open (security bug).
**Fix:** Add `lib/env.ts` that runs on import from `lib/auth-options.ts`, `lib/prisma.ts`, and the cron routes:
```ts
const REQUIRED = ['NEXTAUTH_SECRET','DATABASE_URL','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','CRON_SECRET'] as const;
for (const k of REQUIRED) {
  if (!process.env[k]) throw new Error(`Missing required env var: ${k}`);
}
```
Consider `zod` for a typed export.

**M12. SMTP `secure` flag inferred from port string** — `app/api/admin/send-email/route.ts:~12` and `lib/email.ts`
`secure: process.env.SMTP_PORT === '465'` — if `SMTP_PORT` is unset or set to anything other than exactly `'465'`, `secure` is `false`. For Gmail on port 587 this is fine (STARTTLS via `requireTLS`), but if someone sets the port to `465` as a number vs string, or misconfigures, the SMTP password could travel on an unencrypted channel.
**Fix:** Add an explicit `SMTP_SECURE` boolean env, or force `requireTLS: true` for 587.

### LOW

**L6. `VAPID_SUBJECT` hardcoded fallback leaks admin email** — `app/api/push/send/route.ts:~20`
`process.env.VAPID_SUBJECT || 'mailto:admin@team1india.com'`. Not a secret — a VAPID subject is public metadata sent with every push — but a hardcoded fallback shouldn't be the way to set it.
**Fix:** Read the value; error if missing. Don't hardcode.

**L7. Multiple weak-RNG IDs for non-security uses** — `lib/offlineAnalytics.ts:43`, `lib/crossTabSync.ts:28`, `lib/offlineStorage.ts:103`
All use `Date.now() + Math.random().toString(36)` patterns for analytics IDs and cross-tab sync IDs. Not exploitable on its own, but flag because the same developer mental model produced CR2. Switch to `crypto.randomUUID()` across the board so nobody copy-pastes the weak pattern into a security-sensitive spot later.

**L8. `signupIp` placeholder** — `lib/auth-options.ts:49`
`signupIp: "next-auth-signin"` is hardcoded because NextAuth `signIn` callback doesn't expose the request. Minor: the audit log field is misleading. Either get the IP via a server action wrapper or remove the field.

**L9. Verbose `console.log` in encryption module** — `lib/encryptedSession.ts:54, 82`
`console.log('🔐 Session saved (encrypted)')` / `'🔓 Session restored'` — doesn't log secrets themselves, but the logs track session lifecycle and may help an attacker with browser-console access understand state. Low; remove or gate on `NODE_ENV !== 'production'`.

---

## Environment variables referenced in code

| Var | Where | Fallback in code | Notes |
|---|---|---|---|
| `NEXTAUTH_SECRET` | NextAuth internals | none | Required; JWT signing key |
| `NEXTAUTH_URL` | `auth-options.ts`, `google-calendar.ts`, `notificationManager.ts` | `'http://localhost:3000'` in notificationManager | Required for OAuth redirect |
| `GOOGLE_CLIENT_ID` | `lib/auth-options.ts:8` | `""` | **Remove empty fallback (M9)** |
| `GOOGLE_CLIENT_SECRET` | `lib/auth-options.ts:9` | `""` | **Remove empty fallback (M9)** |
| `GOOGLE_REFRESH_TOKEN` | `lib/google-calendar.ts` | none | Required for calendar sync |
| `GOOGLE_HOST_EMAIL` | `lib/google-calendar.ts` | none | Required for calendar ops |
| `GOOGLE_REDIRECT_URI` | `lib/google-calendar.ts` | derived from `NEXTAUTH_URL` | OK |
| `DATABASE_URL` | Prisma | none | Required |
| `BLOB_READ_WRITE_TOKEN` | `app/api/upload/token/route.ts` | none | Required for Vercel Blob |
| `CRON_SECRET` | `api/cron/cleanup`, `api/cron/sync-events` | inconsistent (**CR1**) | Required; fail-open bug in cleanup |
| `LUMA_API` | `lib/luma.ts` | none | Required for Luma sync |
| `SMTP_HOST` | `lib/email.ts`, `admin/send-email` | `'smtp.gmail.com'` | OK |
| `SMTP_PORT` | same | `'587'` | See M12 |
| `SMTP_USER` | same | none | Required |
| `SMTP_PASSWORD` | same | none | Required |
| `SMTP_FROM_NAME` | same | `'Team1India'` / `'Team1 PWA Alerts'` | OK |
| `VAPID_PUBLIC_KEY` | `push/vapid-key`, `push/send` | none | Required |
| `VAPID_PRIVATE_KEY` | `push/send` | none | Required |
| `VAPID_SUBJECT` | `push/send` | `'mailto:admin@team1india.com'` | **L6** |
| `NEXT_PUBLIC_SLACK_WEBHOOK_URL` | `lib/alertNotifications.ts:32` | none | **H10 — should NOT be NEXT_PUBLIC** |
| `NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT` | `lib/alertNotifications.ts:41` | none | **H10** |
| `NEXT_PUBLIC_ALERT_WEBHOOK_URL` | `lib/alertNotifications.ts:50` | none | **H10** |
| `NEXT_PUBLIC_SENTRY_DSN` | `lib/pwaMonitoring.ts` | none | OK (Sentry DSNs are client-safe) |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | `lib/offlineAnalytics.ts` | none | OK if generic endpoint |
| `NEXT_PUBLIC_PWA_MONITORING_ENDPOINT` | `lib/pwaMonitoring.ts` | none | OK |
| `NEXT_PUBLIC_ADMIN_EMAIL` | `lib/alertNotifications.ts` | `'admin@team1india.com'` | Minor (email exposure) |
| `NEXT_PUBLIC_HERO_VIDEO_URL` / `_MP4` | `components/website/VideoPreloader.tsx` | asset paths | OK (intentional public) |

## Env vars that should exist but may be missing

None are hardcoded to literal secret values anywhere in source (the only literal fallbacks are hostnames/ports/emails, not credentials). The risk is not "hardcoded secrets we missed" — it's **silent degradation when secrets are absent**, most critically `CRON_SECRET` (CR1) and `GOOGLE_CLIENT_SECRET` (M9). Fix those + add M11 startup validation and you've closed the whole class.

## Crypto library inventory

| Library | Version | Usage | Correctness |
|---|---|---|---|
| `next-auth` | 4.x | JWT session (HS256 with `NEXTAUTH_SECRET`) | OK |
| `nodemailer` | 7.x | SMTP | OK, but see M12 for `secure` flag inference |
| `web-push` | 3.x | VAPID ECDSA | OK |
| `@vercel/blob` | 2.x | Blob storage | OK |
| Node `crypto` | builtin | Not directly used for secret comparison anywhere (see H11) | Underused — should be used in cron routes |
| Web Crypto `subtle` | builtin | `lib/encryptedSession.ts` AES-GCM + PBKDF2 | Primitives OK, inputs broken (CR2) |
| `bcrypt`/`argon2`/`scrypt` | — not installed — | correct: app has no passwords | N/A |
| `crypto-js`/`node-forge` | — not installed — | good | N/A |

---

## Updated fix order (secrets/crypto additions merged)

1. **CR1** — fix cron cleanup fail-open (one-line change, prevents unauth destructive calls). Mechanical.
2. **C1** from Part 1 — rename `app/proxy.ts` → `middleware.ts`.
3. **C2, C3** from Part 1 — auth on `/api/upload/token` and `/api/admin/send-email`.
4. **C5** from Part 1 — `getServerSession(authOptions)` in all `/api/push/*` routes.
5. **H10** — move Slack/webhook URLs off `NEXT_PUBLIC_*` (scan the built bundle to confirm removal).
6. **CR2** — fix or delete `lib/encryptedSession.ts` (easier to delete if unused).
7. **C4** from Part 1 — Zod whitelist on data-grid mass assignment.
8. **H11 + M11** — timing-safe cron comparison + centralized env validation in the same PR.
9. Remaining HIGHs and MEDIUMs from both parts.
10. LOWs as cleanup.

---
---

# Part 3 — Dependency & Supply-Chain Audit

Scope: `package.json` and `package-lock.json` at `/Users/sarnavo/Development/Team1India`. No `yarn.lock`/`pnpm-lock.yaml`, no `.npmrc`, no `.github/workflows/`.

## Summary of what's clean

- **Lockfile present and healthy** — `package-lock.json` v3, 13,577 lines, all `resolved` URLs are HTTPS (zero `http://` tarballs — no downgrade vector).
- **No wildcard versions.** No `*`, no `latest`, no git URLs, no `file:` paths, no GitHub tarballs. Every dep has a real semver range.
- **No dynamic `require()`.** Only one `require()` in the entire TS codebase — `next.config.ts:103` — and it's a static string (`"@ducanh2912/next-pwa"`). No `require(variable)`, no `import(variable)` with user input.
- **No known-abandoned security libs.** No `request`, `node-uuid`, `crypto-js`, `node-forge`, `jsonwebtoken` (next-auth v4 uses `jose` instead — modern), no `bcrypt` (no passwords to hash).
- **No typosquats.** Every dep is a legitimate, recognizable package. `@use-gesture/react`, `lenis`, `canvas-confetti`, `framer-motion`, `@blocknote/*`, `idb`, `clsx`, `tailwind-merge` — all real, all well-known.
- **Dev deps not leaking into runtime.** `eslint`, `typescript`, `tailwindcss`, `@types/*`, `dotenv` are correctly in `devDependencies`.
- **Install-lifecycle scripts limited to trusted packages.** Only `@prisma/client`, `@prisma/engines`, `prisma` (downloads query engine binary), `sharp` (native image codec), and `unrs-resolver` (ESLint native resolver) run install scripts. All first-party / well-known.

## Findings

### MEDIUM

**D1. `next-auth` v4 is in maintenance mode** — `package.json:34` — `"next-auth": "^4.24.13"`
Next-auth v4 receives security patches but no new features. The actively developed line is Auth.js v5 (`next-auth@beta` / `@auth/*`). 4.24.13 is current for the v4 line and there are no unpatched CVEs I can confirm, but you're on a sunsetting branch. Combined with the dead-middleware issue from Part 1, this is the layer to budget time for.
**Action:** Not urgent. Track the v5 migration; review Auth.js release notes quarterly. **Do not** float to `^5` via `npm update` — v5 is a breaking change.

**D2. `@ducanh2912/next-pwa` — single-maintainer build-time dependency** — `package.json:19` — `"@ducanh2912/next-pwa": "^10.2.9"`
This is the only third-party build-time dep that actually modifies `next.config.ts` at runtime (see `next.config.ts:103`). The original `next-pwa` was abandoned and `@ducanh2912/next-pwa` is a community fork with a single maintainer. It has ~150k weekly downloads so it's not obscure, but a single-maintainer package with build-time code execution is supply-chain exposure worth knowing about.
**Action:** Pin to exact version (`"10.2.9"` without `^`) so npm doesn't pull a compromised patch release silently. Periodically check GitHub for the maintainer status.

**D3. No CI / no enforced `npm ci`** — missing `.github/workflows/`
Vercel will run `npm install` (not `npm ci`) on deploys by default unless you configure the install command. `npm install` can mutate `package-lock.json` if a range allows a newer version, which defeats the point of having a lockfile. Without a CI workflow, there's also no pre-merge security gate.
**Action:**
1. In Vercel project settings, set Install Command to `npm ci`.
2. Add `.github/workflows/ci.yml` that runs `npm ci && npm audit --audit-level=high && npm run security-check` on PRs.

**D4. `npm run security-check` is broken on npm installs** — `package.json:13` — `"security-check": "bun lint && tsc --noEmit"`
The script invokes `bun`, but the project uses npm (has `package-lock.json`, no `bun.lockb`). On a dev machine without Bun installed, this script errors out immediately and the TypeScript check never runs. If CI ever calls this script, it will fail confusingly.
**Action:** Change to `"security-check": "npm run lint && tsc --noEmit"`.

### LOW

**D5. Missing `engines` field** — `package.json`
No `"engines": { "node": "..." }`. Vercel picks a default Node version that drifts over time; local dev machines may use mismatched versions, which is a class of "works on my machine" security bug (different TLS defaults, different crypto primitives).
**Action:** Add `"engines": { "node": ">=20.0.0 <23.0.0" }` matching your Vercel project's Node version.

**D6. No `.npmrc` with `ignore-scripts` option** — root
Not a must-have, but some shops set `ignore-scripts=true` and manually allowlist specific packages (Prisma, sharp) via `scripts-prepend-node-path` or a wrapper. Gives you defense-in-depth against a compromised transitive dep running a postinstall.
**Action:** Optional. Only worth it if you want to harden against a compromised non-Prisma/sharp transitive.

**D7. `@prisma/client` v5 (v6 is current)** — `package.json:20,37` — `"^5.22.0"`
Prisma 5.22 is the final 5.x minor; 6.x is current. v5 is still getting critical fixes but it's no longer the active branch. Not a security issue today.
**Action:** Plan a Prisma v6 migration (breaking: driver adapters + some query builder changes). Not urgent.

**D8. `^` ranges on security-sensitive libs** — `next-auth`, `zod`, `@prisma/client`, `web-push`, `nodemailer`, `next-pwa`
The caret means any future minor/patch inside the current major is accepted. With the lockfile this is fine for reproducibility — but only if the install command is `npm ci`, not `npm install` (see D3). If you lose the lockfile, you float.
**Action:** Keep the `^` ranges but enforce `npm ci` everywhere (D3). Consider `overrides` in `package.json` to pin transitive security deps if a CVE lands.

### Candidates to verify with `npm audit` (cannot confirm from static review alone)

I won't cite CVE numbers I can't verify. These are the packages with the largest transitive dep trees and the best historical CVE track records, and are worth watching when you run `npm audit`:
- **`next`** — historically CVEs around image optimizer SSRF, cache poisoning, and middleware bypasses. You're on 16.1.1 (current major). Run `npm audit` to confirm.
- **`next-auth` v4** — past CVEs around redirect handling (CVE-2022-36067, CVE-2022-23647, CVE-2023-48309). 4.24.13 is patched for all known CVEs but verify.
- **`nodemailer`** — had header-injection CVEs in the 6.x line; you're on 7.x which is current.
- **`web-push`** — generally clean; low-dependency package.
- **`framer-motion`** — recent majors had no known sec CVEs but has a large transitive tree.
- **Transitive deps pulled in by `@blocknote/*` and `eslint-config-next`** — both have deep trees, most historical npm audit noise lives here.

Run `npm audit --omit=dev` to focus on runtime and `npm audit` to see everything.

## Commands to run locally

```bash
# 1. Current vulnerability report (runtime deps only, the ones that ship)
npm audit --omit=dev

# 2. What's out of date relative to your ranges and latest
npm outdated

# 3. Reinstall from lockfile to verify reproducibility + get the `extraneous` check
rm -rf node_modules && npm ci && npm ls --all 2>&1 | grep -E 'UNMET|extraneous|invalid' || echo "lockfile clean"
```

Optional but worth it:
```bash
# Which packages run install-lifecycle scripts (should be short: prisma, sharp, and similar)
npm ls --all --json 2>/dev/null | node -e 'const j=JSON.parse(require("fs").readFileSync(0));function walk(n,p=""){if(!n||typeof n!=="object")return;for(const[k,v]of Object.entries(n.dependencies||{})){if(v.scripts&&(v.scripts.preinstall||v.scripts.install||v.scripts.postinstall))console.log(`${p}${k}`);walk(v,p+"  ")}}walk(j)'

# Static supply-chain check (free, no account)
npx --yes @cyclonedx/cyclonedx-npm --output-format JSON --output-file sbom.json
```

## Updated master fix order

Dependency items slot in alongside Part 1 + Part 2:

1. **CR1** (Part 2) — cron cleanup fail-open. One line.
2. **C1** (Part 1) — `app/proxy.ts` → `middleware.ts`.
3. **C2, C3** (Part 1) — auth on upload/token and admin/send-email.
4. **C5** (Part 1) — `getServerSession(authOptions)` in push routes.
5. **H10** (Part 2) — pull webhook URLs off `NEXT_PUBLIC_*`.
6. **D3 + D4** (Part 3) — set Vercel install command to `npm ci`, fix the `security-check` script. Low effort, unlocks CI-gating later.
7. **CR2** (Part 2) — fix or delete `lib/encryptedSession.ts`.
8. **C4** (Part 1) — Zod whitelist on data-grid mass assignment.
9. Remaining Highs / Mediums from all three parts.
10. Run `npm audit --omit=dev` as a recurring check (weekly or on every PR via CI once D3 is done).

---
---

# Part 4 — Business Logic & Abuse Review

Scope: race conditions, workflow bypass, client-supplied-value trust, user enumeration, fail-open defaults, and anti-automation gaps. This is bug-bounty thinking — each finding is an attacker narrative grounded in the code, not a style nit.

## Open domain questions (answer before shipping the fixes)

Logic bugs only matter if the business rule is actually a rule. These are the ones that shape severity:

1. **Is `totalXp` a real currency?** Does XP unlock anything — exclusive bounties, member tier, a future token drop, merchandise, community rewards? If yes, XP bugs are Critical. If it's purely cosmetic (leaderboard ranking and nothing else), they're Medium.
2. **Who approves bounty submissions?** Any CORE user, or a specific "reviewer" role? The code currently trusts any CORE user. Is that intended?
3. **Can one person be both a `CommunityMember` and a `PublicUser`?** (Same Google account, existed as PublicUser first, later promoted to CommunityMember — does the PublicUser row get deleted, or do both rows coexist with different IDs?)
4. **Is the consent flow load-bearing?** NextAuth auto-creates `PublicUser` with `consentLegal: false`. Does anything in the app actually gate behavior on `session.user.consent`, or is consent just recorded and ignored afterwards?
5. **Does the playbook editor send a heartbeat to refresh its 5-minute lock?** The server comment says "heartbeat" but the route doesn't expose one — I want to know if the client actually calls lock every few minutes or if editors just silently lose their lock mid-edit.
6. **Is `/api/public/check-member` used for the signup form** ("Are you already a member?") or for something else? Determines how much data it's allowed to return.

I'll flag findings' severity assuming XP is a real economy and consent is load-bearing. Downgrade where that turns out to be false.

---

## Findings

### CRITICAL

**L1. XP double-credit via concurrent approval** — `app/api/bounty/submissions/[id]/route.ts:40-63`

The approval flow is:
```ts
const submission = await prisma.bountySubmission.findUnique({ where: { id }, include: { bounty: true } });
if (submission.status !== 'pending') return 409;                       // check
const updated = await prisma.bountySubmission.update({...});            // write 1
if (status === 'approved' && submission.submittedById) {
  await prisma.communityMember.update({
    where: { id: submission.submittedById },
    data: { totalXp: { increment: xpAwarded } }                         // write 2
  });
}
```

No transaction, no conditional update. The `status !== 'pending'` check and the two writes are separated by `await`s. A reviewer who double-clicks Approve, or two reviewers clicking at the same moment, or a single attacker firing two PATCHes in parallel from a script, all land in the same race window: both requests pass the `pending` check, both UPDATE the submission row, and both run the `totalXp: { increment: xpReward }` increment. The increment itself is atomic in Postgres, so XP is credited **twice**.

**Attacker narrative:** A CORE user (or a bribed/compromised one) wants to inflate their own submission's XP. They PATCH `/api/bounty/submissions/{id}` with `status: approved` N times in parallel via `curl` or `fetch`. Each request that races through the `pending` check credits the XP reward again. If `xpReward = 500`, 10 parallel requests → 5,000 XP on a 500-XP bounty. Repeat across their own submissions, climb the leaderboard, claim any XP-gated rewards.

**Compounds with C4 (Part 1):** even without the race, a CORE user with `members:WRITE` can reset a submission's status via `/api/data-grid/bountySubmissions/[id]` PATCH (mass assignment) back to `pending` and approve it again. Infinite loop.

**Fix:** Use a conditional update and only award XP if the update actually transitioned the row:
```ts
const result = await prisma.bountySubmission.updateMany({
  where: { id, status: 'pending', deletedAt: null },
  data: {
    status,
    reviewNote: reviewNote || null,
    xpAwarded: status === 'approved' ? xpAwarded : null,
    reviewedById: reviewerId,
    reviewedAt: new Date(),
  }
});
if (result.count === 0) {
  return NextResponse.json({ error: "Submission already reviewed" }, { status: 409 });
}
// Only now, after a guaranteed successful state transition, award XP:
if (status === 'approved' && submission.submittedById) {
  await prisma.communityMember.update({
    where: { id: submission.submittedById },
    data: { totalXp: { increment: xpAwarded } }
  });
}
```
Better: wrap both writes in `prisma.$transaction` so a crash between them doesn't leave a "approved with no XP" state.

**L2. Bounty submission deduplication is TOCTOU** — `app/api/bounty/submissions/route.ts:107-137`

```ts
const existing = await prisma.bountySubmission.findFirst({
  where: { bountyId, submittedById: userId, deletedAt: null }
});
if (existing) return 409;
// ... (await on session, await on bounty lookup happened earlier too)
const submission = await prisma.bountySubmission.create({ data: submissionData });
```

Same pattern: check-then-create across an `await`. Two parallel POSTs both see no existing row, both insert. The user ends up with two pending submissions on the same bounty. When a reviewer approves one, nothing stops them from approving the second too — and combined with L1, both can double-credit. Net: 4× XP per bounty with minimal effort.

I did not find a `@@unique([bountyId, submittedById])` or `@@unique([bountyId, publicUserId])` constraint in `prisma/schema.prisma`. **Verify.** If they exist, Postgres will reject the duplicate and L2 downgrades to Medium (error handling only). If they don't, it's Critical.

**Attacker narrative:** Member writes a loop that POSTs the same submission 50 times with `Promise.all`. They end up with 50 pending rows. Admin skims the reviews, approves the batch. XP credited 50×.

**Fix:**
1. Add unique constraints in `schema.prisma`:
```prisma
@@unique([bountyId, submittedById], map: "unique_member_submission")
@@unique([bountyId, publicUserId], map: "unique_public_submission")
```
2. Catch Prisma `P2002` in the handler and return 409.
3. Remove the now-redundant `findFirst` check (or keep it for a nicer error message, with the unique constraint as backstop).

---

### HIGH

**L3. Playbook lock is TOCTOU → lost-update on the playbook itself** — `app/api/playbooks/[id]/lock/route.ts:23-54`

```ts
const playbook = await prisma.playbook.findUnique({ where: { id }, include: { lockedBy: true } });
// ... compute isLocked based on age + locker identity ...
if (isLocked) return 409;
await prisma.playbook.update({ where: { id }, data: { lockedById: user.id, lockedAt: new Date() } });
```

Two CORE users hit Edit at the same moment. Both `findUnique` see the lock as free (or expired). Both call `update`. Postgres serializes the updates, so the second one wins — but **both clients receive `{success: true}`**. Both now believe they own the lock. Whoever hits Save second silently overwrites the first editor's changes. This is the classic lost-update bug.

Additionally: the file comment says "5 minute heartbeat" but this route is the only lock-related endpoint. If the client doesn't call `lock` every <5 min while editing, the lock expires while the editor is still typing, another editor steals it, and the first save blows away the second editor's work in the other direction.

**Attacker narrative:** Two editors. A malicious editor watches the playbook list, sees when someone else starts editing, waits 5 minutes (knowing about the timeout), then hits Edit. Their lock succeeds because the timeout expired (even though editor #1 is still typing). Editor #1 saves — silently overwritten by editor #2 a moment later. Or vice versa.

**Fix:** Conditional update using `updateMany` with a predicate:
```ts
const now = new Date();
const lockCutoff = new Date(now.getTime() - LOCK_TIMEOUT_MS);
const result = await prisma.playbook.updateMany({
  where: {
    id,
    OR: [
      { lockedById: null },
      { lockedById: user.id },
      { lockedAt: { lt: lockCutoff } },
    ],
  },
  data: { lockedById: user.id, lockedAt: now }
});
if (result.count === 0) {
  return NextResponse.json({ success: false, lockedBy: /* refetch */ }, { status: 409 });
}
```
And implement a real heartbeat endpoint (or have the editor call `lock` every 60s) so long editing sessions don't lose the lock.

**L4. Rate limiter is itself TOCTOU, and the sliding window is fake** — `lib/rate-limit.ts:39-81`

Two bugs in one function:

- **TOCTOU:** The code does `findUnique` → check `count >= limit` → `update { increment: 1 }`. Both the check and the increment happen in separate round-trips, across an `await`. N concurrent requests all see `count` < `limit`, all pass the check, all increment. Effective limit is `limit + N - 1` instead of `limit`.
- **Fake sliding window:** Line 32 computes `windowStart = now - windowMs` and then **never uses it**. The actual logic resets `count` to 1 when `record.resetAt < now` — that's a fixed window, not a sliding window. An attacker times bursts against the window boundary: send `limit` requests at T=0, another `limit` at T=windowMs-ε, get `2×limit` through in a tiny time slice.

Combine with the already-flagged **fail-open on DB errors** (`catch → allowed: true` at line 87): an attacker who hammers the DB with slow queries can make the rate limiter return `allowed: true` for every request while the DB is struggling.

**Attacker narrative:** For `/api/public/check-member` (30/hour limit), fire `Promise.all([...30×...])` at T=0 — all pass TOCTOU and go through. Wait ~59 minutes, fire another 30 at T=3600s-ε, then another 30 at T=3600s+1. All 90 land in a ~1s window. Scale across a few residential proxy IPs and you can enumerate the entire member directory in an afternoon.

**Fix:** Atomic conditional update:
```ts
const result = await prisma.rateLimit.updateMany({
  where: { key, count: { lt: limit }, resetAt: { gt: BigInt(now) } },
  data: { count: { increment: 1 } }
});
if (result.count === 0) {
  // Either over limit or window expired. Check which and maybe reset.
  // (full logic omitted — use an upsert with a `WHERE count < limit` guard)
}
```
Better: switch to Upstash Redis (serverless-native) with `INCR` + `EXPIRE`, which is genuinely atomic and doesn't need a lockfile. Remove `windowStart` (unused). Make the DB-error path fail **closed** for the sensitive endpoints (`check-member`, `applications`, `bounty/submissions`) and fail-open only for non-sensitive reads.

**L5. User enumeration via `/api/public/check-member` returns more than boolean** — `app/api/public/check-member/route.ts:61-108`

Endpoint returns `{ isMember: true, name, role, tags }` given any of email / Twitter handle / Telegram / Discord. Rate limit is 30/hour per IP (and the limiter has L4 above).

**Enumeration 1 — direct:** Given a leaked email list (e.g. from HaveIBeenPwned or a breached forum), an attacker POSTs each email and learns: (a) whether they're in Team1India at all, (b) CORE vs Community tier, (c) name, (d) tags. Tags often encode internal classifications ("partner", "advisor", "dev-rel"). That's a high-quality target list for phishing.

**Enumeration 2 — Discord substring:** Line 94-96 uses `string_contains: cleanDiscord` as a JSON-path match. This is a **substring** match, not equality. An attacker sends `discord: "a"` → matches the first community member whose discord handle contains `"a"` → returns name and role. Iterate bigrams, trigrams, and short fragments, and map the entire community member list back to Discord handles. Faster than the rate limit allows per-IP, sure, but achievable with rotation.

**Attacker narrative:** Attacker obtains a list of 10k emails from a tech conference mailing list breach. Runs a script through Tor with IP rotation, hits `check-member`, and gets back a list of every Team1India member on that mailing list with name + tags. Uses the tags to identify high-value targets ("advisor", "core-team") and sends spearphishing emails referencing Team1India context.

**Fix:**
- **Return only `{ isMember: boolean }`.** Drop `name`, `role`, `tags` from the response entirely. The signup form doesn't need to show the matched user's name — it only needs to route them to the right onboarding flow.
- **Discord path: use `equals`, not `string_contains`:**
  ```ts
  where: { customFields: { path: ['discord'], equals: cleanDiscord } }
  ```
- **Lower the rate limit** to something like 10/hour, and key on IP + body hash to stop substring crawling from the same IP.

**L6. Consent bypass: `PublicUser` auto-created with `consentLegal: false` but consent is never checked on writes**

`lib/auth-options.ts:58-73` — any Google user becomes a `PublicUser` with `consentLegal: false`, `consentNewsletter: false`. The JWT callback at line 135 propagates `consent: publicUser.consentLegal` → `session.user.consent = false`.

Grepping the API routes, I can't find any handler that checks `session.user.consent` before accepting a write. `/api/bounty/submissions` POST doesn't check. `/api/experiments` POST doesn't check. `/api/comments` POST doesn't check. `/api/applications` POST doesn't check.

**Attacker narrative:** User signs in with Google. The app shows a consent modal. User closes the modal / navigates away / disables JavaScript / uses DevTools to dismiss it. From the server's perspective they have `consent: false`, but they can still POST to every write endpoint. The app is now collecting personal data (comments, contributions, submissions, profile fields) on a user who has never consented. If this platform has GDPR/DPDP obligations, every such write is a regulatory violation.

**Fix:** Add a single helper `requireConsent(session)` that returns `403 { error: "consent_required" }` if `!session.user.consent`, and call it from every write route except the consent submission endpoint itself. Better yet, check it in the (fixed) middleware.

---

### MEDIUM

**L7. `proofUrl` is any URL** — `app/api/bounty/submissions/route.ts:10`
`proofUrl: z.string().url()` accepts any URL. When a CORE reviewer clicks a submitted proof, they're taken to arbitrary attacker-controlled content. That's a phishing/drive-by vector in the reviewer UI, not directly a logic bug — but it's leveraged by the workflow ("reviewers click submitted links"). Plus: the URL could be a webhook the attacker uses to detect when a reviewer opens it ("tracking pixel for admins").
**Fix:** Allowlist `x.com`, `twitter.com`, `github.com`, `t.me`, `youtube.com`, `warpcast.com` and a handful of known-good domains. Reject everything else. Or at minimum require an `http://` / `https://` scheme, reject credentialed URLs, and add `rel="noopener noreferrer nofollow"` + an interstitial page when reviewers click.

**L8. Playbook unlock races** — `app/api/playbooks/[id]/unlock/route.ts:23-48`
Same TOCTOU as L3 but inverted. Two concurrent force-unlocks both see an expired lock, both update. Harmless in isolation, but the subsequent lock race (L3) is worse because now both believe they own the newly-acquired lock.
**Fix:** conditional `updateMany` like L3.

**L9. Bounty audience role is trusted but users can hold two identities** — `app/api/bounty/submissions/route.ts:100-137` + `lib/auth-options.ts:95-137`
The auth cascade is Member → CommunityMember → PublicUser. If someone is signed up as a PublicUser (they logged in to browse), then later gets promoted to CommunityMember (their email is added to the `CommunityMember` table), the **PublicUser row is not deleted** (I didn't see any cleanup in `signIn` callback). Now they have two identity rows with different IDs. On their next login, the JWT resolves as MEMBER (cascade finds CommunityMember first). But the dedup check in `/api/bounty/submissions` POST only checks `submittedById: userId` — it has no idea about the stale `publicUserId` row for the same human.

**Attacker narrative:** A user submits to public bounty X as a PublicUser. Later they're promoted to CommunityMember. The public bounty is still open. They sign in, now they're a MEMBER — but the public bounty targets `audience: 'public'`, so the audience check (line 101) rejects them. Hmm — that actually blocks the attack on *this* specific route. But if a member bounty X' exists with the same proof (or a public bounty switches audience), the two identity rows create consistency gaps. **Flagging as medium pending answer to question #3.**

**Fix:** On promoting a PublicUser to CommunityMember, soft-delete or re-key the PublicUser row. Or: add a `linkedUserId` on both tables to make the connection explicit.

**L10. `check-validity` endpoint returns role before checking soft-delete** — `app/api/auth/check-validity/route.ts` (Part 1 finding repeated from a logic angle)
A soft-deleted CORE user (status: inactive or deletedAt: set) can still call `check-validity` and get `valid: true` + role metadata. The JWT was issued before deletion and lives 30 days. They retain all CORE access for up to 30 days after being "removed" from the team.
**Attacker narrative:** Core contributor is off-boarded by `deletedAt` soft-delete. Their JWT is still valid for 30 days. They log in on a new browser (still have the Google account), NextAuth reissues a JWT, the `jwt` callback in auth-options resolves their email to the Member row — which is soft-deleted, but the `findFirst` at line 95 doesn't filter on `deletedAt: null`. They're reissued a fresh CORE JWT. Termination is a no-op.
**Fix:** Every identity lookup in `auth-options.ts` (lines 18, 29, 39, 95, 110, 125) must include `deletedAt: null` and `status: 'active'`. And consider cutting session `maxAge` to 24h so tokens rotate against the DB.

**L11. No rate limit on bounty submission POST** — `app/api/bounty/submissions/route.ts:69`
No `withRateLimit` call in the POST handler. Combined with L2 (TOCTOU dedup), a member can script thousands of pending submissions to the same bounty.
**Fix:** `await withRateLimit(5, 60 * 1000)(request)` at the top of POST. Fix L4 first so the limiter is actually atomic.

**L12. Applications POST deduplication** — `app/api/applications/route.ts` (briefly scanned earlier)
Rate-limited 3/hour per IP. That stops casual abuse but: no uniqueness check per guide, so one user can submit to the same guide as many times as the rate limit allows. Combined with the H5 object-spread-overrides-trusted-fields bug (Part 1), a hostile applicant can spray applications with forged names/emails into the admin inbox.
**Fix:** Add `@@unique([guideId, submittedByUserId])` or apply server-side dedup by (guideId + session email) in handler.

---

### LOW / INFORMATIONAL

**L13. `/api/members/check-email` and `/api/auth/check-validity` are enumeration helpers** — already flagged in Part 1 as missing rate limits. From a logic angle: the existence of these endpoints is intended (signup flow), but the response should be `200 { exists: false }` on both hit and miss to remove the timing/shape difference. Currently `check-email` returns different shapes, and `check-validity` returns different fields.

**L14. `experiments/[id]` stage transitions are not enforced as a state machine** — `app/api/experiments/[id]/route.ts` PATCH
The PATCH accepts any new `stage` value. There's no rule that a stage can only move forward, only the superadmin check. An attacker (or buggy client) can push an experiment backwards from "live" to "draft". If the `stage` field drives any access rules (e.g. "only live experiments are visible on the member page"), moving an experiment to `draft` hides it from everyone.
**Fix:** Whitelist the allowed transitions: `draft→review→approved→live→archived`, reject the rest.

**L15. Playbook heartbeat collision in unlock** — `unlock/route.ts:31`
The force-unlock uses `> LOCK_TIMEOUT_MS`. The lock route uses `< LOCK_TIMEOUT_MS`. Edge case: exactly at the boundary, one route sees it as locked, the other as expired. Not exploitable, but a tell that the lock logic was hand-rolled without tests.

**L16. `bounty/reset` deletes submissions with no undo** — already in Part 1 (M2). Logic angle: even a non-malicious admin can nuke the entire XP economy with one click. There's no "are you sure" state machine, no tombstone, no audit trail requirement. For an XP-driven community, this is a single-operator foot-cannon.
**Fix:** Require a typed confirmation string (`DELETE ALL SUBMISSIONS`), write an AuditLog entry before the delete, and consider soft-deleting instead of hard-deleting.

---

## Priority reshuffle after logic findings

L1 (XP double-credit) and L2 (submission dedup TOCTOU) only matter if XP is a real economy — question #1 above. Assuming yes, updated top-of-list:

1. **CR1** (Part 2) — cron cleanup fail-open
2. **L1 + L2** — bounty XP race + dedup (fix together; also closes the exploit path for C4's mass-assignment self-escalation because XP can't be rewound cleanly)
3. **C1** (Part 1) — middleware file rename
4. **C2, C3** (Part 1) — upload/token and admin/send-email auth
5. **C5** (Part 1) — push routes `getServerSession(authOptions)`
6. **L4** — atomic rate limiter (unblocks L5 + L11 + existing rate-limit-gated routes)
7. **L5** — strip name/role/tags from check-member response
8. **L3** — playbook lock atomicity
9. **L6** — consent gate
10. **L10** — deleted-user auth revocation (`deletedAt: null` in auth-options lookups)
11. Everything else

The rest of the fix order from Parts 1–3 slots in after these, unchanged.

---

## Please answer the domain questions above before I open any fix PRs

The severity of L1, L2, L6, L9, and L16 all flip based on whether XP is a real economy and whether consent is load-bearing. I can start implementing the fixes that are unambiguous (CR1, L3, L4, L5, L10) without waiting — but the XP-race fix specifically depends on knowing whether you want `prisma.$transaction` semantics (slower, stronger) or just conditional update (faster, still correct). Let me know.
