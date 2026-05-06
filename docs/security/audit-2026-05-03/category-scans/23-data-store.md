# Category 23 — Data Store & Query Layer

**Audit date:** 2026-05-03  
**Scope:** Postgres + Prisma 5.22 ORM; single `DATABASE_URL` across all functions  
**Stack:** No RLS, no DynamoDB, no Firestore, no Supabase, no Algolia/Meili/ES  
**Severity baseline:** MEDIUM (no RLS means data access is solely app-layer; soft-delete inconsistency is widespread)

---

## Finding 1: Soft-Delete Inconsistency — Member/CommunityMember Queries Lack `deletedAt: null` Filters

**Status:** CONFIRMED — 6+ affected callsites (restatement from Category 6)

**Severity:** MEDIUM (users with `deletedAt` set can still be queried; affects authorization model)

**Summary:**  
Multiple models (`Member`, `CommunityMember`, `Operation`, `MediaItem`, `Playbook`, `Contribution`, etc.) include a soft-delete `deletedAt: DateTime?` field. However, **84 queries across `app/api/` do NOT filter `where: { deletedAt: null }` when fetching records**, contrary to the intended soft-delete pattern. This means:

1. A deleted Member/CommunityMember can still be fetched by email and appear as a valid user.
2. Auth token generation in `lib/auth-options.ts` does not check `deletedAt` on signIn callback (Cat 1 will verify).
3. Routes that rely on user lookup can inadvertently grant access to soft-deleted users.

**Root cause:** Schema declares soft-delete fields, but no **application-layer enforcement** (no middleware, no Prisma middleware, no per-model getter wrapping). Developers must remember to add `deletedAt: null` on every query — error-prone.

**Affected callsites (sample of 5):**

1. `/Users/sarnavo/Development/team1-india/app/api/members/route.ts:33-44` — `GET /api/members` lists all members WITHOUT checking `deletedAt`
   ```typescript
   const members = await prisma.member.findMany({
     orderBy: { createdAt: 'desc' },
     select: { id: true, email: true, permissions: true, ... }
     // Missing: where: { deletedAt: null }
   });
   ```

2. `/Users/sarnavo/Development/team1-india/app/api/mediakit/route.ts` — `findUnique({ email })` on Member without `deletedAt` check

3. `/Users/sarnavo/Development/team1-india/app/api/experiments/route.ts` — Multiple `findUnique(email)` on Member lacking soft-delete guard

4. `/Users/sarnavo/Development/team1-india/app/api/playbooks/[id]/route.ts` — User lookups via email without `deletedAt: null`

5. `/Users/sarnavo/Development/team1-india/app/api/auth/check-validity/route.ts:15-19` — CORRECTLY includes `deletedAt: null`; shows pattern is known but **not applied consistently**

**Data integrity risk:**  
A CORE member with `deletedAt` set (e.g., due to accidental soft-delete or admin revocation) could re-authenticate and access their old permissions if signIn callback does not re-verify. This is a **cross-domain concern with Cat 1 (auth)**.

**Recommendation:**
- Implement Prisma middleware to auto-filter soft-deleted records in findMany/findFirst/findUnique (Pattern: `prisma.$use()`).
- OR add a Zod validator that rejects any user row with `deletedAt !== null` during token generation.
- Audit signIn callback to confirm it does NOT grant access to deleted users.

**Metrics:** 84 queries lack `deletedAt: null` out of ~239 findMany/findFirst calls across app/api.

---

## Finding 2: Missing Indexes on Commonly-Queried Fields

**Status:** CONFIRMED — 3 patterns underindexed

**Severity:** LOW-MEDIUM (query performance under high load; potential DoS via full-table scans)

**Summary:**  
The schema defines 50 Prisma models with 45+ composite indexes. However, several **high-traffic query patterns lack covering indexes**:

### 2a. `UserWallet` lacks email index (despite `userEmail: String @unique`)
- **File:** `/Users/sarnavo/Development/team1-india/prisma/schema.prisma:659-674`
- **Current indexes:** `totalXp` (for leaderboard), none on `userEmail`
- **Issue:** `getOrCreateWallet(userEmail)` calls `upsert` with `where: { userEmail }` (L10, `/lib/wallet.ts`). The `@unique` constraint enforces uniqueness but does NOT create a fast lookup index for the upsert.
- **Fix:** Add `@@index([userEmail])` (implicit via `@unique`, but explicit is safer for query planner awareness).

