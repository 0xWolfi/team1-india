-- Speedrun: per-month run redesign
-- Adds run-level content fields, a per-run Track model, project linkage on
-- UserProject, opt-in social visibility on registrations, and renames the
-- May-2026 slug from "may-2026" to "may-26".

-- ============================================================================
-- SpeedrunRun: long-form content + concrete dates
-- ============================================================================
ALTER TABLE "SpeedrunRun" ADD COLUMN     "themeDescription"   TEXT;
ALTER TABLE "SpeedrunRun" ADD COLUMN     "sponsors"           JSONB;
ALTER TABLE "SpeedrunRun" ADD COLUMN     "prizePool"          TEXT;
ALTER TABLE "SpeedrunRun" ADD COLUMN     "hostCities"         TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "SpeedrunRun" ADD COLUMN     "submissionOpenDate" TIMESTAMP(3);
ALTER TABLE "SpeedrunRun" ADD COLUMN     "irlEventDate"       TIMESTAMP(3);
ALTER TABLE "SpeedrunRun" ADD COLUMN     "winnersDate"        TIMESTAMP(3);
ALTER TABLE "SpeedrunRun" ADD COLUMN     "faq"                JSONB;

-- ============================================================================
-- SpeedrunTeam: drop user-supplied team name (Team1 ID = code is the identity)
-- Existing rows keep their name for backwards compatibility.
-- ============================================================================
ALTER TABLE "SpeedrunTeam" ALTER COLUMN "name" DROP NOT NULL;

-- ============================================================================
-- SpeedrunRegistration: opt-in social visibility on the public team page.
-- ============================================================================
ALTER TABLE "SpeedrunRegistration" ADD COLUMN "showSocials" BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- SpeedrunTrack: per-run track lineup
-- ============================================================================
CREATE TABLE "SpeedrunTrack" (
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

CREATE UNIQUE INDEX "SpeedrunTrack_runId_name_key" ON "SpeedrunTrack"("runId", "name");
CREATE INDEX        "SpeedrunTrack_runId_idx"       ON "SpeedrunTrack"("runId");

ALTER TABLE "SpeedrunTrack" ADD CONSTRAINT "SpeedrunTrack_runId_fkey"
    FOREIGN KEY ("runId") REFERENCES "SpeedrunRun"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- UserProject: link projects back to a Speedrun run/track/team + richer media
-- ============================================================================
ALTER TABLE "UserProject" ADD COLUMN "videoUrl"        TEXT;
ALTER TABLE "UserProject" ADD COLUMN "socialPostUrl"   TEXT;
ALTER TABLE "UserProject" ADD COLUMN "speedrunRunId"   TEXT;
ALTER TABLE "UserProject" ADD COLUMN "speedrunTrackId" TEXT;
ALTER TABLE "UserProject" ADD COLUMN "speedrunTeamId"  TEXT;

CREATE INDEX "UserProject_speedrunRunId_idx"   ON "UserProject"("speedrunRunId");
CREATE INDEX "UserProject_speedrunTrackId_idx" ON "UserProject"("speedrunTrackId");
CREATE INDEX "UserProject_speedrunTeamId_idx"  ON "UserProject"("speedrunTeamId");

ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_speedrunRunId_fkey"
    FOREIGN KEY ("speedrunRunId") REFERENCES "SpeedrunRun"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_speedrunTrackId_fkey"
    FOREIGN KEY ("speedrunTrackId") REFERENCES "SpeedrunTrack"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_speedrunTeamId_fkey"
    FOREIGN KEY ("speedrunTeamId") REFERENCES "SpeedrunTeam"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Slug rename: "may-2026" → "may-26"
-- (Idempotent — only runs if the old slug still exists.)
-- ============================================================================
UPDATE "SpeedrunRun" SET "slug" = 'may-26' WHERE "slug" = 'may-2026';
