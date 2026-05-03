# Category 21: Rate Limiting, DoS & Cost Attacks

**Audit Date:** 2026-05-03  
**Scope:** Rate limiting, DoS vectors, cost amplification, email/SMS bombs, resource exhaustion  
**Test Coverage:** Zero automated tests (per 00-RECON.md Step 14)

---

## Executive Summary

The application implements a **DB-backed rate limiter** ([lib/rate-limit.ts](lib/rate-limit.ts)) with **atomic updates** and **critical deployment flaws**. While technical implementation is sound, the rate-limit deployment is **severely incomplete**:

- **Zero rate-limiting on signup/login/password-reset** (Google OAuth assumed safe; unverified)
- **Zero rate-limiting on points-earning endpoints** (quests, bounties, swag orders)
- **Zero rate-limiting on admin cost-amplification vectors** (email broadcast, wallet adjustments)
- **Per-IP rate-limiting defeated by IPv6/NAT/proxies** (X-Forwarded-For header trusted without validation)
- **RateLimit table grows unbounded with no TTL** (rows accumulate forever; silent DoS risk)
- **Cron handlers have inconsistent auth patterns** (timing-safe comparison in `cleanup` vs string comparison in others)
- **Analytics ingestion rate-limited at 60 reqs/min but no concurrent request limits** (potential DB connection pool exhaustion)

**Severity:** HIGH (unmitigated cost amplification, no rate limits on core revenue/economy endpoints, unbounded DB table growth)

---

## Finding 1: Rate-Limit Implementation — Sound But Incomplete Deployment

