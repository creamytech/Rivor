-- Remove plain text token fields to enforce encryption-only storage
-- This migration ensures SOC2 compliance by removing any plain text OAuth tokens

-- Remove plain text columns from Account table if they exist
ALTER TABLE "Account" DROP COLUMN IF EXISTS "access_token";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "refresh_token";  
ALTER TABLE "Account" DROP COLUMN IF EXISTS "id_token";

-- Ensure we have the encrypted columns (should already exist)
-- These are idempotent operations
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE "Account" ADD COLUMN "access_token_enc" BYTEA;
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column already exists, skip
  END;
  
  BEGIN
    ALTER TABLE "Account" ADD COLUMN "refresh_token_enc" BYTEA;
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column already exists, skip
  END;
  
  BEGIN
    ALTER TABLE "Account" ADD COLUMN "id_token_enc" BYTEA;
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column already exists, skip
  END;
END $$;