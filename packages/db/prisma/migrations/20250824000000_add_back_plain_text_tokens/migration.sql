-- Add back plain text token fields for NextAuth compatibility
-- These will be used temporarily until we implement proper encryption

-- Add plain text columns back to Account table
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "access_token" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "refresh_token" TEXT;  
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "id_token" TEXT;