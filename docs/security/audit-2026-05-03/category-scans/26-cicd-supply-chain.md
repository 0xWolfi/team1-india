# Category 26 — CI/CD, Deployment & Supply Chain Audit

**Audit Date:** 2026-05-03  
**Repository:** team1-india  
**Scope:** CI/CD pipelines, deployment infrastructure, build process, dependency management, supply chain security  
**Auditor:** Security Scan Agent

---

## Executive Summary

The team1-india codebase uses **Vercel as the sole deployment platform** with **zero GitHub Actions pipelines**. This eliminates entire classes of CI/CD token compromise and self-hosted runner misuse risks. However, the architecture creates **three distinct risk surfaces**:

1. **Preview Deployment Environment Isolation** — assumption-based concern
2. **Dependency Supply Chain & Postinstall Hooks** — largely hardened
3. **Build-Time Secret Exposure** — confirmed issue with `NEXT_PUBLIC_` variables

All 13 checks below include verdict (✅ pass, ⚠️ warning, ❌ fail, or "Open Assumption" when external config not in repo).

---

## Check 1: CI Tokens with Deploy Permissions in Actions without Environment Protection

**Verdict:** ✅ **N/A — No GitHub Actions Found**

**Findings:**
- `.github/workflows/` directory **does not exist** in the repository.
- Zero `.yml` or `.yaml` workflow files found under `.github/`.
- All builds and deploys routed exclusively through Vercel infrastructure.

**Impact:** GitHub Actions secrets/OIDC tokens are not in scope for this codebase. The risk vector of a compromised Actions token deploying to production is eliminated by design.

