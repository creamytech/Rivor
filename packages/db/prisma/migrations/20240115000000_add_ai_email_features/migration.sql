-- Create AI email analysis table
CREATE TYPE "EmailCategory" AS ENUM ('hot_lead', 'showing_request', 'price_inquiry', 'seller_lead', 'buyer_lead', 'follow_up', 'contract', 'marketing');
CREATE TYPE "ProcessingStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE "EmailAIAnalysis" (
    "id" TEXT NOT NULL,
    "emailId" VARCHAR(255) NOT NULL,
    "threadId" VARCHAR(255) NOT NULL,
    "category" "EmailCategory" NOT NULL,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "sentimentScore" DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    "keyEntities" JSONB,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAIAnalysis_pkey" PRIMARY KEY ("id")
);

-- Create unique index and other indexes
CREATE UNIQUE INDEX "EmailAIAnalysis_emailId_key" ON "EmailAIAnalysis"("emailId");
CREATE INDEX "EmailAIAnalysis_category_idx" ON "EmailAIAnalysis"("category");
CREATE INDEX "EmailAIAnalysis_priorityScore_idx" ON "EmailAIAnalysis"("priorityScore");
CREATE INDEX "EmailAIAnalysis_threadId_idx" ON "EmailAIAnalysis"("threadId");

-- Create AI suggested replies table
CREATE TYPE "ReplyStatus" AS ENUM ('pending', 'approved', 'rejected', 'modified', 'sent');

CREATE TABLE "AISuggestedReply" (
    "id" TEXT NOT NULL,
    "emailId" VARCHAR(255) NOT NULL,
    "threadId" VARCHAR(255) NOT NULL,
    "suggestedContent" TEXT NOT NULL,
    "status" "ReplyStatus" NOT NULL DEFAULT 'pending',
    "confidenceScore" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "category" VARCHAR(100) NOT NULL,
    "userModifications" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISuggestedReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AISuggestedReply_emailId_idx" ON "AISuggestedReply"("emailId");
CREATE INDEX "AISuggestedReply_status_idx" ON "AISuggestedReply"("status");
CREATE INDEX "AISuggestedReply_threadId_idx" ON "AISuggestedReply"("threadId");

-- Create AI learning feedback table for improving responses
CREATE TYPE "FeedbackType" AS ENUM ('positive', 'negative', 'neutral');

CREATE TABLE "AIFeedback" (
    "id" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL,
    "userComments" TEXT,
    "responseEffectiveness" INTEGER, -- 1-5 scale
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIFeedback_replyId_idx" ON "AIFeedback"("replyId");
CREATE INDEX "AIFeedback_feedbackType_idx" ON "AIFeedback"("feedbackType");

-- Create AI email templates table for real estate scenarios
CREATE TABLE "AIEmailTemplate" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "templateContent" TEXT NOT NULL,
    "variables" JSONB, -- Placeholder variables like {propertyAddress}, {clientName}
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIEmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIEmailTemplate_category_idx" ON "AIEmailTemplate"("category");
CREATE INDEX "AIEmailTemplate_isActive_idx" ON "AIEmailTemplate"("isActive");

-- Create AI processing queue for background email analysis
CREATE TYPE "ProcessingType" AS ENUM ('analysis', 'reply_generation', 'categorization');
CREATE TYPE "QueueStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'retry');

CREATE TABLE "AIProcessingQueue" (
    "id" TEXT NOT NULL,
    "emailId" VARCHAR(255) NOT NULL,
    "threadId" VARCHAR(255) NOT NULL,
    "processingType" "ProcessingType" NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 50, -- 1-100, higher is more urgent
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProcessingQueue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIProcessingQueue_status_idx" ON "AIProcessingQueue"("status");
CREATE INDEX "AIProcessingQueue_priority_idx" ON "AIProcessingQueue"("priority");
CREATE INDEX "AIProcessingQueue_scheduledFor_idx" ON "AIProcessingQueue"("scheduledFor");
CREATE INDEX "AIProcessingQueue_emailId_idx" ON "AIProcessingQueue"("emailId");

-- Add foreign key constraints
ALTER TABLE "AIFeedback" ADD CONSTRAINT "AIFeedback_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "AISuggestedReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default AI email templates
INSERT INTO "AIEmailTemplate" ("id", "name", "category", "templateContent", "variables", "createdAt", "updatedAt") VALUES 
('tpl_showing_request', 'Property Showing Response', 'showing-request', 
'Hi {clientName},\n\nThank you for your interest in {propertyAddress}! I''d be delighted to show you this {propertyType}.\n\nI have availability on {availableDate1} at {availableTime1} or {availableDate2} at {availableTime2} for a private showing.\n\nThe property features:\n{propertyHighlights}\n\nWould either time work for you? I can also answer any questions about the neighborhood or property details.\n\nLooking forward to meeting you!\n\nBest regards,\n{agentName}', 
'{"clientName": "string", "propertyAddress": "string", "propertyType": "string", "availableDate1": "string", "availableTime1": "string", "availableDate2": "string", "availableTime2": "string", "propertyHighlights": "array", "agentName": "string"}',
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tpl_price_inquiry', 'Price Negotiation Response', 'price-inquiry',
'Hi {clientName},\n\nThank you for your offer on {propertyAddress}. I''ve discussed it with my seller and we appreciate your interest.\n\nWhile your offer of {offerAmount} shows serious intent, we''re currently at {counterOffer} as our best price given:\n{reasoningPoints}\n\nWould you consider {finalCounterOffer}? This represents a {discount} reduction from asking and reflects our motivation to work with qualified buyers.\n\nLet me know your thoughts and we can discuss further.\n\nBest regards,\n{agentName}',
'{"clientName": "string", "propertyAddress": "string", "offerAmount": "string", "counterOffer": "string", "reasoningPoints": "array", "finalCounterOffer": "string", "discount": "string", "agentName": "string"}',
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tpl_seller_lead', 'Market Analysis Response', 'seller-lead',
'Hi {clientName},\n\nThank you for considering me to help with selling your {propertyType} at {propertyAddress}.\n\nI''d be happy to provide you with a comprehensive market analysis and discuss my services. Based on recent comparable sales in your area, properties like yours are typically valued between {priceRange}.\n\nI''d love to schedule a time to:\n• Tour your property\n• Provide detailed market analysis\n• Discuss my marketing strategy\n• Review commission structure and timeline\n\nI have availability {availableOptions}.\n\nLooking forward to helping you achieve your selling goals!\n\nBest regards,\n{agentName}',
'{"clientName": "string", "propertyType": "string", "propertyAddress": "string", "priceRange": "string", "availableOptions": "string", "agentName": "string"}',
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);