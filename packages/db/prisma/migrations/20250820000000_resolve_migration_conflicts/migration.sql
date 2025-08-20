-- Resolve migration conflicts and ensure database state consistency
-- This migration ensures the database is in the correct state regardless of previous migration failures

-- Ensure Waitlist table exists (idempotent)
CREATE TABLE IF NOT EXISTS "Waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "role" TEXT,
    "note" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'marketing',
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on email if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Waitlist_email_key' 
        AND table_name = 'Waitlist'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_email_key" UNIQUE ("email");
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "Waitlist_createdAt_idx" ON "Waitlist"("createdAt");
CREATE INDEX IF NOT EXISTS "Waitlist_source_idx" ON "Waitlist"("source");
CREATE INDEX IF NOT EXISTS "Waitlist_role_idx" ON "Waitlist"("role");