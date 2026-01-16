-- Check if Contribution table exists, if not create it, if yes update it
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Contribution') THEN
        -- Create table if it doesn't exist
        CREATE TABLE "Contribution" (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            "eventDate" TEXT,
            "eventLocation" TEXT,
            "contentUrl" TEXT,
            "programId" TEXT,
            "internalWorksDescription" TEXT,
            "submittedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "deletedAt" TIMESTAMP
        );
        
        CREATE INDEX "Contribution_email_idx" ON "Contribution"(email);
        CREATE INDEX "Contribution_type_idx" ON "Contribution"(type);
        CREATE INDEX "Contribution_status_idx" ON "Contribution"(status);
        CREATE INDEX "Contribution_submittedAt_idx" ON "Contribution"("submittedAt");
    ELSE
        -- Table exists, update it
        -- Drop xPostUrl column if it exists
        ALTER TABLE "Contribution" DROP COLUMN IF EXISTS "xPostUrl";
        
        -- Add new columns if they don't exist
        ALTER TABLE "Contribution" ADD COLUMN IF NOT EXISTS "programId" TEXT;
        ALTER TABLE "Contribution" ADD COLUMN IF NOT EXISTS "internalWorksDescription" TEXT;
    END IF;
END $$;
