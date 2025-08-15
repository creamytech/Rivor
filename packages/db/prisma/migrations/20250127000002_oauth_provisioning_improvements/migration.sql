-- OAuth provisioning improvements

-- Add tokenStatus field to EmailAccount
ALTER TABLE "EmailAccount" ADD COLUMN "tokenStatus" TEXT NOT NULL DEFAULT 'pending_encryption';

-- Add unique constraint for userId + provider (one account per provider per user)
CREATE UNIQUE INDEX "EmailAccount_userId_provider_key" ON "EmailAccount"("userId", "provider");

-- Add unique constraint for orgId + provider (one account per provider per org) for CalendarAccount
CREATE UNIQUE INDEX "CalendarAccount_orgId_provider_key" ON "CalendarAccount"("orgId", "provider");

-- Add comment for tokenStatus values
COMMENT ON COLUMN "EmailAccount"."tokenStatus" IS 'Token encryption status: pending_encryption, encrypted, failed';