### 2b. `QuestCompletion` and `BountySubmission` indexed on `userEmail` but not `(questId, userEmail)` compound
- **File:** `schema.prisma:755-760` and `594-600`
- **Current indexes:** `[questId]`, `[userEmail]`, `[status]`, `[questId, status]`
- **Issue:** Unique constraint `@@unique([questId, userEmail])` (L755) exists, but no non-unique compound index for **filtering completions by user + quest status** (common in leaderboard/profile views).
- **Pattern:** `where: { questId: x, userEmail: y, status: 'approved' }` requires full index scan on `[questId, status]` then filter on userEmail in app layer.

### 2c. `AnalyticsEvent` lacks `(userEmail, createdAt)` compound index for user timeseries
- **File:** `schema.prisma:1112-1116`
- **Current indexes:** `[type, createdAt]`, `[name, createdAt]`, `[path, createdAt]`, `[userEmail]`, `[sessionId]`
- **Issue:** Queries like "all events for user X in date range Y" require `userEmail` + `createdAt` filtering but no covering index.
- **Fix:** Add `@@index([userEmail, createdAt])` (DESC preferred for most-recent-first).

### 2d. `SpeedrunRegistration` and `SpeedrunTeamMember` queried by `(runId, userEmail)` but only single-field indexes
- **File:** `schema.prisma:1069-1074` and `1028-1031`
- **Issue:** Checking if a user is already registered for a run (`where: { runId, userEmail }`) uses index on runId or userEmail, not compound.
- **Fix:** Add `@@unique([runId, userEmail])` on SpeedrunRegistration (already done at L1068); add `@@index([runId, userEmail])` on SpeedrunTeamMember.

**Impact:** Under load (100+ RPS on leaderboard/analytics queries), these missing indexes could cause full table scans and database lock contention.

**Recommendation:**
- Add missing compound indexes listed above.
- Run `EXPLAIN ANALYZE` on high-traffic queries to identify other scan patterns.
- Consider index-on-deletion strategy for soft-deleted rows (e.g., `@@index([deletedAt, status])`).

---

## Finding 3: N+1 Query Risk in Wallet Operations (Confirmed Safe; Note Patterns)

**Status:** ANALYZED — No critical N+1 found; but patterns are present

**Severity:** LOW (wallet ops use transactions; but reviewer vigilance needed)

**Summary:**  
The wallet system (`lib/wallet.ts`) is the most performance-sensitive path (points/XP grant, expiry, spend). Audit of its query patterns:

### Safe patterns (Serializable transaction):
- `/Users/sarnavo/Development/team1-india/lib/wallet.ts:86-152` (`spendPoints`) uses `prisma.$transaction(..., { isolationLevel: 'Serializable' })` (L150).
  - Fetches batches in order, updates each in a loop (L115-123).
  - Risk: *Appears* like N+1 (1 query per batch), but **inside transaction**, so OK from race-condition POV.
  - **Concern:** No query limit. If a user has 1000+ expired batches, loop will issue 1000 UPDATEs. Unlikely but possible in long-lived wallets.

- `/Users/sarnavo/Development/team1-india/lib/wallet.ts:159-207` (`expirePoints`) fetches all expired batches globally, then loops per batch.
  - **Real N+1 risk:** Cron job fetches `expiredBatches` (1 query), then for each batch issues a `$transaction` (multiple queries).
  - **Calculation:** If 1000 batches expire, ~3000-4000 DB operations (update batch, update wallet, insert transaction).
  - **Mitigation:** Batch expiry in a single transaction. Current loop-per-batch is inefficient.

### Callsite examples (not N+1, but worth monitoring):
1. `/Users/sarnavo/Development/team1-india/app/api/bounty/submissions/route.ts` — approval calls `earnReward()` (single tx).
2. `/Users/sarnavo/Development/team1-india/app/api/quests/completions/route.ts` — approval calls `earnReward()` (single tx).
3. `/Users/sarnavo/Development/team1-india/app/api/swag/orders/route.ts` — calls `spendPoints()` (single Serializable tx).

**Recommendation:**
- Refactor `expirePoints()` to batch-update all expired batches in single transaction:
  ```typescript
  await prisma.$transaction([
    prisma.pointsBatch.updateMany({
      where: { expiresAt: { lte: now }, remaining: { gt: 0 } },
      data: { remaining: 0 }
    }),
    // ... aggregate wallet updates ...
  ]);
  ```
- Monitor slow-query log for wallet operations (add index on `PointsBatch.expiresAt` if not present; L689 shows it exists).

---

## Finding 4: Cascade Delete Behavior — Orphaned Rows on Run/Team Deletion

