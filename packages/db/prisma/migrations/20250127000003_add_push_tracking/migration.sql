-- Add push notification tracking

-- Add last push received timestamp to EmailAccount (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'EmailAccount' 
        AND column_name = 'lastPushReceivedAt'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "EmailAccount" ADD COLUMN "lastPushReceivedAt" TIMESTAMP(3);
    END IF;
END $$;

-- Add push tracking table for detailed monitoring (idempotent)
CREATE TABLE IF NOT EXISTS "PushNotificationLog" (
    "id" TEXT NOT NULL,
    "emailAccountId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "historyId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latencyMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,

    CONSTRAINT "PushNotificationLog_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'PushNotificationLog_emailAccountId_fkey'
        AND table_name = 'PushNotificationLog'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "PushNotificationLog" ADD CONSTRAINT "PushNotificationLog_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES "EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'PushNotificationLog_orgId_fkey'
        AND table_name = 'PushNotificationLog'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "PushNotificationLog" ADD CONSTRAINT "PushNotificationLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add index for performance (idempotent)
CREATE INDEX IF NOT EXISTS "PushNotificationLog_emailAccountId_processedAt_idx" ON "PushNotificationLog"("emailAccountId", "processedAt" DESC);
CREATE INDEX IF NOT EXISTS "PushNotificationLog_orgId_processedAt_idx" ON "PushNotificationLog"("orgId", "processedAt" DESC);
