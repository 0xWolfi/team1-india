# Category 9 — Serverless-Specific Attacks

**Audit date:** 2026-05-03
**Stack:** Next.js 16 on Vercel; 154 API routes; 7 cron jobs gated by single `CRON_SECRET`; single Postgres DB; Prisma client; no Lambda layers; no public Function URLs.

Per the recon, all routes share a single Vercel project, single env-var scope, single DB credential, and there are no per-function memory/timeout overrides in [vercel.json](../../../vercel.json).

---

## Check 1 — Function Over-Privileged Env Access

**Verdict:** Finding (Critical, architectural)

**Location:** All `app/api/**/route.ts` handlers; representative reads at [lib/prisma.ts](../../../lib/prisma.ts), [lib/auth-options.ts:8-9](../../../lib/auth-options.ts#L8-L9), [lib/email.ts:5-10](../../../lib/email.ts#L5-L10), [app/api/upload/token/route.ts](../../../app/api/upload/token/route.ts).

**Description:** Vercel functions have no per-route IAM. Every handler can read every env var via `process.env`. A single RCE in any of 154 routes exfiltrates all 16 secrets (`DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `ENCRYPTION_KEY`/`PII_ENCRYPTION_KEY`, `HMAC_INDEX_KEY`, Google OAuth secret, SMTP creds, Cloudinary secret, `BLOB_READ_WRITE_TOKEN`, `VAPID_PRIVATE_KEY`, `LUMA_API_KEY`).

**Attack scenario:** Combine with any Cat 14 (injection) or Cat 18 (SSRF) finding to read `process.env`. Once secrets are out, attacker has DB root, JWT forgery, mail send, push send, blob write — i.e., total compromise.

**Business impact:** Full PII corpus, all wallet balances, ability to forge any admin session.

**Remediation:** Architectural — segment secret access per function via Vercel-side environment scoping (separate projects for cron vs. user-facing) or move secrets to a runtime-fetched secrets-manager that requires application-level credentials *only the cron function holds*. Alternatively rotate secrets on a fixed cadence to bound the leak window.

**Detection:** No native instrumentation; would need to ship `process.env` access logging in production (Sentry already exposed but not initialized — recon-13).

---

## Check 2 — Cross-Function Privilege Confusion

**Verdict:** N/A — single Next.js runtime per recon §Step 1; routes share the same handler model.

---

## Check 3 — Env-Var Secrets in Console / Source Maps / Build Logs

**Verdict:** Finding (Critical) on `NEXT_PUBLIC_SLACK_WEBHOOK_URL` (covered also in Cat 16). Other env vars: source maps off in production (Next.js default; [next.config.ts](../../../next.config.ts) has no `productionBrowserSourceMaps: true`); build script ([package.json:7](../../../package.json#L7)) is `prisma generate && next build --webpack` — no env dump.

**Location of leak:** [lib/alertNotifications.ts:32,35,50,53](../../../lib/alertNotifications.ts) — references `process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL` which gets bundled to the client.

**Severity:** Critical. Slack incoming webhook is anonymously POSTable forever once exposed. See Cat 16 finding for full PoC and remediation.

**Other NEXT_PUBLIC_* vars:** `NEXT_PUBLIC_ALERT_WEBHOOK_URL` (same risk pattern), `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (intended public), `NEXT_PUBLIC_ADMIN_EMAIL` (info disclosure: target for phish).

---

## Check 4 — Cold-Start Data Leakage in Globals

**Verdict:** N/A (mitigated by design)

**Locations checked:**
- [lib/prisma.ts:17-61](../../../lib/prisma.ts#L17-L61) — singleton Prisma client; no per-user state held in module scope.
- [app/api/public/home/route.ts:9,20,33](../../../app/api/public/home/route.ts) — `unstable_cache` for public-data only; no per-user data.
- [lib/speedrunNotify.ts:7-20](../../../lib/speedrunNotify.ts#L7-L20) — lazy `vapidConfigured` flag; only env vars, not user state.
- [lib/rate-limit.ts:19-90](../../../lib/rate-limit.ts#L19-L90) — DB-backed counters, not in-memory `Map`/`Set`.

**No `Map`, `WeakMap`, or `Set` at module scope holds user-specific data.** Cold-start instances are safe.

---

## Check 5 — `/tmp` Reuse Leaking Between Users

**Verdict:** N/A

**Evidence:** Grep across the repo for `fs.writeFileSync`, `fs.createWriteStream`, `os.tmpdir()`, `mkdtempSync` returns no hits in handlers. [lib/email.ts](../../../lib/email.ts) uses Nodemailer directly without temp files; image processing is delegated to Cloudinary / Vercel Blob (remote).

---

## Check 6 — Connection Pool Exhaustion

**Verdict:** Suspected

**Location:** [lib/prisma.ts:18](../../../lib/prisma.ts#L18)

```typescript
return new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query'] : [] })
```

No `datasourceUrl` override, no `connection_limit` query string in `DATABASE_URL` (Open Assumption — we can't see the value). Vercel scales horizontally; each warm function instance opens its own pool. Under burst load (e.g., the speedrun-status cron broadcasting to thousands of users while users hit the API), Postgres `max_connections` can be saturated.

**Confirmation needed:** Check Vercel dashboard / `DATABASE_URL` for `?pgbouncer=true&connection_limit=1` (the standard Vercel + Prisma pattern), or whether Prisma Accelerate / Data Proxy is in use. Open Assumption #7 from recon.

**Remediation:** Append `?pgbouncer=true&connection_limit=1` to `DATABASE_URL` and run a transaction-level pooler (Supabase pooler, PgBouncer, Prisma Accelerate). Or set `PrismaClient` `datasourceUrl` to a pooled endpoint.

---

## Check 7 — Recursive Invocation Loop

**Verdict:** N/A

**Evidence:** Grep across cron handlers ([app/api/cron/](../../../app/api/cron/)) for `fetch(.*api/`, `axios`, `request.url` returns no self-call patterns. Cron handlers read DB and call libraries directly (no HTTP self-trigger).

---

## Check 8 — Unbounded Fan-Out

**Verdict:** Finding (High)

**Location:** [lib/speedrunNotify.ts:157-184](../../../lib/speedrunNotify.ts#L157-L184) — `broadcastToRunRegistrants()`:

```typescript
const regs = await prisma.speedrunRegistration.findMany({
  where: { runId, status: { in: ["registered", "confirmed"] } },
  select: { userEmail: true },
});
const emails = Array.from(new Set(regs.map((r) => r.userEmail)));
// pushBroadcastToEmails(emails, ...);  // L91 issues Promise.all over all emails
// emailBroadcast(emails, ...);         // L136 same
```

Caller: [app/api/cron/speedrun-status/route.ts:112](../../../app/api/cron/speedrun-status/route.ts#L112).

**Description:** No upper-bound cap on registrants. If a Speedrun reaches 10K participants, a single cron firing issues 10K concurrent web-push calls and 10K concurrent SMTP sends inside one Vercel function (60s timeout). Memory can blow; SMTP rate caps will rate-limit; FCM quota will refuse — and the cron may be re-triggered.

**Attack scenario:** Sybil farmer registers 5K accounts → cron broadcast amplifies to 5K outbound sends → exceeds SMTP quota (Gmail SMTP default ~500/day) → legitimate emails fail.

**Remediation:** Batch into chunks of 100 with `await new Promise(r => setTimeout(r, 200))` between chunks. Or push the work onto a deferred queue (would require adding a queue to the stack).

---

## Check 9 — Cost-Amplification DoS

**Verdict:** N/A (no obvious vector)

**Evidence:** No `sharp`, `jimp`, `pdf-lib`, `puppeteer`, `pdfkit` in [package.json](../../../package.json). Image processing delegated to Cloudinary and Vercel Blob CDN. `react-markdown` renders client-side. Email templates ([lib/email.ts](../../../lib/email.ts)) use static HTML strings with `${escapeHtml(...)}`.

**Note:** Vercel `bodySizeLimit: '2mb'` ([next.config.ts:88](../../../next.config.ts#L88) per recon-1) bounds raw input size. This caps cost per request.

---

## Check 10 — Public Lambda Function URL / Worker Route Without Auth

**Verdict:** N/A

**Evidence:** Vercel functions are reachable only via the Next.js routing layer; no `vercel.json` `functions.<route>.public: true`; no `__direct/*` or `__raw/*` paths.

---

## Check 11 — API Gateway Authorizer Caching Past Revocation

**Verdict:** Re-statement of Cat 1 finding

**Equivalent in this stack:** NextAuth JWT 30-day TTL ([lib/auth-options.ts:198](../../../lib/auth-options.ts#L198)) acts as a 30-day "cache" of role+permissions. There is no `tokenVersion` / revocation list — see Cat 1 Finding 1.8 (Critical).

---

## Check 12 — Step Functions State Injection

**Verdict:** N/A — no Step Functions / Inngest / Temporal in [package.json](../../../package.json).

---

## Check 13 — Layer / Build Plugin Supply Chain

**Verdict:** N/A — no Lambda layers; no postinstall hooks ([package.json](../../../package.json) §Step 2 of recon-1); only build plugin is `@ducanh2912/next-pwa` (well-known, pinned). `bun.lock` committed. See Cat 26 for full CI/CD supply-chain analysis.

---

## Check 14 — VPC Misconfig

**Verdict:** N/A — Vercel-managed networking. Open Assumption #7: whether the Postgres instance is publicly reachable or restricted to Vercel egress IPs is not in the repo.

---

## Check 15 — DLQ Containing Sensitive Payloads

**Verdict:** N/A — no queues in stack.

---

## Check 16 — EventBridge / SNS / SQS Without Resource Policies

**Verdict:** N/A — none.

---

## Check 17 — Cron Functions With Elevated Privileges via Misconfigured Trigger

**Verdict:** Finding (Critical)

**Location:** [vercel.json:2-31](../../../vercel.json#L2-L31) and the 7 cron handlers under [app/api/cron/](../../../app/api/cron/).

**Vulnerable code (representative):** [app/api/cron/expire-points/route.ts:9-12](../../../app/api/cron/expire-points/route.ts#L9-L12) — bearer-token-only check:

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Description:** A single shared `CRON_SECRET` gates all 7 cron jobs (expire-points, send-scheduled-emails, cleanup, aggregate-analytics, aggregate-health, sync-events, speedrun-status). No per-job HMAC, no IP allowlist, no rate limit, no AuditLog write on cron invocation (recon-13 §4).

**Attack scenario:** An attacker who learns `CRON_SECRET` (via a leaked Vercel dashboard credential, an env-var dump in a verbose error, or an insider exfil) can:
1. POST to `/api/cron/expire-points` repeatedly → mass-expire user balances → economic DoS.
2. POST to `/api/cron/send-scheduled-emails` repeatedly → exhaust SMTP quota; mass-mail to all recipients.
3. POST to `/api/cron/speedrun-status` → transition runs out of schedule → spam push + email broadcasts to all registrants.

No alert triggers because cron invocation isn't audited and there's no anomaly detection (recon §Step 13).

**Business impact:** Economy DoS, SMTP reputation damage, mass spam, points-balance corruption. None of these are recoverable without DB rollback.

**Remediation:**
- Per-job secrets (`CRON_SECRET_EXPIRE_POINTS`, etc.).
- Add HMAC of timestamp + path: reject if timestamp older than 60s; require `Authorization: HMAC-SHA256 ts=...,sig=...`.
- IP allowlist Vercel cron egress (documented per Vercel cron architecture).
- Write `AuditLog` row on every cron invocation with the resource and outcome.
- Add idempotency guard: store `last_run_at` per cron in DB; refuse if called twice within the cron's expected window.

**Detection:** Alert when same cron path receives >1 request per its scheduled window.

---

## Check 18 — Concurrency Limits Absent or Too Low

**Verdict:** Finding (High)

**Location:** [vercel.json](../../../vercel.json) — no `functions` config object at all.

**Description:** Vercel default per-function timeout is 10s on Hobby, up to 60s on Pro, up to 300s on Enterprise. Without explicit `maxDuration`, expensive functions like `speedrun-status` (which broadcasts to all registrants — see Check 8) may hit timeout mid-broadcast, leaving partial state. Without explicit concurrency limits, a `CRON_SECRET` holder can spam the cron endpoint and drive concurrent invocations to Vercel's project cap (1000 default), starving user-facing functions.

**Attack scenario:** Same as Check 17 — attacker holding `CRON_SECRET` triggers `/api/cron/speedrun-status` in a loop. Each invocation kicks off a multi-thousand-target broadcast. Function instances exhaust the project's concurrency budget; user-facing routes return 429/503.

**Remediation:** Add to [vercel.json](../../../vercel.json):

```json
"functions": {
  "app/api/cron/**": { "maxDuration": 60 },
  "app/api/cron/speedrun-status/route.ts": { "maxDuration": 120 }
}
```

Add per-cron idempotency (see Check 17 remediation).

---

## Summary

| # | Check | Verdict | Severity |
|---|---|---|---|
| 1 | Over-privileged env access | Finding | Critical (architectural) |
| 2 | Cross-function privilege confusion | N/A | — |
| 3 | Env vars in client / source maps | Finding (Slack webhook) | Critical (covered in Cat 16) |
| 4 | Cold-start data leakage | N/A | — |
| 5 | `/tmp` reuse | N/A | — |
| 6 | Connection pool exhaustion | Suspected | Medium |
| 7 | Recursive invocation loop | N/A | — |
| 8 | Unbounded fan-out | Finding | High |
| 9 | Cost-amplification DoS | N/A | — |
| 10 | Public Function URL | N/A | — |
| 11 | Authorizer caching past revocation | Re-stated (Cat 1) | Critical |
| 12 | Step Functions state injection | N/A | — |
| 13 | Layer / build plugin supply chain | N/A (see Cat 26) | — |
| 14 | VPC misconfig | N/A | — |
| 15 | DLQ payloads | N/A | — |
| 16 | EventBridge/SNS/SQS policies | N/A | — |
| 17 | Cron privilege via shared secret | Finding | Critical |
| 18 | Concurrency limits absent | Finding | High |