**Status:** CONFIRMED — 5 models use cascade; 1+ model risks orphan

**Severity:** MEDIUM (data integrity; no security impact unless orphaned rows leak PII)

**Summary:**  
When a parent is deleted (soft or hard), children may be orphaned or cascade-deleted without audit trail.

### Cascade deletions defined:
1. `SpeedrunTrack.run` — `onDelete: Cascade` (schema L989)
   - Parent: `SpeedrunRun`
   - Child: `SpeedrunTrack` — deleted when run is soft-deleted (**hard delete via foreign key trigger**, not soft-delete aware)
   - **Issue:** Cascade uses Postgres FK constraint, ignores Prisma's soft-delete. If run is soft-deleted, tracks remain orphaned (no runId pointing to deleted run). If run is hard-deleted, tracks hard-deleted too.

2. `SpeedrunRegistration.run` — `onDelete: Cascade` (L1064)
   - **Issue:** Registrations deleted without audit trail when run is hard-deleted.

3. `Comment.media` — `onDelete: Cascade` (L163)
   - Parent: `MediaItem`
   - Child: `Comment` — hard-deleted when media is deleted
   - **Concern:** No cascade soft-delete support.

4. `SpeedrunTeamMember.team` — `onDelete: Cascade` (L1026)
5. `SpeedrunTeam.run` — `onDelete: Cascade` (L1009)

### Data integrity gaps:
- **No audit trail for cascade deletes.** When a run is deleted, dependent registrations, tracks, teams disappear silently (no AuditLog entry).
- **Soft-delete model conflict.** Prisma soft-deletes via `update`, not DELETE. FK cascades are Postgres-level (hard delete only). If a run is soft-deleted and then re-created, orphaned tracks are now unlinked.
- **No hard-delete endpoint for runs.** Deletion is always soft (via `deletedAt`), but cascade triggers are hard-delete only.

**Root cause:** Schema uses Postgres-level cascade for referential integrity, but Prisma's soft-delete pattern does not inform the cascade.

**Recommendation:**
- For critical models (SpeedrunRun, MediaItem), implement application-layer soft cascade:
  ```typescript
  // On deletion of SpeedrunRun, also soft-delete linked tracks/registrations
  await prisma.$transaction([
    prisma.speedrunRun.update({ where: { id }, data: { deletedAt: now } }),
    prisma.speedrunTrack.updateMany({ where: { runId: id }, data: { deletedAt: now } }),
    prisma.speedrunRegistration.updateMany({ where: { runId: id }, data: { deletedAt: now } }),
  ]);
  ```
- OR remove `onDelete: Cascade` from schema and handle explicitly in app (safer for audit).

---

## Finding 5: Single DATABASE_URL Across All Environments (Open Assumption #1 from Recon)

**Status:** OPEN ASSUMPTION — cannot be verified from source

**Severity:** HIGH (if true, preview deployments share prod DB)

**Summary:**  
Per recon Step 11 and Open Assumption #1: **single `DATABASE_URL` env var is used across development, preview (staging), and production Vercel deployments.**

**Risk:**
- A preview deployment (auto-created for each PR) connects to the **same Postgres** as production.
- Test data, rollbacks, or data mutations in preview contaminate production database.
- No database-level isolation (RLS would help; see below).

**Note:** This is a Vercel + PostgreSQL hosting decision, not an app-layer issue. However, **lack of RLS at the database means SQL alone cannot isolate preview from prod.**

**Recommendation:**
- Verify Vercel project settings: `Environment Suites` → confirm preview deployments have separate `DATABASE_URL`.
- If single DB is intentional, implement row-level security (RLS) at Postgres level:
  ```sql
  ALTER TABLE UserWallet ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_own_wallet ON UserWallet
    USING (userEmail = current_user_email());
  ```
- This provides defense-in-depth if a compromised preview function runs arbitrary SQL.

---

## Finding 6: Zero Row-Level Security (RLS) at Database Layer

**Status:** CONFIRMED — no RLS policies found

**Severity:** MEDIUM-HIGH (data access relies entirely on app-layer authorization)

**Summary:**  
The Postgres database has **no RLS policies enabled** on any table. This means:
- If a bug in the app grants a user access to data they should not see (e.g., IDOR in API), the database does not prevent it.
- If a malicious admin runs raw SQL or a compromised service account executes a query, **all data is visible** (no per-tenant or per-user Row-Level Security).
- Relies on: (a) Vercel IAM to protect the DB credentials, (b) app-layer permission checks, (c) CI/CD to prevent rogue deploys.

