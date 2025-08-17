-- Remove plain text fields for SOC2 compliance
-- All sensitive data must be encrypted at rest

-- Remove plain text fields from EmailThread
ALTER TABLE "EmailThread" DROP COLUMN IF EXISTS "subjectIndex";
ALTER TABLE "EmailThread" DROP COLUMN IF EXISTS "participantsIndex";

-- Remove plain text fields from EmailMessage
ALTER TABLE "EmailMessage" DROP COLUMN IF EXISTS "subjectIndex";
ALTER TABLE "EmailMessage" DROP COLUMN IF EXISTS "participantsIndex";
ALTER TABLE "EmailMessage" DROP COLUMN IF EXISTS "htmlBody";
ALTER TABLE "EmailMessage" DROP COLUMN IF EXISTS "textBody";
ALTER TABLE "EmailMessage" DROP COLUMN IF EXISTS "snippet";

-- Remove plain text fields from Contact
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "nameIndex";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "emailIndex";
ALTER TABLE "Contact" DROP COLUMN IF EXISTS "companyIndex";

-- Remove plain text fields from CalendarEvent
ALTER TABLE "CalendarEvent" DROP COLUMN IF EXISTS "titleIndex";
ALTER TABLE "CalendarEvent" DROP COLUMN IF EXISTS "locationIndex";

-- Update Account model to use encrypted tokens
ALTER TABLE "Account" DROP COLUMN IF EXISTS "refresh_token";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "access_token";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "id_token";
ALTER TABLE "Account" ADD COLUMN "refresh_token_enc" BYTEA;
ALTER TABLE "Account" ADD COLUMN "access_token_enc" BYTEA;
ALTER TABLE "Account" ADD COLUMN "id_token_enc" BYTEA;
