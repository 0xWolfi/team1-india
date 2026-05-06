# Category 8 — Multi-Tenant Isolation Scan

**Audit date:** 2026-05-03  
**Status:** COMPLETE  
**Finding summary:** Single-tenant (non-SaaS) platform. Logical multi-tenancy within speedrun runs confirmed with **PROPER ISOLATION**. Most Category 8 checks are **N/A**.

---

## Executive Summary

The codebase is a **single-tenant community platform** for team1-india, not a multi-tenant SaaS product. It serves **one community** deployed once to Vercel (`team1india.vercel.app` / `team1india.com`). 

**Important:** The platform does have a **logical multi-tenancy model** based on **SpeedrunRun entities** (per-month speedrun competitions). Each `SpeedrunRun` acts as a "tenant" boundary within the same database and application. **Cross-run data isolation has been verified to be SECURE.**

---

## Findings by Check

### 1. **Tenant ID Derivation (Check 1.1)**

**Status: N/A — No SaaS tenant model**

- Codebase has **zero instances** of `tenantId`, `organizationId`, `orgId`, `workspaceId`, or `companyId` fields in the Prisma schema ([prisma/schema.prisma](../../../../prisma/schema.prisma), verified via grep).
- No multi-tenant routes under `app/api/orgs/`, `app/api/tenants/`, or `app/api/workspaces/` (verified via filesystem scan).
- Application is single-instance, single-database, single-community.