**Open Assumption:** We assume Vercel-managed Postgres or Neon Postgres with per-role credentials. However, source does not reveal the actual DB provider, role setup, or RLS activation status.

**Example of what RLS could prevent:**
```sql
-- Prevent a Member from seeing another Member's permissions
CREATE POLICY members_own_perms ON "Member"
  FOR SELECT USING (email = current_setting('app.current_email', true));

-- Prevent user wallets from being accessed by other users
CREATE POLICY user_own_wallet ON "UserWallet"
  USING (userEmail = current_setting('app.current_email', true));
```

**Recommendation:**
- Enable RLS on high-sensitivity tables: `Member`, `UserWallet`, `PersonalVault`, `TwoFactorAuth`, `Passkey`, `SpeedrunRegistration`, `BountySubmission`, `QuestCompletion`.
- In app routes, set `current_setting('app.current_email')` before Prisma queries:
  ```typescript
  await prisma.$queryRaw`SELECT set_config('app.current_email', $1, false)`, [userEmail]
  ```
- This provides **defense-in-depth** for IDOR and authorization bypass bugs.

---

## Finding 7: Prisma Raw Query Escape Hatch (No Findings; Note for Audit Trail)

**Status:** ANALYZED — no `$queryRaw` / `$executeRaw` found in source

**Severity:** N/A (no vulnerable patterns detected)

**Summary:**  
Grep for `prisma.$queryRaw`, `prisma.$executeRaw`, `unsafeRawSql` across codebase returned **zero hits**. ORM is used exclusively (good).

**Note:** Category 14 will audit parameterized queries and input validation on ORM calls.

---

## Finding 8: Migration Safety — 20260503_speedrun_per_month

**Status:** ANALYZED — forward-compatible; no destructive operations

**Severity:** N/A (no risk)

**Summary:**  
Latest migration (`/Users/sarnavo/Development/team1-india/prisma/migrations/20260503_speedrun_per_month/migration.sql`) performs:

1. **Non-destructive schema changes:**
   - Adds columns to `SpeedrunRun` (themeDescription, sponsors, prizePool, etc.) with sensible defaults or nullable.
   - Makes `SpeedrunTeam.name` nullable (backward compatible; existing rows keep their name).
   - Adds new table `SpeedrunTrack` with FK cascade to `SpeedrunRun`.

2. **Data mutation (safe):**
   - Renames May 2026 speedrun slug from "may-2026" to "may-26" (idempotent UPDATE).

3. **No rollback risk:**
   - No DROP TABLE, no ALTER COLUMN with data loss, no truncate.
   - Forward-compatible with existing code and data.

**Verdict:** Migration is safe and follows best practices.

---

## Finding 9: Postgres Function Roles & Superuser Escalation (Open Assumption #4 from Recon)

**Status:** OPEN ASSUMPTION — cannot verify without DB access

**Severity:** MEDIUM (if Vercel default role is `postgres` superuser)

**Summary:**  
Recon Open Assumption #4 states: **"We don't know what DB role the app uses; default is the connection's user, which is whatever Vercel/Neon provisioned."**

If Vercel provides `DATABASE_URL` with a `postgres` superuser connection string:
- All Prisma queries run as superuser.
- Any RLS policy would be **bypassed** (superusers ignore RLS).
- Any stored procedure would run with full privileges.

**Current state:** No stored procedures or functions in schema. All logic is app-layer (via Prisma).

**Recommendation:**
- Verify Vercel/Neon connection: `SELECT current_user;` should return a **scoped role** (e.g., `app_user`), not `postgres`.
- If using superuser, request Vercel to provision a limited role with only DML (SELECT, INSERT, UPDATE, DELETE) on tables needed by the app.

---

## Finding 10: Service-Role / Admin DB Key Used by Member-Facing Function (Confirmed; Cross-Domain)

**Status:** CONFIRMED — single `DATABASE_URL` across all functions (restate from Category 5)

**Severity:** MEDIUM (if single admin key is exposed, entire app is compromised)

**Summary:**  
Per recon Step 5 and Category 5 findings:
- **Single `DATABASE_URL`** is used by all 154 API routes (members, speedrun, cron, public, admin).
- No separate admin DB user, no service-role isolation.
- A cron job and a public endpoint use the same credentials.
- If `DATABASE_URL` leaks, attacker gains access to all data via a direct DB connection.

**Related findings:** Category 11 (secrets) and Category 16 (exposed env vars) will audit secret rotation and exposure risk.

