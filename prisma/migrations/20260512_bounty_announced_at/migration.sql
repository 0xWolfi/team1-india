-- Add idempotency marker for the "new bounty" announcement email.
-- Set the first time a bounty transitions to status='active' and the
-- broadcast fires. Subsequent status flips don't re-trigger.

ALTER TABLE "Bounty" ADD COLUMN IF NOT EXISTS "announcedAt" TIMESTAMP(3);
