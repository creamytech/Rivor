-- CreateEnum
CREATE TYPE "public"."ConnectionStatus" AS ENUM ('connected', 'action_needed', 'disconnected');

-- CreateEnum
CREATE TYPE "public"."SyncStatus" AS ENUM ('idle', 'scheduled', 'running', 'error');

-- CreateEnum
CREATE TYPE "public"."EncryptionStatus" AS ENUM ('ok', 'pending', 'failed');

-- AlterTable: Add new columns to Org
ALTER TABLE "public"."Org" ADD COLUMN "slug" TEXT;
ALTER TABLE "public"."Org" ADD COLUMN "ownerUserId" TEXT;

-- AlterTable: Update EmailAccount with new robust fields
ALTER TABLE "public"."EmailAccount" ADD COLUMN "userId" TEXT;
ALTER TABLE "public"."EmailAccount" ADD COLUMN "externalAccountId" TEXT;
ALTER TABLE "public"."EmailAccount" ADD COLUMN "email" TEXT;
ALTER TABLE "public"."EmailAccount" ADD COLUMN "displayName" TEXT;
ALTER TABLE "public"."EmailAccount" DROP COLUMN "status";
ALTER TABLE "public"."EmailAccount" ADD COLUMN "status" "public"."ConnectionStatus" NOT NULL DEFAULT 'connected';
ALTER TABLE "public"."EmailAccount" ADD COLUMN "syncStatus" "public"."SyncStatus" NOT NULL DEFAULT 'idle';
ALTER TABLE "public"."EmailAccount" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
ALTER TABLE "public"."EmailAccount" ADD COLUMN "errorReason" TEXT;
ALTER TABLE "public"."EmailAccount" ADD COLUMN "encryptionStatus" "public"."EncryptionStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "public"."EmailAccount" ADD COLUMN "keyVersion" INTEGER;
ALTER TABLE "public"."EmailAccount" ADD COLUMN "kmsErrorCode" TEXT;
ALTER TABLE "public"."EmailAccount" ADD COLUMN "kmsErrorAt" TIMESTAMP(3);
ALTER TABLE "public"."EmailAccount" ADD COLUMN "tokenRef" TEXT;

-- CreateTable: SecureToken for KMS-encrypted token storage
CREATE TABLE "public"."SecureToken" (
    "id" TEXT NOT NULL,
    "tokenRef" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "encryptedTokenBlob" BYTEA,
    "encryptionStatus" "public"."EncryptionStatus" NOT NULL DEFAULT 'pending',
    "keyVersion" INTEGER,
    "kmsErrorCode" TEXT,
    "kmsErrorAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecureToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecureToken_tokenRef_key" ON "public"."SecureToken"("tokenRef");

-- CreateIndex
CREATE INDEX "SecureToken_tokenRef_idx" ON "public"."SecureToken"("tokenRef");

-- CreateIndex
CREATE INDEX "SecureToken_orgId_provider_idx" ON "public"."SecureToken"("orgId", "provider");

-- CreateIndex
CREATE INDEX "SecureToken_encryptionStatus_idx" ON "public"."SecureToken"("encryptionStatus");

-- CreateIndex: New unique constraints for EmailAccount
CREATE UNIQUE INDEX "EmailAccount_userId_provider_key" ON "public"."EmailAccount"("userId", "provider");

CREATE UNIQUE INDEX "EmailAccount_orgId_provider_externalAccountId_key" ON "public"."EmailAccount"("orgId", "provider", "externalAccountId");

-- AddForeignKey: EmailAccount to User
ALTER TABLE "public"."EmailAccount" ADD CONSTRAINT "EmailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: SecureToken to Org
ALTER TABLE "public"."SecureToken" ADD CONSTRAINT "SecureToken_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update existing EmailAccount records to have required fields
-- This is a data migration - in production, you'd need to populate these fields appropriately
UPDATE "public"."EmailAccount" SET 
    "userId" = (SELECT "name" FROM "public"."Org" WHERE "Org"."id" = "EmailAccount"."orgId" LIMIT 1),
    "externalAccountId" = 'migration-' || "id",
    "email" = (SELECT "name" FROM "public"."Org" WHERE "Org"."id" = "EmailAccount"."orgId" LIMIT 1)
WHERE "userId" IS NULL;

-- Make the new columns NOT NULL after populating them
ALTER TABLE "public"."EmailAccount" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "public"."EmailAccount" ALTER COLUMN "externalAccountId" SET NOT NULL;
ALTER TABLE "public"."EmailAccount" ALTER COLUMN "email" SET NOT NULL;
