-- AlterTable
ALTER TABLE "Experiment" ADD COLUMN "createdByEmail" TEXT;

-- CreateIndex
CREATE INDEX "Experiment_createdByEmail_idx" ON "Experiment"("createdByEmail");