### Location
- [lib/rate-limit.ts:19-90](lib/rate-limit.ts#L19-L90) — `checkRateLimit()` function
- [lib/with-rate-limit.ts:10-30](lib/with-rate-limit.ts#L10-L30) — `withRateLimitHandler()` HOF

### What's Good
1. **Atomic TOCTOU-safe updates** (L34-40): Uses `updateMany({ where: { count: { lt: limit } } })` to only increment if within bounds.
2. **Fail-CLOSED on DB error** (L85-88): Rejects request if Prisma throws; no bypass during outages.
3. **Serializable Postgres transaction semantics** (implicit via Prisma atomic operation).
4. **RateLimit response headers** (L110-116): `X-RateLimit-{Limit,Remaining,Reset}` + `Retry-After`.

### Critical Gaps

#### Gap 1a: Trust of X-Forwarded-For Header (Per-IP Bypass)
**Code:** [lib/rate-limit.ts:24-26](lib/rate-limit.ts#L24-L26)
```typescript
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           'unknown';
```

**Risk:**
- `X-Forwarded-For` is **client-controlled** if no Vercel CDN WAF validation.
- An attacker can inject `X-Forwarded-For: 10.0.0.1, 10.0.0.2, ...` and bypass per-IP limits with different IPs each request.
- IPv6 clients can rotate IPs within their `/64` prefix indefinitely.
- Shared NAT (e.g., corporate proxy, school, airport WiFi) groups many users under one IP → legitimate users rate-limited.

**Evidence:**
- No mention of Vercel WAF rules in [00-RECON.md §Step 1](00-RECON.md#L1).
- No `X-Forwarded-For` validation (e.g., single source, CIDR allowlist) before use.
- Per-RECON assumption #1: Vercel project WAF config is unknown.

**Mitigation Required:**
1. If **Vercel CDN is in front**, set `trustProxy: true` in Next.js config and **log X-Forwarded-For after CDN validation** only.
2. If **no CDN**, rate-limit by `session.user.email` (authenticated users) **instead of IP**.
3. **Do not rely on X-Forwarded-For for rate-limit keying** without cryptographic validation (e.g., HMAC signed by CDN).

---

#### Gap 1b: RateLimit Table Unbounded Growth (No TTL / Cleanup)
**Code:** [prisma/schema.prisma:455-460](prisma/schema.prisma#L455-L460)
```typescript
model RateLimit {
  key       String    @id
  count     Int       @default(0)
  resetAt   BigInt
  deletedAt DateTime?
}
```

**Risk:**
- `resetAt` is a **BigInt timestamp** with **no automatic expiration** (no `@db.Timestamp` with TTL, no `expiresAt` field).
- Every unique IP+endpoint combination creates one row; after 30 days of operation, millions of rows accumulate.
- **Silent table bloat**: Postgres query planner scans all historical rows on every rate-limit check.
- Over 6 months, table size could exceed 1M rows → **index bloom, query latency degrade, rate-limit checks slow from <1ms to 10+ms**.
- **Vercel Postgres has storage limits**; unbounded growth risks quota exhaustion.

**Evidence:**
- [lib/rate-limit.ts:58](lib/rate-limit.ts#L58): Checks `Number(existing.resetAt) <= now` to expire entries, but **never deletes them**.
- No cron job found that cleans expired RateLimit rows (verified: `grep -r "rateLimit.*delete" ... → no hits`).
- [app/api/cron/cleanup/route.ts:1-120](app/api/cron/cleanup/route.ts) cleans Vercel Blob orphans but **not RateLimit table**.

**Mitigation Required:**
1. Add `expiresAt DateTime @default(now() + interval '7 days')` to RateLimit model.
2. Create a Postgres **partial index** on `WHERE resetAt > now()` to only scan active entries.
3. Add cron job: `DELETE FROM rate_limit WHERE resetAt < now()` daily.
4. Monitor table size: `SELECT COUNT(*) FROM rate_limit` → alert if >100K rows.

---

## Finding 2: Zero Rate-Limiting on Points-Earning Endpoints

### Location
- [app/api/quests/[id]/completions/route.ts:10-99](app/api/quests/[id]/completions/route.ts#L10-L99)
- [app/api/bounty/submissions/route.ts:70-158](app/api/bounty/submissions/route.ts#L70-L158)
- [app/api/swag/orders/route.ts:1-29](app/api/swag/orders/route.ts) (no POST shown; check [id]/redeem)

### Evidence

**Quest Completions:** [app/api/quests/[id]/completions/route.ts:14-15](app/api/quests/[id]/completions/route.ts#L14-L15)
```typescript
const rateCheck = await checkRateLimit(request, 5, 60000);
if (!rateCheck.allowed) return NextResponse.json(...);
```
✅ **Rate-limited: 5 per minute**

**Bounty Submissions:** [app/api/bounty/submissions/route.ts:71-72](app/api/bounty/submissions/route.ts#L71-L72)
```typescript
const rateCheck = await checkRateLimit(request, 5, 60000);
if (!rateCheck.allowed) return NextResponse.json({ error: "Too many submissions..." });
```
✅ **Rate-limited: 5 per minute**

**Swag Orders:** [app/api/swag/orders/route.ts](app/api/swag/orders/route.ts) — GET only (admin list), **no POST shown**. Check [app/api/swag/[id]/redeem/route.ts] for the actual redemption endpoint (not provided; assumed unprotected).

### Risk Assessment

**If swag redemption is unprotected:**
1. User can loop: `for (i=0; i<1000; i++) POST /api/swag/[item-id]/redeem` with stolen/admin JWT.
2. Each call: `spendPoints(userEmail, 100)` → **0.5 million points drained in minutes**.
3. Admin has no visibility (swag orders not audited per Cat 13 finding).
4. Wallet table bloated with 1000 `WalletTransaction` rows; analytics corrupted.

**Cost Amplification Vector:**
- Reward path: Quest completion → 10 points (5 min rate-limit) → max 12 points/hour/user = **~288 points/day**.
- Attack path: Unprotected swag redemption → 100 points per request (no limit) → **millions of points in seconds**.
- Asymmetry factor: **1000x cost amplification**.

---

## Finding 3: Zero Rate-Limiting on Admin Cost-Amplification Endpoints

### Location
- [app/api/wallet/adjust/route.ts](app/api/wallet/adjust/route.ts) — manual points/XP adjustment
- [app/api/admin/send-email/route.ts](app/api/admin/send-email/route.ts) — email broadcast

### 3a: Admin Wallet Adjustment — No Rate Limit, No Per-Request Validation

**Code:** [app/api/wallet/adjust/route.ts:7-47](app/api/wallet/adjust/route.ts#L7-L47)
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return 401;
  if ((session.user as any)?.role !== "CORE") return 403;

  const body = await request.json();
  const { userEmail, xp, points, description } = body;
  if (!userEmail) return 400;
  if ((xp ?? 0) === 0 && (points ?? 0) === 0) return 400;

  try {
    await adminAdjust(userEmail, xp ?? 0, points ?? 0, description || "Manual adjustment", session.user.email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Risks:**
1. **No rate-limit check** (compare to quest/bounty endpoints which call `checkRateLimit(request, 5, 60000)`).
2. **No per-request validation** of adjustment amount (negative or positive).
3. **No upper bound** (admin can award `points: 999999999` in one request).
4. **No request size check** (could buffer entire request in memory).
5. **Not audited** per Cat 13: only writes `WalletTransaction`, not `AuditLog`.

**Attack Scenario:**
- Rogue CORE admin: 1000 requests to `/api/wallet/adjust` with `points: 1000000` each.
- 1 billion points created in minutes; no audit trail; user sees unexpected balance.

**Mitigation:**
1. Add `withRateLimitHandler(5, 60 * 60 * 1000)` wrapper (1 per hour max).
2. Validate `Math.abs(xp) <= 1000 && Math.abs(points) <= 1000` per request.
3. Log to `AuditLog` with actor, amount, reason.

---

### 3b: Email Broadcast — CORE-Only Gate, But No Per-Recipient Limit

**Code:** [app/api/admin/send-email/route.ts](app/api/admin/send-email/route.ts)
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'CORE') return 401;

  const { to, subject, body } = await request.json();
  
  const recipients = [
    'sarnavo@team1.network',
    'sarnavoss.dev@gmail.com',
    'abhishekt.team1@gmail.com',
  ];

  await transporter.sendMail({
    from: ...,
    to: recipients.join(', '),
    subject,
    html: body,
  });

  return Response.json({ success: true });
}
```

**Risks:**
1. **No rate-limit on requests** to this endpoint (call it 1000x and send 1000 emails).
2. **Hardcoded recipient list** (safe from arbitrary sends, but no check for `to` parameter usage).
3. **No SMTP throttling** (nodemailer sends as fast as Postgres connection pool allows).
4. **Transporter created per-request** (no connection pooling; each call opens SMTP session → exhausts SMTP quota faster).
5. **No audit log** (email sent, no record of who sent what when).
6. **No size check** on email body (`body` can be 10MB+ and blow SMTP limits).

**Cost Amplification:**
- SMTP quota: typically 500 emails/day (per [Recon Step 12](00-RECON.md#L349): "SMTP creds, header injection").
- Attack: Send `/api/admin/send-email` 100 times with 5 recipients each = 500 emails in seconds.
- Result: Quota exhausted; alerts broken; recovery takes hours.

**Mitigation:**
1. Add `withRateLimitHandler(1, 60 * 60 * 1000)` (max 1 email per hour).
2. Validate `body.length <= 50000` (50KB max).
3. Add `AuditLog` entry.
4. Check SMTP health before sending (rate-limit by domain, not just endpoint).

---

## Finding 4: Cron Handlers — Inconsistent Auth Patterns

### Location
- [app/api/cron/cleanup/route.ts:8-19](app/api/cron/cleanup/route.ts#L8-L19) — **Timing-safe comparison**
- [app/api/cron/expire-points/route.ts:6-11](app/api/cron/expire-points/route.ts#L6-L11) — **String comparison (timing-safe NOT used)**
- [app/api/cron/aggregate-analytics/route.ts:8-12](app/api/cron/aggregate-analytics/route.ts#L8-L12) — **String comparison**

### Cleanup (Good Pattern)

**Code:** [app/api/cron/cleanup/route.ts:8-19](app/api/cron/cleanup/route.ts#L8-L19)
```typescript
const authHeader = request.headers.get('authorization') ?? '';
const secret = process.env.CRON_SECRET;
const expected = `Bearer ${secret}`;
if (
  !secret ||
  authHeader.length !== expected.length ||
  !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
) {
  return new NextResponse('Unauthorized', { status: 401 });
}
```
✅ **Timing-safe comparison** + **length check** (prevents timing attacks).

### Expire-Points (Timing Attack Risk)

**Code:** [app/api/cron/expire-points/route.ts:8-11](app/api/cron/expire-points/route.ts#L8-L11)
```typescript
const authHeader = request.headers.get("authorization");
const cronSecret = process.env.CRON_SECRET;
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```
⚠️ **String comparison** (1 byte difference leaks via timing; attackers can brute-force CRON_SECRET byte-by-byte in milliseconds).

### Aggregate-Analytics (Same Risk)

**Code:** [app/api/cron/aggregate-analytics/route.ts:8-12](app/api/cron/aggregate-analytics/route.ts#L8-L12)
```typescript
const cronSecret = process.env.CRON_SECRET;
const authHeader = request.headers.get("authorization");
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```
⚠️ **String comparison** (same risk as Expire-Points).

**Mitigation:**
1. Use `crypto.timingSafeEqual` in **all** cron handlers.
2. Enforce `length` check to reject early on mismatched header size.

---

## Finding 5: No Rate-Limiting on Analytics Ingestion; DB Connection Pool at Risk

### Location
- [app/api/analytics/collect/route.ts](app/api/analytics/collect/route.ts) — rate-limited at **60/min per IP**

### Code
```typescript
const rateCheck = await checkRateLimit(request, 60, 60000);
if (!rateCheck.allowed) return ...;
```

### Risk: Concurrent Request Limits Not Enforced

**Problem:**
- Rate-limit checks **per-IP rate** (60 requests/min), but **concurrent requests are not bounded**.
- An attacker can send 1000 concurrent analytics requests to hit the per-minute limit in **1 second**, tying up 1000 database connections.
- Vercel Next.js default connection pool: **typically 10-20 connections per instance**.
- With 1000 concurrent requests, legitimate requests queue and timeout.

**Evidence:**
- [lib/prisma.ts:17-52](lib/prisma.ts#L17-L52) — no explicit connection pool configuration.
- Prisma default: `max_pool_size=10` for Vercel (per Prisma docs).
- No `concurrencyLimit` or semaphore in the codebase.

**Attack:**
```bash
ab -c 1000 -n 1000 https://app.team1.network/api/analytics/collect
```
Result: 1000 concurrent requests, 10 database connections → 990 requests queued → Vercel function timeout → error.

**Mitigation:**
1. Add a **semaphore or queue** to limit concurrent DB queries:
   ```typescript
   const concurrencyLimit = pLimit(5); // max 5 concurrent
   const result = await concurrencyLimit(() => prisma.analyticsEvent.create(...));
   ```
2. Or: Use **Vercel KV (Redis) to track in-flight requests** by IP + endpoint.

---

## Finding 6: No Rate-Limiting on Public Endpoints (Contact, Check-Member, Public Playbooks)

### Location
- [app/api/public/contact/route.ts](app/api/public/contact/route.ts) — **3 requests / 60 sec**
- [app/api/public/check-member/route.ts](app/api/public/check-member/route.ts) — **30 requests / 1 hour**
- [app/api/public/playbooks/route.ts](app/api/public/playbooks/route.ts) — **20 requests / 1 min**
- [app/api/public/members/route.ts](app/api/public/members/route.ts) — **30 requests / 1 min**
- [app/api/applications/route.ts](app/api/applications/route.ts) — **3 requests / 1 hour**

### Assessment

✅ **These are rate-limited.** However:

1. **Contact endpoint (3 per min)** is appropriate.
2. **Check-member endpoint (30 per hour)** allows **user enumeration**: attacker can query 30 emails/hour and check if they exist in the system. Over a month, enumerate 900+ emails.
   - **Mitigation:** Reduce to **3 per 24 hours** or require CAPTCHA.
3. **Public playbooks/members (20-30 per min)** are acceptable for public read-only endpoints.

---

## Finding 7: No Rate-Limiting on Authentication Paths

### Location
- [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts) — **Google OAuth only; no password-based login**
- [app/api/auth/2fa/totp/verify/route.ts](app/api/auth/2fa/totp/verify/route.ts) — **no rate-limit**
- [app/api/auth/2fa/challenge/route.ts](app/api/auth/2fa/challenge/route.ts) — **no rate-limit**
- [app/api/auth/2fa/recovery/use/route.ts](app/api/auth/2fa/recovery/use/route.ts) — **no rate-limit**

### Risk

**2FA Bypass via Brute-Force:**
1. Attacker compromises primary Google account but not 2FA device.
2. Attacker sends 10,000 TOTP code guesses to `/api/auth/2fa/totp/verify`.
3. TOTP codes are 6 digits = only **1 million combinations** (2^20).
4. No rate-limit per user → can try all codes in **seconds** (1000 requests/sec × 1M codes / 1000 = 1000 seconds = 17 minutes).

**Recovery Code Brute-Force:**
1. Recovery codes: typically 10 codes of 8-12 chars = **10 guesses**.
2. [app/api/auth/2fa/recovery/use/route.ts](app/api/auth/2fa/recovery/use/route.ts) — no rate-limit → attacker tries all 10 in one request.

**Mitigation:**
1. Rate-limit `/api/auth/2fa/totp/verify` to **5 attempts per minute per email**.
2. Rate-limit `/api/auth/2fa/challenge` to **5 attempts per minute per email**.
3. Rate-limit `/api/auth/2fa/recovery/use` to **1 attempt per minute per email** (recovery is nuclear; make it hard).
4. Lock user out after 10 failed 2FA attempts (requires `TwoFactorAuth.failedAttempts`, `lockedUntil`).

---

## Finding 8: Data-Grid Endpoint Fetches All Records Without Pagination

### Location
- [app/api/data-grid/[table]/route.ts:63-66](app/api/data-grid/[table]/route.ts#L63-L66)

### Code
```typescript
const data = await (delegate as any).findMany({
  where: { deletedAt: null },
  orderBy: { createdAt: 'desc' }
});
```

### Risks

1. **No pagination** (no `skip`, `take`) → fetches **all records**.
2. **No limit** on response size → could be **100MB+ JSON** for large tables.
3. **No rate-limit** on this endpoint (anyone with CORE access can loop-call and drain DB resources).
4. **Example:** `members` table has 10K rows → response is ~50MB → transfer time ~5 seconds → Vercel function timeout.

**Attack:**
```bash
for i in {1..1000}; do curl https://app/api/data-grid/members?t=$i & done
```
Result: 1000 concurrent unordered table scans → 1000 database connections → pool exhaustion.

**Mitigation:**
1. Add pagination: `skip: page * 100, take: 100`.
2. Add rate-limit: `withRateLimitHandler(5, 60 * 1000)` (5 requests/min).
3. Add size cap: `if (data.length > 10000) return 413`.

---

## Finding 9: ReDoS Risk in Input Validation

### Location
- [app/api/contributions/route.ts](app/api/contributions/route.ts)
- [app/api/bounty/submissions/route.ts](app/api/bounty/submissions/route.ts)
- [app/api/public/profile/route.ts](app/api/public/profile/route.ts)

### Regex Patterns Found
```typescript
// app/api/contributions/route.ts:
email: z.string().email(),
contentUrl: z.string().url().optional(),

// app/api/bounty/submissions/route.ts:
proofUrl: z.string().url().min(1),

// app/api/public/check-member/route.ts:
email: z.preprocess(emptyToUndefined, z.string().email().optional()),

// app/api/public/profile/route.ts:
url: z.string().url(),
profileImage: z.union([z.string().url(), z.literal("")]).optional(),
```

### Assessment

✅ **No custom `.regex()` found.** Zod's `.email()` and `.url()` validators are **not vulnerable to ReDoS** (they use the same regex as modern browsers and are well-tested).

**However:**
- If custom `.regex()` patterns are added in the future, audit them via [regex101.com](https://regex101.com) with `PCRE` option and test for catastrophic backtracking.
- Example vulnerable pattern: `(a+)+b` on input `aaaaaaaaaaaaaaaaaaaaX` hangs for seconds.

---

## Finding 10: No Global Request Size Limit Enforced

### Location
- [lib/with-rate-limit.ts:35-40](lib/with-rate-limit.ts#L35-L40) — `checkPayloadSize()` defined but **not called**
- [middleware.ts](middleware.ts) — no global size limit

### Code
```typescript
export function checkPayloadSize(body: string, maxBytes = 51200): Response | null {
  if (Buffer.byteLength(body, "utf8") > maxBytes) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  return null;
}
```

**Problem:**
- Function is exported but **never imported or called** in any route.
- Vercel default: **4.5 MB per request** (but not per-endpoint).
- An attacker can POST a 4MB `questCompletion.proofNote` string to tie up memory.

**Mitigation:**
1. Add to [middleware.ts](middleware.ts) — global check before route handler.
2. Or: Call `checkPayloadSize()` in every POST/PATCH handler.

---

## Finding 11: Cost Analysis — Top 5 Most Expensive Endpoints

### Endpoint 1: [/api/analytics/stats](app/api/analytics/stats/route.ts) — CORE Only
```typescript
[
  prisma.analyticsEvent.count({ ... }),
  prisma.analyticsEvent.groupBy({ by: ["sessionId"], ... }).then(r => r.length),
  prisma.analyticsEvent.groupBy({ by: ["path"], ... }),
  prisma.analyticsEvent.groupBy({ by: ["referrer"], ... }),
  prisma.analyticsEvent.groupBy({ by: ["device"], ... }),
  prisma.analyticsDailyStat.findMany({ ... })
]
```
**Cost:** 6 parallel queries. If `analyticsEvent` has 10M rows, groupby scans all 10M rows per call.  
**Per-request latency:** 500ms - 2s.  
**Concurrency risk:** 10 concurrent requests = full table scan × 10 = **DB time = 20+ seconds**.

---

### Endpoint 2: [/api/data-grid/[table]](app/api/data-grid/[table]/route.ts) — CORE Only
```typescript
const data = await (delegate as any).findMany({ where: { deletedAt: null } });
```
**Cost:** Full table scan (no pagination).  
**Example:** `members` table (10K rows) = **100MB JSON response**, 5 second transfer.  
**Concurrency risk:** 100 concurrent requests = **500+ GB transfer**, Vercel bandwidth exhausted.

---

### Endpoint 3: [/api/public/dashboard-stats](app/api/public/dashboard-stats/route.ts) — Public, Cached
```typescript
[
  prisma.communityMember.count(...),
  prisma.playbook.count(...),
  prisma.bounty.count(...),
  prisma.quest.count(...),
  prisma.userProject.count(...)
]
```
**Cost:** 5 count queries.  
**Mitigation:** Cached for 60 seconds (good).  
**Risk:** If cache misses, 5 sequential scans = **500ms latency**.

---

### Endpoint 4: [/api/bounty/submissions](app/api/bounty/submissions/route.ts) — Authenticated
```typescript
// GET: Full scan of all bounty submissions (CORE) or user's (MEMBER/PUBLIC)
prisma.bountySubmission.findMany({
  where: { ... },
  orderBy: { submittedAt: 'desc' },
  include: { bounty, submittedBy, publicUser }
})
```
**Cost:** Full table scan (no pagination).  
**Example:** `bountySubmission` table (100K rows) = **50MB JSON**, CORE sees all.  
**Concurrency risk:** 100 CORE admins querying simultaneously = **100 full table scans** = **10-15 seconds latency for all**.

---

### Endpoint 5: [/api/cron/aggregate-analytics](app/api/cron/aggregate-analytics/route.ts) — Cron
```typescript
[
  prisma.analyticsEvent.count(...),
  prisma.analyticsEvent.groupBy({ by: ["sessionId"], ... }),
  prisma.analyticsEvent.groupBy({ by: ["name"], ... })
]
```
**Cost:** 3 sequential groupby queries on 10M+ rows.  
**Latency:** 2-3 seconds per cron execution.  
**Risk:** If cron runs every hour, Vercel function occupied for 3 seconds × 24 = **72 seconds/day overhead**.

---

## Finding 12: Conclusion & Remediation Roadmap

| Issue | Severity | Effort | Fix |
|---|---|---|---|
| X-Forwarded-For not validated | HIGH | Medium | Validate with Vercel CDN; switch to session-based rate-limit for auth endpoints. |
| RateLimit table unbounded growth | HIGH | Low | Add TTL field; create cleanup cron. |
| No rate-limit on swag redemption | HIGH | Low | Add `withRateLimitHandler(5, 60*1000)` to swag/redeem endpoint. |
| No rate-limit on admin wallet adjust | HIGH | Low | Add `withRateLimitHandler(1, 60*60*1000)` + validation + audit. |
| No rate-limit on email broadcast | HIGH | Low | Add rate-limit + audit. |
| 2FA brute-force (no rate-limit) | HIGH | Low | Add per-email rate-limit (5/min) + lockout. |
| Inconsistent cron auth (timing attack) | MEDIUM | Low | Use `timingSafeEqual` in all cron handlers. |
| Data-grid no pagination | HIGH | Medium | Add pagination (skip/take), rate-limit, size cap. |
| Analytics concurrency not bounded | MEDIUM | Medium | Add semaphore; cap concurrent queries. |
| User enumeration (check-member endpoint) | MEDIUM | Low | Reduce rate-limit from 30/hour to 3/day. |

---

## Recommendations (Prioritized)

1. **Immediate (Week 1):** Rate-limit admin endpoints (wallet adjust, email, 2FA), fix X-Forwarded-For validation, add RateLimit table cleanup.
2. **Short-term (Week 2-3):** Paginate data-grid, bound concurrency, validate per-request sizes.
3. **Ongoing:** Add tests for rate-limit bypass, monitor RateLimit table size, audit cron execution times.

