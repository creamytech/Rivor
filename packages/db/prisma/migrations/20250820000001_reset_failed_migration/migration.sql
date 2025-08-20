-- Reset failed migration state by marking the problematic migration as applied
-- This is safe because we've already made the migration idempotent

-- Mark the failed migration as applied if it exists in the _prisma_migrations table
UPDATE "_prisma_migrations" 
SET "finished_at" = NOW(), 
    "logs" = 'Migration marked as applied - resolved migration conflicts',
    "rolled_back_at" = NULL
WHERE "migration_name" = '20250127000002_oauth_provisioning_improvements' 
  AND "finished_at" IS NULL;