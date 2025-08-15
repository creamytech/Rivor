-- Add unique constraint to CalendarAccount table for orgId + provider combination
-- This allows upserts based on organization and provider
ALTER TABLE "CalendarAccount" ADD CONSTRAINT "CalendarAccount_orgId_provider_key" UNIQUE ("orgId", "provider");

-- Add comment for clarity
COMMENT ON CONSTRAINT "CalendarAccount_orgId_provider_key" ON "CalendarAccount" IS 'Unique constraint ensuring one calendar account per organization per provider';
