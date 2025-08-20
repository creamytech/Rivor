-- OAuth provisioning improvements

-- Add tokenStatus field to EmailAccount (idempotent - only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'EmailAccount' 
        AND column_name = 'tokenStatus'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "EmailAccount" ADD COLUMN "tokenStatus" TEXT NOT NULL DEFAULT 'pending_encryption';
        
        -- Add comment for tokenStatus values
        COMMENT ON COLUMN "EmailAccount"."tokenStatus" IS 'Token encryption status: pending_encryption, encrypted, failed';
    END IF;
END $$;

-- Add unique constraint for userId + provider (one account per provider per user)
CREATE UNIQUE INDEX IF NOT EXISTS "EmailAccount_userId_provider_key" ON "EmailAccount"("userId", "provider");

-- Add unique constraint for orgId + provider (one account per provider per org) for CalendarAccount
CREATE UNIQUE INDEX IF NOT EXISTS "CalendarAccount_orgId_provider_key" ON "CalendarAccount"("orgId", "provider");
