-- Fix missing tokenStatus column that should have been added by previous migration
-- This migration is idempotent - it only adds the column if it doesn't exist

-- Check if tokenStatus column exists, and add it if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'EmailAccount' 
        AND column_name = 'tokenStatus'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "EmailAccount" ADD COLUMN "tokenStatus" TEXT NOT NULL DEFAULT 'pending_encryption';
        
        -- Add comment for documentation
        COMMENT ON COLUMN "EmailAccount"."tokenStatus" IS 'Token encryption status: pending_encryption, encrypted, failed';
    END IF;
END $$;