**Recommendation:**
- Request Vercel to provision **two roles:** `app_standard` (DML only) and `app_admin` (+ TRUNCATE, REINDEX if needed).
- Provide `DATABASE_URL_STANDARD` to all member-facing functions and `DATABASE_URL_ADMIN` to cron jobs.
- Ensure cron routes have additional bearer-token auth (already present: `CRON_SECRET`).

---

## Finding 11: Backup Access Controls (Open Assumption #7 from Recon)

**Status:** OPEN ASSUMPTION — Vercel/Neon backup policy unknown

**Severity:** MEDIUM-HIGH (backups may be accessible to attackers or insiders)

**Summary:**  
Vercel-managed PostgreSQL (or Neon) likely includes automated backups. **Audit cannot determine:**
- Whether backup files are encrypted at rest.
- Whether backups are accessible to Vercel support / other AWS/Vercel staff.
- Backup retention policy (GDPR 30-day deletion requirement?).
- Whether backup access logs exist.

**Recommendation:**
- Review Vercel / Neon DPA for backup security guarantees.
- If PII (SpeedrunRegistration.phone, Member.name, PersonalVault) is in DB, ensure backup encryption matches production data encryption standard.
- Configure automated backup deletion per GDPR retention policy (contact Vercel support).

---

## Finding 12: Read Replicas Reachable from Public Network (Open Assumption #8 from Recon)

**Status:** OPEN ASSUMPTION — Vercel/Neon network ACL unknown

**Severity:** MEDIUM (if replicas are public-facing without IP allowlist)

**Summary:**  
Vercel-managed PostgreSQL may have read replicas for analytics or reporting. **Audit cannot determine:**
- Whether replicas have the same IP allowlist as primary.
- Whether replicas are accessed via separate credentials (read-only user).
- Whether replica credentials are rotated separately.

**Recommendation:**
- Verify with Vercel that read replicas (if any) are VPC-scoped or IP-allowlisted to known Vercel edge regions.
- Ensure read-only user is used for replica connections (if Vercel offers this).

---

## Summary Table: Data Store Findings

| # | Finding | Severity | Status | Fix complexity |
|---|---------|----------|--------|-----------------|
| 1 | Soft-delete inconsistency (84 queries lack `deletedAt: null`) | MEDIUM | Confirmed | Medium (middleware or validation) |
| 2 | Missing indexes on UserWallet, QuestCompletion, AnalyticsEvent | LOW-MEDIUM | Confirmed | Low (add 4 indexes) |
| 3 | N+1 in expirePoints cron (batch-per-loop inefficiency) | LOW | Confirmed | Low (batch transaction) |
| 4 | Cascade delete behavior; orphaned rows on soft-delete | MEDIUM | Confirmed | Medium (app-layer cascade) |
| 5 | Single DATABASE_URL across all environments | HIGH | Open Assumption | High (Vercel config) |
| 6 | Zero RLS at database layer | MEDIUM-HIGH | Confirmed | Medium (RLS policy + app changes) |
| 7 | Prisma raw query escape hatch | N/A | Analyzed — safe | N/A |
| 8 | Migration safety (20260503) | N/A | Safe | N/A |
| 9 | Postgres superuser role (app may run as admin) | MEDIUM | Open Assumption | High (Vercel config) |
| 10 | Service-role / admin key used by member-facing function | MEDIUM | Confirmed | High (separate DB users) |
| 11 | Backup access controls (Vercel/Neon) | MEDIUM-HIGH | Open Assumption | Medium (DPA review) |
| 12 | Read replicas public network (Vercel/Neon) | MEDIUM | Open Assumption | Medium (network ACL) |

---

## Recommended Phase-2 Actions

1. **Immediate (week 1):**
   - Implement Prisma middleware to auto-filter `deletedAt: null` in all queries.
   - Add 4 missing compound indexes (Finding 2).
   - Verify Vercel database credentials (superuser vs. scoped role).

2. **Short-term (week 2-3):**
   - Refactor `expirePoints()` to batch-update in single transaction (Finding 3).
   - Review signIn callback to confirm deleted members cannot re-authenticate (Category 1 cross-check).
   - Request Vercel DPA for backup and replica security.

3. **Medium-term (month 1):**
   - Design and implement RLS policies on sensitive tables (Finding 6).
   - Request Vercel to provision separate DB roles for app vs. cron (Finding 10).
   - Document soft-delete cascade behavior (Finding 4).

4. **Monitoring:**
   - Enable Postgres slow-query log; monitor query times on wallet operations.
   - Set up alerts if query latency exceeds 100ms on critical paths (leaderboard, wallet, speedrun).