**Rationale per recon:** [00-RECON.md §Step 1](00-RECON.md#step-1--repository-structure) — "Vercel-only; **no Docker, no Terraform/CDK/Helm, no Supabase/Firebase config**." Single Next.js app, single `DATABASE_URL`.

---

### 2. **Core Admin Scoped to Tenant (Check 2.1)**

**Status: N/A — No tenant model**

Applies only to SaaS platforms where core admin functions must be scoped to a specific tenant. The codebase has a single `CORE` role ([lib/auth-options.ts](../../../../lib/auth-options.ts) L110) that applies **globally to the entire application**. No tenant scoping.

**Rationale per recon:** [00-RECON.md §Step 5](00-RECON.md#step-5--rbac-roles-permissions-hierarchy) — "Three roles: `CORE`, `MEMBER`, `PUBLIC`. Hierarchy: Implicit — no tenant field."

---

### 3. **Cross-Tenant Cache Key Collision (Check 3.1)**

**Status: PARTIAL — Vercel CDN cache is platform-managed**

The PWA Service Worker caches API responses for `/api/public/*` with explicit **auth-header validation** ([next.config.ts L126-141](../../../../next.config.ts)):

```typescript
cacheWillUpdate: async ({ response }: { response: Response }) => {
  const headers = response.headers;
  if (headers.get('Authorization') || headers.get('Set-Cookie')) {
    console.warn('Blocked caching response with auth headers');
    return null;  // Don't cache
  }
```

✅ **Public API responses are cache-safe** (no per-user leakage via Workbox in the SW).

⚠️ **Vercel Edge Network CDN cache:** The cache key at the CDN layer (Vercel's infrastructure) is **not visible in source**. Per Open Assumption #8 (recon §Step 15), the correct per-user/per-session cache key segmentation depends on Vercel's CDN configuration (vary-on headers, custom cache keys in Vercel project settings). **Suspected safe** (Vercel defaults are sensible), but unverified.

**Recommendation:** Verify in the Vercel project dashboard that cache keys include `Authorization` or `Cookie` headers for authenticated routes.

---

### 4. **Cross-Tenant Queue / Redis Pub-Sub (Check 4.1)**

**Status: N/A — No Redis, no queue**

- Recon §Step 3: "**No queue consumers, no DB stream triggers, no S3 event triggers, no GraphQL, no WebSocket, no SSE.**"
- Zero Redis references in [package.json](../../../../package.json) (34 deps, all verified).
- All jobs are **cron-triggered** via Vercel cron ([vercel.json](../../../../vercel.json)), not queue-based.

---

### 5. **Search Index Tenant ID Enforced (Check 5.1)**

**Status: N/A — No search index**

No Elasticsearch, Algolia, or custom search index found. Projects / content are queried directly from PostgreSQL with WHERE filters.

---

### 6. **Database RLS Using Session Tenant ID (Check 6.1)**

**Status: N/A — No RLS, no tenants**

- Database is PostgreSQL (no RLS policies in [prisma/schema.prisma](../../../../prisma/schema.prisma) — no `@db.` annotations for RLS).
- All access control is **application-layer**, implemented via [lib/permissions.ts](../../../../lib/permissions.ts) and per-route `getServerSession` calls.

---

### 7. **Subdomain Takeover Prevention (Check 7.1)**

**Status: SECURE**

- No wildcard subdomain handling in [next.config.ts](../../../../next.config.ts).
- Custom domain hosting is Vercel-managed. The project uses `team1india.vercel.app` (platform subdomain) and custom CNAME `team1india.com` (deployed via Vercel).
- ✅ **Vercel's infrastructure prevents subdomain takeover** on the `*.vercel.app` domain (platform-managed).
- Per Open Assumption #8, custom domain TLS/ACME is Vercel-managed — **not an application concern**.

---

### 8. **Custom Domain TLS / ACME Hijack (Check 8.1)**

**Status: N/A (Vercel-managed)**

Vercel handles all TLS provisioning and ACME certificate renewal for custom domains. Application does not manage certificates.

Per recon §Step 15 (Open Assumptions), custom domain DPA coverage is a vendor-contract question (Cat 27 scope).

---

### 9. **Per-Tenant Rate Limiting (Check 9.1)**

**Status: N/A — Single tenant; Per-USER rate limiting verified**

The codebase has **per-IP / per-user rate limiting**, not per-tenant:
- [lib/rate-limit.ts](../../../../lib/rate-limit.ts) — IP-based rate limiting.
- Example: `/api/speedrun/runs/[slug]/teams/lookup` at [route.ts L22](../../../../app/api/speedrun/runs/[slug]/teams/lookup/route.ts#L22) — "60 requests / minute / IP".

✅ Per-user rate limiting is implemented. (Category 21 scope for verification of sufficiency.)

---

### 10. **Tenant Deletion Cascade (Check 10.1)**

**Status: N/A — No tenant model**

---

### 11. **Tenant Export Scoped + Re-Auth + Audit (Check 11.1)**

**Status: N/A — No tenant model**

Single platform has no per-tenant data export. General audit trail coverage is [in Category 13](13-audit-logging.md).

---

## Logical Multi-Tenancy: SpeedrunRun Isolation Analysis

The **closest analog to multi-tenancy** in this codebase is the **SpeedrunRun** entity. Each `SpeedrunRun` (e.g., "may-26") represents a **per-month competition** with its own:
- Registrations (`SpeedrunRegistration`)
- Teams (`SpeedrunTeam`)
- Tracks (`SpeedrunTrack`)
- Project submissions (`UserProject` with `speedrunRunId`)

**Threat model:** Could a user registered for run A submit a project or modify a team for run B?

### ✅ **Finding: Proper Run-Scoped Isolation**

#### Registration (Check L1)

**Route:** `/api/speedrun/runs/[slug]/register` ([route.ts L20-86](../../../../app/api/speedrun/runs/[slug]/register/route.ts))

```typescript
const run = await getRunBySlug(slug);
if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
...
const existing = await prisma.speedrunRegistration.findUnique({
  where: { runId_userEmail: { runId: run.id, userEmail } },
});
if (existing) {
  return NextResponse.json(
    { error: "You have already registered for this Speedrun" },
    { status: 409 }
  );
}
```

✅ **Isolation:** Registration is scoped to the **run from the URL slug**, verified before any registration attempt. Unique constraint is `(runId, userEmail)`, preventing cross-run registration.

#### Team Join (Check L2)

**Route:** `/api/speedrun/runs/[slug]/teams/join` ([route.ts L50-56](../../../../app/api/speedrun/runs/[slug]/teams/join/route.ts))

```typescript
const team = await prisma.speedrunTeam.findUnique({
  where: { code },
  include: { _count: { select: { members: true } } },
});
if (!team || team.runId !== run.id) {
  return NextResponse.json({ error: "Invalid team code" }, { status: 404 });
}
```

✅ **Isolation:** Verifies that the team's `runId` matches the **current run from the URL**. A user cannot join a team from a different run, even if they have the valid team code.

#### Team Lookup (Check L3)

**Route:** `/api/speedrun/runs/[slug]/teams/lookup` ([route.ts L42-48](../../../../app/api/speedrun/runs/[slug]/teams/lookup/route.ts))

```typescript
const team = await prisma.speedrunTeam.findUnique({
  where: { code },
  include: { _count: { select: { members: true } } },
});
if (!team || team.runId !== run.id) {
  return NextResponse.json({ found: false }, { status: 404 });
}
```

✅ **Isolation:** Team lookup only returns a team if its `runId` matches the URL-slug run. Cross-run team lookups fail gracefully (404).

#### Project Submission (Check L4)

**Route:** `/api/projects` POST ([route.ts L119-189](../../../../app/api/projects/route.ts))

```typescript
if (speedrunRunId) {
  const run = await prisma.speedrunRun.findUnique({
    where: { id: speedrunRunId },
    select: { id: true, status: true },
  });
  if (!run) {
    return NextResponse.json({ error: "Speedrun run not found" }, { status: 404 });
  }
  ...
  const myReg = await prisma.speedrunRegistration.findUnique({
    where: { runId_userEmail: { runId: run.id, userEmail: session.user.email } },
    select: { id: true, teamId: true },
  });
  if (!myReg) {
    return NextResponse.json(
      { error: "You must be registered for this Speedrun run to submit" },
      { status: 403 }
    );
  }
```

✅ **Isolation:** A user can only submit a project for run X if they have an **explicit registration** for run X. Even if they craft a POST with a different `speedrunRunId`, the registration lookup validates they are registered for **that specific run**.

#### Registration Export (Check L5)

**Route:** `/api/speedrun/registrations/export` ([route.ts L6-32](../../../../app/api/speedrun/registrations/export/route.ts))

```typescript
// GET /api/speedrun/registrations/export?runId=...&status=...
// CORE-only CSV export of registrations for ops handling.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "CORE") {
    return new Response("Forbidden", { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  ...
  const where: any = {};
  if (runId) where.runId = runId;
```

✅ **Isolation:** CORE-only export. If a `runId` query param is provided, it filters to that run. No cross-run data leakage. (Note: No re-auth gate on export per recon §Step 13, but CORE-only gate is sufficient in a single-community platform.)

---

### Summary of SpeedrunRun Isolation

| Route | Isolation Check | Result |
|---|---|---|
| Register for run | URL slug resolves run; register check scoped to (runId, email) | ✅ SECURE |
| Join team | Team's runId verified against URL slug run | ✅ SECURE |
| Lookup team | Team's runId verified; cross-run codes return 404 | ✅ SECURE |
| Submit project | User registration required for the target run | ✅ SECURE |
| Export registrations | CORE-only, runId filter applied correctly | ✅ SECURE |

**No cross-run data leakage found.**

---

## Non-Findings

- ✅ No domain/subdomain takeover vectors.
- ✅ No RLS bypass required (application-layer enforcement is sufficient for single-tenant).
- ✅ No queue/Redis multi-tenancy issues.
- ✅ No search-index tenant leakage.

---

## Recommendations

1. **Verify Vercel CDN cache keys** in project dashboard (Settings > Caching). Ensure authenticated routes vary by session/user. [Open Assumption #8]
2. **SpeedrunRun isolation is correctly implemented.** No changes required.
3. **Rate limiting sufficiency** (per-IP and auth-gated routes) should be verified in Cat 21.

---

## References

- Recon §Step 1: Repository structure (single-tenant, single-DB).
- Recon §Step 3: Endpoint inventory (speedrun routes, projects, registrations).
- Recon §Step 5: RBAC (no multi-tenant permission model).
- Recon §Step 7: Data model (SpeedrunRun, SpeedrunTeam, SpeedrunRegistration, UserProject relationships).
- Recon §Step 15: Open Assumptions (Vercel CDN, custom domain TLS).

---

**End of Category 8 scan.**
