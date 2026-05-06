-- Project moderation reports — decouple "report submitted" from "project state".
-- Replaces the old behavior where a single user-submitted report flipped
-- UserProject.status to "reported", which made the report endpoint a
-- one-request takedown vector for any authenticated user.

CREATE TABLE "ProjectReport" (
    "id"            TEXT NOT NULL,
    "projectId"     TEXT NOT NULL,
    "reporterEmail" TEXT NOT NULL,
    "reason"        TEXT,
    "reviewedAt"    TIMESTAMP(3),
    "reviewedBy"    TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectReport_pkey" PRIMARY KEY ("id")
);

-- One report per (project, reporter). Prevents a single user from spamming
-- the same project to inflate the report count.
CREATE UNIQUE INDEX "ProjectReport_projectId_reporterEmail_key"
    ON "ProjectReport"("projectId", "reporterEmail");

CREATE INDEX "ProjectReport_projectId_idx"     ON "ProjectReport"("projectId");
CREATE INDEX "ProjectReport_reporterEmail_idx" ON "ProjectReport"("reporterEmail");
CREATE INDEX "ProjectReport_reviewedAt_idx"    ON "ProjectReport"("reviewedAt");

ALTER TABLE "ProjectReport"
    ADD CONSTRAINT "ProjectReport_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "UserProject"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
