-- Add push notification tracking

-- Add last push received timestamp to EmailAccount
ALTER TABLE "EmailAccount" ADD COLUMN "lastPushReceivedAt" TIMESTAMP(3);

-- Add push tracking table for detailed monitoring
CREATE TABLE "PushNotificationLog" (
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

-- Add foreign key constraints
ALTER TABLE "PushNotificationLog" ADD CONSTRAINT "PushNotificationLog_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES "EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushNotificationLog" ADD CONSTRAINT "PushNotificationLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for performance
CREATE INDEX "PushNotificationLog_emailAccountId_processedAt_idx" ON "PushNotificationLog"("emailAccountId", "processedAt" DESC);
CREATE INDEX "PushNotificationLog_orgId_processedAt_idx" ON "PushNotificationLog"("orgId", "processedAt" DESC);
