-- Add unique constraint to CalendarAccount table for orgId + provider combination (idempotent)
-- This allows upserts based on organization and provider
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'CalendarAccount_orgId_provider_key'
        AND table_name = 'CalendarAccount'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "CalendarAccount" ADD CONSTRAINT "CalendarAccount_orgId_provider_key" UNIQUE ("orgId", "provider");
        
        -- Add comment for clarity
        COMMENT ON CONSTRAINT "CalendarAccount_orgId_provider_key" ON "CalendarAccount" IS 'Unique constraint ensuring one calendar account per organization per provider';
    END IF;
END $$;
