-- CreateEnum for SMS message direction
CREATE TYPE "SMSDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum for SMS message status
CREATE TYPE "SMSStatus" AS ENUM ('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SCHEDULED', 'RECEIVED');

-- Create SMSMessage table
CREATE TABLE "sms_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "phone_number" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media_url" TEXT,
    "direction" "SMSDirection" NOT NULL,
    "status" "SMSStatus" NOT NULL DEFAULT 'SENT',
    "send_blue_message_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "sms_messages_pkey" PRIMARY KEY ("id")
);

-- Create SMSThread table for conversation management
CREATE TABLE "sms_threads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "phone_number" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL,
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "sms_threads_pkey" PRIMARY KEY ("id")
);

-- Create SMSTemplate table for message templates
CREATE TABLE "sms_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "organization_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_templates_pkey" PRIMARY KEY ("id")
);

-- Create SMSCampaign table for bulk messaging
CREATE TABLE "sms_campaigns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "sms_campaigns_pkey" PRIMARY KEY ("id")
);

-- Create SMSCampaignRecipient table
CREATE TABLE "sms_campaign_recipients" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "phone_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_campaign_recipients_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "sms_messages_user_id_idx" ON "sms_messages"("user_id");
CREATE INDEX "sms_messages_contact_id_idx" ON "sms_messages"("contact_id");
CREATE INDEX "sms_messages_phone_number_idx" ON "sms_messages"("phone_number");
CREATE INDEX "sms_messages_direction_idx" ON "sms_messages"("direction");
CREATE INDEX "sms_messages_status_idx" ON "sms_messages"("status");
CREATE INDEX "sms_messages_created_at_idx" ON "sms_messages"("created_at" DESC);
CREATE INDEX "sms_messages_send_blue_message_id_idx" ON "sms_messages"("send_blue_message_id");

CREATE INDEX "sms_threads_user_id_idx" ON "sms_threads"("user_id");
CREATE INDEX "sms_threads_contact_id_idx" ON "sms_threads"("contact_id");
CREATE INDEX "sms_threads_phone_number_idx" ON "sms_threads"("phone_number");
CREATE INDEX "sms_threads_last_message_at_idx" ON "sms_threads"("last_message_at" DESC);

CREATE INDEX "sms_templates_user_id_idx" ON "sms_templates"("user_id");
CREATE INDEX "sms_templates_organization_id_idx" ON "sms_templates"("organization_id");
CREATE INDEX "sms_templates_category_idx" ON "sms_templates"("category");
CREATE INDEX "sms_templates_is_system_idx" ON "sms_templates"("is_system");

CREATE INDEX "sms_campaigns_user_id_idx" ON "sms_campaigns"("user_id");
CREATE INDEX "sms_campaigns_status_idx" ON "sms_campaigns"("status");
CREATE INDEX "sms_campaigns_scheduled_at_idx" ON "sms_campaigns"("scheduled_at");

CREATE INDEX "sms_campaign_recipients_campaign_id_idx" ON "sms_campaign_recipients"("campaign_id");
CREATE INDEX "sms_campaign_recipients_contact_id_idx" ON "sms_campaign_recipients"("contact_id");
CREATE INDEX "sms_campaign_recipients_status_idx" ON "sms_campaign_recipients"("status");

-- Add foreign key constraints
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sms_threads" ADD CONSTRAINT "sms_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sms_threads" ADD CONSTRAINT "sms_threads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sms_templates" ADD CONSTRAINT "sms_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sms_templates" ADD CONSTRAINT "sms_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sms_campaigns" ADD CONSTRAINT "sms_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sms_campaign_recipients" ADD CONSTRAINT "sms_campaign_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "sms_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sms_campaign_recipients" ADD CONSTRAINT "sms_campaign_recipients_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create unique constraints
ALTER TABLE "sms_threads" ADD CONSTRAINT "sms_threads_user_id_contact_id_key" UNIQUE ("user_id", "contact_id");
ALTER TABLE "sms_threads" ADD CONSTRAINT "sms_threads_user_id_phone_number_key" UNIQUE ("user_id", "phone_number");

-- Insert default system templates
INSERT INTO "sms_templates" ("id", "name", "category", "content", "variables", "is_system", "is_active") VALUES 
('tpl_running_late', 'Running Late', 'scheduling', 'Hi {{name}}, running about {{minutes}} minutes late for our {{appointment_type}}. See you soon!', ARRAY['name', 'minutes', 'appointment_type'], true, true),
('tpl_confirm_showing', 'Confirm Showing', 'scheduling', 'Hi {{name}}, confirming our property showing today at {{time}} for {{property_address}}. See you there!', ARRAY['name', 'time', 'property_address'], true, true),
('tpl_reschedule', 'Reschedule Request', 'scheduling', 'Hi {{name}}, need to reschedule our {{appointment_type}}. When works better for you?', ARRAY['name', 'appointment_type'], true, true),
('tpl_documents_ready', 'Documents Ready', 'updates', 'Hi {{name}}, your documents are ready for review. Let me know when you can stop by!', ARRAY['name'], true, true),
('tpl_new_listing', 'New Listing Alert', 'updates', 'Hi {{name}}, found a perfect property match for you! {{property_address}} - {{price}}. Interested in viewing?', ARRAY['name', 'property_address', 'price'], true, true),
('tpl_price_update', 'Price Reduction', 'updates', 'Hi {{name}}, great news! The property at {{property_address}} just reduced price to {{new_price}}.', ARRAY['name', 'property_address', 'new_price'], true, true),
('tpl_check_in', 'Follow-up Check-in', 'follow-up', 'Hi {{name}}, checking in about the property we viewed at {{property_address}}. Any thoughts or questions?', ARRAY['name', 'property_address'], true, true),
('tpl_thank_you', 'Thank You', 'follow-up', 'Hi {{name}}, thank you for choosing me as your real estate agent. Looking forward to helping you!', ARRAY['name'], true, true),
('tpl_next_steps', 'Next Steps', 'follow-up', 'Hi {{name}}, here are the next steps for {{property_address}}: {{steps}}. Let me know if you have questions!', ARRAY['name', 'property_address', 'steps'], true, true),
('tpl_market_update', 'Market Update', 'marketing', 'Hi {{name}}, here\'s your weekly market update for {{area}}: {{summary}}. Let me know if you\'d like to discuss!', ARRAY['name', 'area', 'summary'], true, true);

-- Add contacts table phone number column if it doesn't exist (for SMS integration)
-- ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone_number" TEXT;

-- Update activity types to include SMS activities
-- This assumes the activities table exists and has a type enum
-- ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SMS_SENT';
-- ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SMS_RECEIVED';