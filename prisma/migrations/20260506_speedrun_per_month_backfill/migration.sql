-- Backfill migration for `20260503_speedrun_per_month`.
--
-- Background: that earlier migration was marked as applied during a database
-- baselining step, but its SQL was never actually executed against this DB.
-- This migration re-applies the same operations using IF NOT EXISTS / DO $$
-- guards so it is idempotent and safe to run regardless of which (if any)
-- objects from the original were already created.
--
-- Verified state at time of authoring (2026-05-05):
--   - `SpeedrunTrack` does not exist
--   - `UserProject.{videoUrl, socialPostUrl, speedrunRunId, speedrunTrackId, speedrunTeamId}` do not exist
--   - `SpeedrunRun.{themeDescription, sponsors, prizePool, hostCities, submissionOpenDate, irlEventDate, winnersDate, faq}` do not exist
--   - `SpeedrunRegistration.showSocials` does not exist
--   - `SpeedrunTeam.name` is still NOT NULL
--   - `SpeedrunRun` has 1 row with slug = 'may-2026'

-- ============================================================================
-- SpeedrunRun: long-form content + concrete dates
-- ============================================================================
ALTER TABLE "SpeedrunRun" ADD COLUMN IF NOT EXISTS "themeDescription"   TEXT;
ALTER TABLE "SpeedrunRun" ADD COLUMN IF NOT EXISTS "sponsors"           JSONB;
ALTER TABLE "SpeedrunRun" ADD COLUMN IF NOT EXISTS "prizePool"          TEXT;
ALTER TABLE "SpeedrunRun" ADD COLUMN IF NOT EXISTS "hostCities"         TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "SpeedrunRun" ADD COLUMN IF NOT EXISTS "submissionOpenDate" TIMESTAMP(3);
ALTER TABLE "SpeedrunRun" ADD COLUMN IF NOT EXISTS "irlEventDate"       TIMESTAMP(3);
ALTER TABLE "SpeedrunRun" ADD COLUMN IF NOT EXISTS "winnersDate"        TIMESTAMP(3);
ALTER TABLE "SpeedrunRun" ADD COLUMN IF NOT EXISTS "faq"                JSONB;

-- ============================================================================
-- SpeedrunTeam: drop NOT NULL on name (idempotent — DROP NOT NULL on an
-- already-nullable column is a no-op in Postgres)
-- ============================================================================
ALTER TABLE "SpeedrunTeam" ALTER COLUMN "name" DROP NOT NULL;

-- ============================================================================
-- SpeedrunRegistration: opt-in social visibility
-- ============================================================================
ALTER TABLE "SpeedrunRegistration"
    ADD COLUMN IF NOT EXISTS "showSocials" BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- SpeedrunTrack: per-run track lineup
-- ============================================================================
CREATE TABLE IF NOT EXISTS "SpeedrunTrack" (
    "id"          TEXT NOT NULL,
    "runId"       TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "iconKey"     TEXT,
    "tagline"     TEXT NOT NULL,
    "description" TEXT,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeedrunTrack_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SpeedrunTrack_runId_name_key" ON "SpeedrunTrack"("runId", "name");
CREATE INDEX        IF NOT EXISTS "SpeedrunTrack_runId_idx"       ON "SpeedrunTrack"("runId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SpeedrunTrack_runId_fkey'
    ) THEN
        ALTER TABLE "SpeedrunTrack"
            ADD CONSTRAINT "SpeedrunTrack_runId_fkey"
            FOREIGN KEY ("runId") REFERENCES "SpeedrunRun"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- UserProject: link projects back to a Speedrun run/track/team + richer media
-- ============================================================================
ALTER TABLE "UserProject" ADD COLUMN IF NOT EXISTS "videoUrl"        TEXT;
ALTER TABLE "UserProject" ADD COLUMN IF NOT EXISTS "socialPostUrl"   TEXT;
ALTER TABLE "UserProject" ADD COLUMN IF NOT EXISTS "speedrunRunId"   TEXT;
ALTER TABLE "UserProject" ADD COLUMN IF NOT EXISTS "speedrunTrackId" TEXT;
ALTER TABLE "UserProject" ADD COLUMN IF NOT EXISTS "speedrunTeamId"  TEXT;

CREATE INDEX IF NOT EXISTS "UserProject_speedrunRunId_idx"   ON "UserProject"("speedrunRunId");
CREATE INDEX IF NOT EXISTS "UserProject_speedrunTrackId_idx" ON "UserProject"("speedrunTrackId");
CREATE INDEX IF NOT EXISTS "UserProject_speedrunTeamId_idx"  ON "UserProject"("speedrunTeamId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserProject_speedrunRunId_fkey'
    ) THEN
        ALTER TABLE "UserProject"
            ADD CONSTRAINT "UserProject_speedrunRunId_fkey"
            FOREIGN KEY ("speedrunRunId") REFERENCES "SpeedrunRun"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserProject_speedrunTrackId_fkey'
    ) THEN
        ALTER TABLE "UserProject"
            ADD CONSTRAINT "UserProject_speedrunTrackId_fkey"
            FOREIGN KEY ("speedrunTrackId") REFERENCES "SpeedrunTrack"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserProject_speedrunTeamId_fkey'
    ) THEN
        ALTER TABLE "UserProject"
            ADD CONSTRAINT "UserProject_speedrunTeamId_fkey"
            FOREIGN KEY ("speedrunTeamId") REFERENCES "SpeedrunTeam"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- Slug rename: "may-2026" → "may-26" (idempotent)
-- ============================================================================
UPDATE "SpeedrunRun" SET "slug" = 'may-26' WHERE "slug" = 'may-2026';
