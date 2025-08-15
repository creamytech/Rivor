-- Add performance indexes for email sync operations

-- Index for email thread queries by account and timestamp
CREATE INDEX CONCURRENTLY IF NOT EXISTS "EmailThread_emailAccountId_updatedAt_idx" 
ON "EmailThread"("accountId", "updatedAt" DESC);

-- Index for email message queries by thread and internal date
CREATE INDEX CONCURRENTLY IF NOT EXISTS "EmailMessage_threadId_sentAt_idx" 
ON "EmailMessage"("threadId", "sentAt" DESC);

-- Index for email account sync status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "EmailAccount_syncStatus_lastSyncedAt_idx" 
ON "EmailAccount"("syncStatus", "lastSyncedAt" DESC);

-- Index for secure token management queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "SecureToken_orgId_provider_tokenType_idx" 
ON "SecureToken"("orgId", "provider", "tokenType");

-- Index for audit log queries by org and timestamp
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_orgId_createdAt_idx" 
ON "AuditLog"("orgId", "createdAt" DESC);