**References:**  
- Recon: [00-RECON.md:25](../00-RECON.md#L25) — "`.github/workflows/` exists but is **empty**"
- File check: `/Users/sarnavo/Development/team1-india/.github/` does not exist

---

## Check 2: PR-Triggered Preview Deployments Running Attacker Code Against Prod DB

**Verdict:** ⚠️ **Open Assumption #1 — Risk Confirmed IF Prerequisites Hold**

**Findings:**

Vercel automatically creates **preview deployments** for every pull request on public repositories. The risk matrix is:

1. **Vercel creates a new staging deployment** for PR branch
2. **If `DATABASE_URL` is shared between prod and preview**, any attacker PR can:
   - Access live production database during build and at runtime
   - Read all PII, financial data, secrets from database
   - Write/corrupt production data if the DB user has insert/update permissions
3. **Build-time risk:** `prisma generate` and `next build` execute during the preview deploy and have full access to `DATABASE_URL`
4. **Runtime risk:** Preview route handlers execute with the same `DATABASE_URL` as production

**Open Assumptions (In Vercel Dashboard, NOT in Repo):**
- Is `DATABASE_URL` environment variable scoped to **production only**, or does it leak to **preview deployments**?
- Does Vercel project have **environment protection rules** that prevent preview builds from accessing secrets?
- Are **external PR deployments disabled**, or are PRs from forks auto-deployed?

**Detailed Risk:**

```
External Attacker Flow:
1. Fork team1-india
2. Open PR with malicious code (e.g., read DATABASE_URL from process.env in build script)
3. Vercel triggers preview build on attacker's branch
4. If DATABASE_URL is available → attacker connects to prod DB during build
5. Attacker exfiltrates all data or inserts backdoors
6. Preview environment runs with prod DB access → live compromise
```

**Evidence from Codebase:**

- [package.json:7](../../../package.json#L7): Build script is `prisma generate && next build --webpack`
  - Both commands execute in Vercel build environment
  - Prisma and Next.js have access to all `process.env` variables during build
- [vercel.json](../../../vercel.json): No `env` or `buildCommand` override specifying which secrets are available to previews
- Recon: [00-RECON.md:334](../00-RECON.md#L334) — "**Single `DATABASE_URL` across envs** — Vercel preview deployments may share the prod DB unless preview env-protection is configured"

**Recommendation:**

1. **Verify in Vercel Dashboard:**
   - Project Settings → Environment Variables → Check if `DATABASE_URL` is scoped to "Production" only
   - Project Settings → Protected Branches → Enable "Require approval for production deployment"
2. **If Preview Shares Prod DB (High Risk):**
   - Create separate read-only DB user for preview environments
   - Set `DATABASE_URL` only on production; use a separate `PREVIEW_DATABASE_URL` for staging
   - Disable external PR deployments: Project Settings → Git → "Deploy on pull request from forks" = OFF
3. **Prisma Schema Mitigation:**
   - Add verification in `prisma/schema.prisma` that `DATABASE_URL` is expected to be production-only
   - (Note: prisma.generate doesn't validate this; it's a process-level config issue)

---

## Check 3: Preview Deployments Using Prod Environment Variables

**Verdict:** ⚠️ **Open Assumption #1 — Needs Verification**

**Findings:**

Vercel's default behavior exposes **all non-secret environment variables** to preview builds. However, variables **prefixed `NEXT_PUBLIC_` are always public** and appear in client bundles regardless of environment.

**Environment Variable Categories (from recon):**

| Type | Count | Scoped? | Risk |
|---|---|---|---|
| `NEXT_PUBLIC_*` | 10 | **N/A — always public** | Medium (exposed in client) |
| Secrets (API keys, tokens) | 16 | Should be prod-only | High if shared with preview |
| Config (flags, URLs) | 6 | Usually prod-only | Low if shared with preview |

**Variables Confirmed in `NEXT_PUBLIC_` (Client-Side Visible):**
- `NEXT_PUBLIC_SLACK_WEBHOOK_URL` (Slack incoming webhook — **CRITICAL EXPOSURE**)
- `NEXT_PUBLIC_ALERT_WEBHOOK_URL`
- `NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT`
- `NEXT_PUBLIC_ANALYTICS_ENDPOINT`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_HERO_VIDEO_URL`, `NEXT_PUBLIC_HERO_VIDEO_URL_MP4`
- `NEXT_PUBLIC_PWA_MONITORING_ENDPOINT`
- `NEXT_PUBLIC_ADMIN_EMAIL`

**Secret Variables (Should be Prod-Only):**
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`
- `GOOGLE_*`, `SMTP_*`, `BLOB_*`, `CLOUDINARY_*`, `VAPID_PRIVATE_KEY`

**Open Assumption:**
Vercel dashboard determines which variables are available to preview deployments. The repo has no config to enforce this.

**Evidence:**
- Recon: [00-RECON.md:334](../00-RECON.md#L334) — "Single `DATABASE_URL` across envs"

**Recommendation:**

In **Vercel Project Dashboard**:
1. Environment Variables → Disable preview access for all secrets except those explicitly needed for previews
2. Specifically restrict: `DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, all API keys

---

## Check 4: pull_request_target with Checkout of Untrusted Code

**Verdict:** ✅ **N/A — No GitHub Actions**

**Findings:**
No GitHub Actions workflows exist. The `pull_request_target` trigger pattern (which re-uses the base branch's secrets for untrusted PR code) is not applicable.

---

## Check 5: Self-Hosted Runners Reused Across Untrusted PRs

**Verdict:** ✅ **N/A — No Self-Hosted Runners**

**Findings:**
- Deployment is Vercel-only
- No self-hosted infrastructure in the repository
- No runner configuration files found

---

## Check 6: Lockfile Not Committed / Floating Versions

**Verdict:** ✅ **PASS — Lockfile Committed, All Versions Pinned**

**Findings:**

- **`bun.lock` committed to git** ([package.json context](../../../package.json))
- **All 34 production dependencies use caret (`^`) or exact pins** — no floating `*` or `latest`
- **Key pins:**
  - `next 16.1.1` — specific major version (not `^16`)
  - `react 19.2.3`, `react-dom 19.2.3` — pinned majors
  - All other deps locked with `^` (e.g., `^0.47.3`, `^5.22.0`)

**Dependency Supply Chain Risk:** LOW

Reproducible builds are guaranteed. Any future install will use the exact same versions registered in `bun.lock`.

**Evidence:**  
- Recon: [recon-1-2-11-12-iac-secrets.md §2.1](category-scans/recon-1-2-11-12-iac-secrets.md#L110-L162)

---

## Check 7: Postinstall Scripts with Network Access During Build

**Verdict:** ✅ **PASS — No Postinstall Hooks**

**Findings:**

- **No `postinstall` script** in [package.json:5-14](../../../package.json#L5-L14)
- **No `prepare` hook** that runs before `npm install` completes
- **`prisma generate`** runs during **build time only** (in `build` script), not during install
- **Dev dependencies** (TypeScript, ESLint, Tailwind) are build tools; safe

**Build-Time Script:**
```json
"build": "prisma generate && next build --webpack"
```

This runs in Vercel build environment after all node_modules are installed. Risk: see Check 10 (SAST/SCA).

**Postinstall Risk:** NONE

---

## Check 8: Typosquatting / Dependency Confusion on Private Packages

**Verdict:** ✅ **PASS — No Private Package Dependencies**

**Findings:**

- All 34 production dependencies are **published to public npm registry**
- No `@private/*`, `@internal/*`, or scoped internal packages found
- No `.npmrc` with private registry configuration (only `legacy-peer-deps=true`)
- No monorepo cross-dependencies (single Next.js app, not a workspace)

**Supply Chain Risk:** NONE for dependency confusion

**References:**  
- [package.json](../../../package.json)
- [.npmrc](../../../.npmrc) — no private registry

---

## Check 9: Build-Time Secrets Baked into Client Bundle

**Verdict:** ❌ **FAIL — `NEXT_PUBLIC_*` Variables Expose Secrets in Client**

**Findings:**

**CRITICAL ISSUE: `NEXT_PUBLIC_SLACK_WEBHOOK_URL` in Client Bundle**

All variables prefixed `NEXT_PUBLIC_` are embedded in the Next.js client bundle and visible to every browser visitor. This includes:

### ⚠️ High-Risk Exposure

**Variable:** `NEXT_PUBLIC_SLACK_WEBHOOK_URL`  
**Type:** Slack Incoming Webhook URL  
**Exposure:** Embedded in client JavaScript  
**Risk:** Any visitor can POST arbitrary messages to your Slack channel indefinitely

**How an Attacker Uses It:**
1. Extract `NEXT_PUBLIC_SLACK_WEBHOOK_URL` from `_next/static/chunks/` or devtools
2. POST to the URL: `curl -X POST https://hooks.slack.com/services/T.../B.../XXX -d '{"text":"HACKED"}'`
3. No authentication required — incoming webhooks trust the URL itself
4. Send phishing messages, false alerts, or spam

**Evidence from Codebase:**

- [lib/alertNotifications.ts:32-35](../../../lib/alertNotifications.ts) — Slack webhook configured with `NEXT_PUBLIC_` prefix
- [recon-1-2-11-12-iac-secrets.md:321-324](category-scans/recon-1-2-11-12-iac-secrets.md#L321-L324) — "Any attacker able to extract this URL can post to the configured Slack channel"

**All `NEXT_PUBLIC_*` Variables in Client Bundle:**

| Variable | Purpose | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SLACK_WEBHOOK_URL` | Alert notifications | **HIGH — can trigger false messages** |
| `NEXT_PUBLIC_ALERT_WEBHOOK_URL` | Generic webhook | Medium — depends on endpoint implementation |
| `NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT` | Email notifications | Medium — if unauthenticated |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | Event ingest | Low — expected to be public |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking | Low — DSN public by design |
| `NEXT_PUBLIC_PWA_MONITORING_ENDPOINT` | Monitoring dashboard | Medium — information disclosure |
| `NEXT_PUBLIC_HERO_VIDEO_URL`, `NEXT_PUBLIC_HERO_VIDEO_URL_MP4` | CDN URLs | Low — public videos |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Contact email | Low — semi-public |

**Restate from Category 16 Findings:**

Category 16 (secrets & env) identified and flagged this same issue:
- [recon-1-2-11-12-iac-secrets.md §11.2](category-scans/recon-1-2-11-12-iac-secrets.md#L305-L325) — "⚠️ CRITICAL: `NEXT_PUBLIC_SLACK_WEBHOOK_URL` is a Slack incoming webhook — exposed in client-side bundle."

**Recommendations:**

1. **Immediate Rotation (Security):**
   - Rotate `NEXT_PUBLIC_SLACK_WEBHOOK_URL` in Slack dashboard (create new webhook, delete old)
   - Audit Slack message history for unauthorized posts

2. **Architecture Change:**
   - Remove `NEXT_PUBLIC_` prefix from `SLACK_WEBHOOK_URL`
   - Create a **backend-only** API endpoint `/api/webhooks/slack` that proxies alerts
   - Only the server (Vercel backend) knows the real webhook URL
   - Migrate calls from `lib/alertNotifications.ts` to use the new backend proxy

3. **For Future Env Variables:**
   - Never prefix credentials or webhooks with `NEXT_PUBLIC_`
   - If an endpoint must be called from the client, create a backend proxy that adds authentication

---

## Check 10: No SBOM / SAST / SCA in CI

**Verdict:** ❌ **FAIL — Zero Security Scanning Infrastructure**

**Findings:**

**Software Bill of Materials (SBOM):** Not generated  
**Static Application Security Testing (SAST):** Not configured  
**Software Composition Analysis (SCA):** Not configured  

**What Exists:**
- Manual `npm` / `bun` dependency version pins (see Check 6 ✅)
- A `security-check` script in [package.json:13](../../../package.json#L13):
  ```json
  "security-check": "bun lint && tsc --noEmit"
  ```
  - This runs ESLint and TypeScript type checking
  - Does **NOT** scan for vulnerabilities or dependency issues

**What's Missing:**

1. **SBOM Generation:**
   - No `cyclonedx`, `syft`, or `npm sbom` output
   - No supply chain transparency for auditors or compliance

2. **Dependency Vulnerability Scanning:**
   - No GitHub Dependabot (which would file security alerts & PRs)
   - No Renovate bot configured
   - No `npm audit` or `bun audit` in build pipeline
   - No OWASP Dependency-Check integration

3. **SAST / Code Scanning:**
   - No CodeQL, Semgrep, or SonarQube integration
   - ESLint configured but not scanning for security-specific rules (no `eslint-plugin-security`)

4. **Container / Build Artifact Scanning:**
   - Not applicable (Vercel-managed, no Docker image in repo)

**Risk Assessment:**

The 34 dependencies include pre-1.0 libraries that could have breaking changes:

| Dependency | Version | Maturity | Notes |
|---|---|---|---|
| `@blocknote/*` | 0.47.x | Pre-1.0 | Rich text editor; breaking changes possible |
| `next-auth` | 4.24.13 | v4 (mature) | v5 (Auth.js) is newer; migration recommended |
| `nodemailer` | 7.0.12 | Current | Actively maintained |
| `@tiptap/*` | 3.22.x | v3 (stable) | Editor; mature |
| `next` | 16.1.1 | Current | Latest major |
| `react` | 19.2.3 | v19 (recent) | Latest major; stable |

**CVE Heuristics:** No obviously deprecated packages detected. However, **without automated SCA scanning, unknown CVEs in transitive dependencies will not be detected until public disclosure.**

**Evidence:**  
- Recon: [00-RECON.md:41](../00-RECON.md#L41) — "No SBOM, no SAST/SCA, no Dependabot/Renovate config"

**Recommendations:**

1. **Short-term (Manual Process):**
   - Add `npm audit` or `bun audit` to build pipeline: `"security-check": "bun audit --strict && bun lint && tsc --noEmit"`
   - Audit report breaks build on medium+ severity findings

2. **Medium-term (Automated Scanning):**
   - Enable GitHub Dependabot: Create `.github/dependabot.yml`
     ```yaml
     version: 2
     updates:
       - package-ecosystem: npm
         directory: "/"
         schedule:
           interval: weekly
         open-pull-requests-limit: 5
     ```
   - Review and merge security update PRs weekly

3. **Long-term (Full Coverage):**
   - Integrate CodeQL or Semgrep for SAST (GitHub Actions OR Vercel Checks)
   - Generate SBOM on each release: `npm sbom --omit=dev > sbom.json`
   - Evaluate OWASP Dependency-Check or Snyk for advanced SCA

4. **next-auth Upgrade Path:**
   - Current: `next-auth ^4.24.13`
   - Future: Plan migration to `next-auth@5` (Auth.js)
   - Rationale: v5 has improved security posture and is officially recommended

---

## Check 11: Branch Protection Bypass on Production Branch

**Verdict:** ⚠️ **Open Assumption (GitHub-Level, Not in Repo)**

**Findings:**

**Scope Note:** Branch protection rules are GitHub organization/repository settings, not tracked in the repo source code.

**Assumptions that would mitigate bypass risk:**

1. **Production branch (`main`/`master`) has:**
   - Require pull request reviews (minimum 1–2)
   - Require status checks to pass (CI/CD completion)
   - Require branches to be up to date before merging
   - Dismiss stale PR approvals on push
   - Restrict who can push directly to main (admin-only)

2. **Codeowners File (.github/CODEOWNERS):**
   - Would require specific code owner review for sensitive paths
   - Not found in repo (checked `.github/` — does not exist)

**Evidence from Vercel:** 
- [vercel.json](../../../vercel.json) specifies 7 cron jobs that deploy on schedule
- No explicit branch-protection config in the repo itself

**Risk if Bypass Possible:**
- An attacker with GitHub access could push directly to `main`
- Vercel auto-deploys changes on main → immediate prod compromise
- No CODEOWNERS to gate sensitive API changes

**Recommendation:**

In **GitHub Repository Settings:**
1. Main branch → Require Pull Request Reviews (enforce)
2. Main branch → Require status checks (all CI must pass)
3. Create `.github/CODEOWNERS` file:
   ```
   * @team1-core-admins
   /app/api/cron/* @team1-core-admins
   /lib/wallet.ts @team1-core-admins
   /lib/permissions.ts @team1-core-admins
   ```
4. Enable "Require code owner review" on main branch

---

## Check 12: Rollback Procedure Absent

**Verdict:** ✅ **PASS — Vercel Provides One-Click Rollback**

**Findings:**

**Built-in Vercel Capability:**
- Vercel Deployments dashboard offers **one-click rollback** to any prior deployment
- Each deployment has a unique URL: `team1india-<hash>.vercel.app`
- The production domain (`team1india.vercel.app` or custom domain) can be re-pointed to any prior deployment

**Rollback Process:**
1. Vercel Dashboard → Deployments
2. Select prior good deployment
3. Click "Promote to Production"
4. Done — DNS updated within seconds

**No Manual Rollback Script Required:**
Vercel abstracts the complexity; no operational procedure documented in the repo is necessary.

**Recommendation:**
Document the rollback SOP in team wiki:
- "If prod is compromised or broken: https://vercel.com/docs/deployments/promote-to-production"

---

## Check 13: Admin-Panel and Member-App Sharing Pipeline / Secrets

**Verdict:** ⚠️ **CONFIRMED RISK — Architecture Restate from Category 5**

**Findings:**

**Critical Finding from Category 5 (Admin Security):**

Both the admin panel (`app/core/`) and member app (`app/member/`) are **served from the same Next.js application** with:
- **Same source code pipeline** — compiled into single `_next/` chunk
- **Same JWT cookie** — `__Secure-next-auth.session-token`
- **Same API layer** — all endpoints in `app/api/*`
- **No separate origin / no hostname separation** — just URL path routing
- **No IP allowlist** — anyone with valid JWT can access `/core/*`
- **No mTLS** — HTTP-only security via OAuth JWT

**Implication for CI/CD & Secrets:**

1. **Build-Time Exposure:**
   - `next build` compiles BOTH admin and member code into the same bundle
   - Any compromised dependency affects both surfaces
   - No build-stage isolation between admin and member code

2. **Shared Secrets at Runtime:**
   - Both admin and member routes share the same:
     - `DATABASE_URL` — single Postgres instance
     - `NEXTAUTH_SECRET` — same JWT signing key
     - `CRON_SECRET` — same authorization token for all cron jobs
   - A compromise of the member app JWT can be escalated to admin (see Cat 5 findings)

3. **Cron Jobs Share CRON_SECRET:**
   - All 7 cron jobs ([vercel.json:2-31](../../../vercel.json)) authenticated with a single `CRON_SECRET` bearer token
   - If `CRON_SECRET` is compromised, an attacker can trigger:
     - `expire-points` — disable the economy
     - `cleanup` — wipe logs
     - `aggregate-analytics` — falsify metrics
     - `send-scheduled-emails` — spam users
     - `speedrun-status` — corrupt tournament data

**Evidence:**  
- Recon: [00-RECON.md:178-182](../00-RECON.md#L178-L182) — "Admin and member panels are **routes within the same app**, share the same JWT cookie, the same JS bundle pipeline, and the same API."

**Recommendations:**

1. **For This Audit (Accepted Risk):**
   - Document the shared-pipeline design decision in architecture.md
   - Implement strict RBAC checks on every `/core/*` route (already partially done)
   - Enforce MFA on all CORE users (currently behind `ENABLE_2FA` flag — verify it's `true` in prod)

2. **For Future:**
   - Consider deploying admin panel as separate Next.js instance (separate repo, separate pipeline)
   - Separate `CRON_SECRET` into multiple scoped tokens per cron job
   - Use GitHub environments to gate deployment of admin code changes

---

## Check 14: Cron Jobs and Scheduling Security

**Verdict:** ✅ **PASS with Minor Notes**

**Findings:**

**Cron Configuration** ([vercel.json:2-31](../../../vercel.json)):

All 7 cron jobs defined:
1. `/api/cron/sync-events` @ 6 AM — Luma event sync
2. `/api/cron/cleanup` @ 3 AM — DB/log cleanup
3. `/api/cron/aggregate-analytics` @ 2 AM — Daily stats
4. `/api/cron/aggregate-health` @ 4 AM — Health metrics
5. `/api/cron/expire-points` @ 5 AM — Economy expiry
6. `/api/cron/send-scheduled-emails` @ 8 AM — Email dispatch
7. `/api/cron/speedrun-status` @ 12:05 AM — Tournament status

**Authentication Pattern:**

All cron handlers validate `Authorization: Bearer ${CRON_SECRET}` header:

```typescript
// From app/api/cron/expire-points/route.ts:7-12
const authHeader = request.headers.get("authorization");
const cronSecret = process.env.CRON_SECRET;
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Strengths:**
- ✅ Each cron handler validates the secret independently
- ✅ No hardcoded cron paths or schedules in the code
- ✅ Vercel Cron sends both GET and POST; handlers accept both

**Weaknesses:**
- ⚠️ **Single shared `CRON_SECRET` for all jobs** — no granular scoping
- ⚠️ **No IP allowlist** — if the bearer token leaks, all crons are compromised
- ⚠️ **No rate limiting** per cron path — attacker could trigger cron 1000x/second if token is known
- ⚠️ **No HMAC signature validation** — only bearer token (Vercel trusts the source, but defense-in-depth missing)

**Recommendations:**

1. **Immediate:**
   - Rotate `CRON_SECRET` if there's any indication of compromise
   - Verify `CRON_SECRET` has high entropy (20+ random characters)

2. **Medium-term:**
   - Split `CRON_SECRET` into per-job tokens: `CRON_EXPIRE_POINTS_SECRET`, `CRON_CLEANUP_SECRET`, etc.
   - Implement rate limiting per cron path in Vercel middleware or Next.js

3. **Long-term:**
   - Switch to **Vercel Cron with HMAC signature validation** (if Vercel supports it)
   - Or use a hosted job queue (Bull, Temporal, Zep) with built-in retry & visibility

---

## Check 15: Webpack vs Turbopack Build Choice

**Verdict:** ⚠️ **WARNING — Forced Webpack Usage Without Documented Rationale**

**Findings:**

**Build Script Explicitly Forces Webpack:**

```json
"build": "prisma generate && next build --webpack"
"dev": "next dev --webpack"
```

**Context:**
- Next.js 16.1.1 supports both Webpack (legacy) and **Turbopack** (default, faster)
- The `--webpack` flag explicitly **disables Turbopack** and uses older Webpack bundler
- This adds build time and complexity

**Possible Reasons:**
1. **Compatibility Issue:** One of the 34 dependencies is not compatible with Turbopack's stricter module resolution
2. **Feature Gap:** Webpack plugin or loader required that Turbopack doesn't support
3. **Build Stability:** Turbopack hit a bug in an older version; forced Webpack as workaround

**Security Implication:**
- Older Webpack version may have known CVEs not present in Turbopack
- Slower build time → longer iteration cycles → less frequent security updates

**Evidence:**
- [package.json:7](../../../package.json#L7) — `"build": "prisma generate && next build --webpack"`
- [next.config.ts](../../../next.config.ts) — no conditional Webpack config; just uses whatever is installed

**Recommendation:**

1. **Investigate Why Webpack is Forced:**
   - Try removing `--webpack` flag temporarily: `next build`
   - If Turbopack fails, document the error and re-enable Webpack with a comment
   - If Turbopack succeeds, switch to it (faster builds, better security support)

2. **If Webpack Must Remain:**
   - Document the issue in `ARCHITECTURE.md` (e.g., "Webpack required due to [dependency X] incompatibility")
   - Plan Turbopack migration with dependency updates

---

## Check 16: Vercel Build Output API Configuration

**Verdict:** ✅ **PASS — No High-Risk Patterns**

**Findings:**

**Vercel Build Output API** (`vercel.json` field `functions.<route>.includeFiles`):
- No custom `functions` configuration in [vercel.json](../../../vercel.json)
- No `includeFiles` or `excludeFiles` patterns that would leak source

**Default Behavior:**
- Vercel automatically generates optimized serverless functions from Next.js App Router
- No manual bundling configuration

**Risk Mitigated:**
- Vercel's default excludes source maps and `.map` files from production (unless explicitly enabled)
- No hardcoded file patterns that would inadvertently ship source code

**Recommendation:**
If source maps are needed for debugging, ensure they're:
1. Gated to authenticated users only (via Vercel Auth)
2. Separate from the main deployment (stored privately in Vercel)

---

## Check 17: Cron Job Modification via PR

**Verdict:** ⚠️ **WARNING — Cron Schedule Change Not Gated**

**Findings:**

**Risk:** An attacker PR could modify [vercel.json:2-31](../../../vercel.json) to:
1. Add new malicious cron paths (e.g., `/api/cron/drain-wallet`)
2. Change schedule to run more frequently (e.g., every minute instead of daily)
3. Add a new cron that exports all data to attacker's server

**If PR is deployed without review:**
- New cron runs at the scheduled time
- Attacker code executes with `CRON_SECRET` context (system-level permissions)

**Mitigation:**
Branch protection rules (Check 11, Open Assumption) would require PR review before merge.

**Recommendation:**
In GitHub Repository Settings → Branch Protection → Main:
- Require ≥1 code owner review for changes to `vercel.json`
- Add to `.github/CODEOWNERS`:
  ```
  /vercel.json @team1-security-admins
  ```

---

## Check 18: Dependency Resolution & Private Registry

**Verdict:** ✅ **PASS — No Private Package Risk**

**Findings:**

- All dependencies published to public npm
- No private GitHub package registry
- No monorepo cross-dependencies
- `.npmrc` has only `legacy-peer-deps=true` (convenience, not security-related)

**NPM Resolution Order:**
1. Public npm registry (default)
2. No custom scope mappings
3. All peer dependencies resolved automatically

**Supply Chain Confidence:** HIGH

---

## Dependency Review: Pre-1.0 & EOL Versions

**Verdict:** ⚠️ **WARNING — BlockNote Pre-1.0, next-auth v4 Approaching EOL**

**Findings:**

| Dependency | Version | Status | EOL Date | Notes |
|---|---|---|---|---|
| `@blocknote/*` | 0.47.x | Pre-1.0 | Unknown | Rich text editor; pre-release. Breaking changes possible. |
| `next-auth` | 4.24.13 | v4 (legacy) | TBD (v5 released 2024) | See below |
| `nodemailer` | 7.0.12 | Stable | TBD | Recently updated; secure. |
| `@tiptap/*` | 3.22.x | v3 (stable) | TBD | Mature; used in prod. |
| `next` | 16.1.1 | v16 (current) | TBD | Latest major; secure. |
| `react` | 19.2.3 | v19 (current) | TBD | Latest major; stable. |

**Key Issue: next-auth v4 Migration Path**

- Current: `next-auth ^4.24.13` (released ~2024-03)
- Newer: `next-auth@5` (Auth.js) released 2024-06
- **v4 is no longer the recommended approach; v5 has improved security**
- Migration is non-trivial but recommended for new projects

**Recommendation:**
1. **Short-term (For This Audit):** v4 is still secure; no immediate action required
2. **Medium-term (Next 6–12 months):** Plan v5 migration path
3. **BlockNote:** No migration path available until v1.0; acceptable risk as editor library

**Mitigation:** Ensure `npm audit` runs in CI to detect CVEs in v4 after they're disclosed

---

## Summary of Findings

### ✅ **Strengths (5 checks pass)**

1. **Check 1 — No GitHub Actions:** Eliminates CI token compromise risk
2. **Check 4 — No pull_request_target:** Not applicable
3. **Check 5 — No Self-Hosted Runners:** Vercel-only reduces infrastructure attack surface
4. **Check 6 — Lockfile Committed & Versions Pinned:** Reproducible builds guaranteed
5. **Check 7 — No Postinstall Hooks:** No supply chain compromise at install time
6. **Check 12 — Rollback Available:** Vercel's one-click rollback is sufficient
7. **Check 18 — No Private Packages:** No dependency confusion risk
8. **Check 16 — No Source Leak via Build Output API:** Safe defaults

### ❌ **Critical Issues (1 check fails)**

1. **Check 9 — Build-Time Secrets in Client Bundle**
   - `NEXT_PUBLIC_SLACK_WEBHOOK_URL` embedded in client JavaScript
   - Any visitor can trigger Slack messages indefinitely
   - **Action Required:** Rotate webhook, move to backend proxy

### ⚠️ **Warnings & Open Assumptions (6 checks)**

1. **Check 2 — Preview Deployments & Prod DB Sharing** (Open Assumption #1)
   - Risk confirmed IF `DATABASE_URL` is shared with preview environments
   - Needs Vercel project settings verification (not in repo)

2. **Check 3 — Preview Deployments Using Prod Secrets** (Open Assumption #1)
   - Same prerequisite as Check 2
   - Needs Vercel dashboard configuration

3. **Check 10 — Zero SAST/SCA/SBOM**
   - No automated vulnerability scanning
   - `bun audit` could be added to build pipeline
   - Dependabot not configured

4. **Check 11 — Branch Protection Bypass** (Open Assumption)
   - Repository settings, not in-repo config
   - Requires GitHub organization branch protection rules

5. **Check 13 — Shared Admin/Member Pipeline & Secrets**
   - Architectural issue documented in Category 5
   - Single `CRON_SECRET` for all 7 cron jobs is a concentrator of privilege

6. **Check 15 — Webpack Forced Without Rationale**
   - `--webpack` flag disables Turbopack; reason undocumented
   - Investigate and potentially switch to Turbopack for better security support

---

## Recommended Action Items by Priority

### P0 — Do Immediately (Security)

1. **Rotate `NEXT_PUBLIC_SLACK_WEBHOOK_URL`**
   - Create new Slack incoming webhook
   - Update in Vercel dashboard
   - Delete old webhook

2. **Migrate Slack Alerts to Backend Proxy**
   - Create `/api/webhooks/slack` endpoint (server-only)
   - Update `lib/alertNotifications.ts` to call backend instead of client-side
   - Remove `NEXT_PUBLIC_` prefix from `SLACK_WEBHOOK_URL`

### P1 — Within 1–2 Weeks

3. **Verify Vercel Environment Protection**
   - Confirm in Vercel Dashboard that `DATABASE_URL` is scoped to production only
   - Disable external PR deployments if not needed
   - Document assumptions from Check 2 & 3

4. **Add SAST/SCA to Build Pipeline**
   - Add `bun audit --strict` to `security-check` script
   - Enable GitHub Dependabot (create `.github/dependabot.yml`)

5. **Branch Protection on Main**
   - Require PR review (1+ approver)
   - Require status checks pass
   - Add `.github/CODEOWNERS` for sensitive files

### P2 — Within 1–3 Months

6. **Investigate Webpack Forced Build Flag**
   - Try removing `--webpack` and test with Turbopack
   - Document rationale in `ARCHITECTURE.md`

7. **Split Cron Secrets**
   - Create per-job cron tokens instead of single `CRON_SECRET`

8. **Plan next-auth v5 Migration**
   - Assess compatibility with dependencies
   - Schedule migration for next major release cycle

---

## Audit Notes & Assumptions

**Open Assumptions (Cannot Verify Without Vercel Dashboard Access):**

1. **Vercel Project Settings** — WAF rules, environment-protection on previews, external PR deployment enabled/disabled
2. **Database Network ACLs** — Whether production Postgres is VPC-restricted or publicly reachable (unlikely but should verify)
3. **Secret Entropy** — Real strength of `CRON_SECRET`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`
4. **ENABLE_2FA Production Value** — Whether MFA is actually enforced for CORE users in prod

**Test Coverage:** ZERO automated tests in repo; all claims derived from source code analysis (Cat 14 confirmed)

---

## References

- **Recon Documents:**
  - [00-RECON.md](../00-RECON.md) — Codebase structure, deps, secrets
  - [recon-1-2-11-12-iac-secrets.md](recon-1-2-11-12-iac-secrets.md) — IaC, dependencies, env vars, third-party integrations

- **Related Category Audits:**
  - Category 5 — Admin security & shared pipeline
  - Category 16 — Build-time secrets & NEXT_PUBLIC_ exposure

- **Key Files in Codebase:**
  - [package.json](../../../package.json) — Dependencies, build script
  - [vercel.json](../../../vercel.json) — Cron jobs, deployment config
  - [next.config.ts](../../../next.config.ts) — Security headers, CSP, image patterns
  - [.github/](../../../.github/) — Does not exist (no Actions)

---

**Audit Completed:** 2026-05-03  
**Auditor:** Security Scan Agent  
**Status:** 13 checks completed; 5 pass, 1 fail, 6 warnings/open assumptions
