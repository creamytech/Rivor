-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ConnectionStatus" AS ENUM ('connected', 'action_needed', 'disconnected');

-- CreateEnum
CREATE TYPE "public"."SyncStatus" AS ENUM ('idle', 'scheduled', 'running', 'error');

-- CreateEnum
CREATE TYPE "public"."EncryptionStatus" AS ENUM ('ok', 'pending', 'failed');

-- CreateEnum
CREATE TYPE "public"."EmailCategory" AS ENUM ('hot_lead', 'showing_request', 'price_inquiry', 'seller_lead', 'buyer_lead', 'follow_up', 'contract', 'marketing');

-- CreateEnum
CREATE TYPE "public"."ProcessingStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "public"."ReplyStatus" AS ENUM ('pending', 'approved', 'rejected', 'modified', 'sent');

-- CreateEnum
CREATE TYPE "public"."FeedbackType" AS ENUM ('positive', 'negative', 'neutral');

-- CreateEnum
CREATE TYPE "public"."ProcessingType" AS ENUM ('analysis', 'reply_generation', 'categorization');

-- CreateEnum
CREATE TYPE "public"."QueueStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'retry');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "id_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "public"."Org" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "ownerUserId" TEXT,
    "brandName" TEXT NOT NULL DEFAULT 'Rivor',
    "encryptedDekBlob" BYTEA NOT NULL,
    "dekVersion" INTEGER NOT NULL DEFAULT 1,
    "ephemeralMode" BOOLEAN NOT NULL DEFAULT false,
    "retentionDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrgMember" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" BYTEA NOT NULL,
    "refreshToken" BYTEA NOT NULL,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailAccount" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "public"."ConnectionStatus" NOT NULL DEFAULT 'connected',
    "syncStatus" "public"."SyncStatus" NOT NULL DEFAULT 'idle',
    "lastSyncedAt" TIMESTAMP(3),
    "errorReason" TEXT,
    "encryptionStatus" "public"."EncryptionStatus" NOT NULL DEFAULT 'pending',
    "keyVersion" INTEGER,
    "kmsErrorCode" TEXT,
    "kmsErrorAt" TIMESTAMP(3),
    "tokenRef" TEXT,
    "tokenStatus" TEXT NOT NULL DEFAULT 'pending_encryption',
    "historyId" TEXT,
    "watchExpiration" TIMESTAMP(3),
    "watchResourceId" TEXT,
    "lastPushReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecureToken" (
    "id" TEXT NOT NULL,
    "tokenRef" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "encryptedTokenBlob" BYTEA,
    "encryptionStatus" "public"."EncryptionStatus" NOT NULL DEFAULT 'pending',
    "keyVersion" INTEGER,
    "kmsErrorCode" TEXT,
    "kmsErrorAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecureToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailThread" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "subjectEnc" BYTEA,
    "participantsEnc" BYTEA,
    "summaryEnc" BYTEA,
    "summaryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "unread" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "fromEnc" BYTEA,
    "toEnc" BYTEA,
    "ccEnc" BYTEA,
    "bccEnc" BYTEA,
    "subjectEnc" BYTEA,
    "snippetEnc" BYTEA,
    "bodyRefEnc" BYTEA,
    "htmlBodyEnc" BYTEA,
    "textBodyEnc" BYTEA,
    "attachmentsMetaEnc" BYTEA,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarAccount" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "channelId" TEXT,
    "channelResourceId" TEXT,
    "channelExpiration" TIMESTAMP(3),
    "webhookEndpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "titleEnc" BYTEA,
    "locationEnc" BYTEA,
    "notesEnc" BYTEA,
    "attendeesEnc" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "nameEnc" BYTEA,
    "emailEnc" BYTEA,
    "phoneEnc" BYTEA,
    "companyEnc" BYTEA,
    "titleEnc" BYTEA,
    "addressEnc" BYTEA,
    "notesEnc" BYTEA,
    "source" TEXT,
    "tags" TEXT[],
    "lastActivity" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "contactId" TEXT,
    "stageId" TEXT,
    "title" TEXT,
    "dealValueEnc" BYTEA,
    "probabilityPercent" INTEGER,
    "notesEnc" BYTEA,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT,
    "assignedToId" TEXT,
    "sourceThreadId" TEXT,
    "propertyAddress" TEXT,
    "listingId" TEXT,
    "propertyValue" DOUBLE PRECISION,
    "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastFollowUpAt" TIMESTAMP(3),
    "expectedCloseDate" TIMESTAMP(3),
    "actualCloseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "done" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedToId" TEXT,
    "linkThreadId" TEXT,
    "linkLeadId" TEXT,
    "linkedEmailId" TEXT,
    "linkedContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PipelineStage" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookSubscription" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "secret" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StripeCustomer" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "purpose" TEXT,
    "resource" TEXT,
    "success" BOOLEAN NOT NULL,
    "traceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushNotificationLog" (
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

-- CreateTable
CREATE TABLE "public"."ChatThread" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contextType" TEXT,
    "contextId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'low',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "content" TEXT NOT NULL,
    "mergeFields" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateId" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "linkedDealId" TEXT,
    "linkedContactId" TEXT,
    "folderId" TEXT,
    "generatedPdfUrl" TEXT,
    "docusignEnvelopeId" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentFolder" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "linkedDealId" TEXT,
    "linkedContactId" TEXT,
    "color" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Waitlist" (
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

-- CreateTable
CREATE TABLE "public"."EmailAIAnalysis" (
    "id" TEXT NOT NULL,
    "emailId" VARCHAR(255) NOT NULL,
    "threadId" VARCHAR(255) NOT NULL,
    "category" "public"."EmailCategory" NOT NULL,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "sentimentScore" DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    "keyEntities" JSONB,
    "processingStatus" "public"."ProcessingStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AISuggestedReply" (
    "id" TEXT NOT NULL,
    "emailId" VARCHAR(255) NOT NULL,
    "threadId" VARCHAR(255) NOT NULL,
    "suggestedContent" TEXT NOT NULL,
    "status" "public"."ReplyStatus" NOT NULL DEFAULT 'pending',
    "confidenceScore" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "category" VARCHAR(100) NOT NULL,
    "userModifications" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISuggestedReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIFeedback" (
    "id" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "feedbackType" "public"."FeedbackType" NOT NULL,
    "userComments" TEXT,
    "responseEffectiveness" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIEmailTemplate" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "templateContent" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIEmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIProcessingQueue" (
    "id" TEXT NOT NULL,
    "emailId" VARCHAR(255) NOT NULL,
    "threadId" VARCHAR(255) NOT NULL,
    "processingType" "public"."ProcessingType" NOT NULL,
    "status" "public"."QueueStatus" NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 50,
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

-- CreateTable
CREATE TABLE "public"."LeadIntelligence" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "leadId" TEXT,
    "contactId" TEXT,
    "emailThreadId" TEXT,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "conversionProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "urgencyScore" INTEGER NOT NULL DEFAULT 0,
    "valueScore" INTEGER NOT NULL DEFAULT 0,
    "responsePatterns" JSONB,
    "behaviorMetrics" JSONB,
    "predictedActions" JSONB,
    "recommendedActions" JSONB,
    "optimalContactTime" TEXT,
    "communicationStyle" TEXT,
    "decisionTimeframe" TEXT,
    "painPoints" JSONB,
    "competitorMentions" JSONB,
    "priceSignals" JSONB,
    "lastAnalyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadInsight" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "leadIntelligenceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "impact" TEXT NOT NULL,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "suggestedActions" JSONB,
    "dataPoints" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadPrediction" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "leadIntelligenceId" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "prediction" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeframe" TEXT,
    "factors" JSONB,
    "modelVersion" TEXT NOT NULL DEFAULT '1.0',
    "accuracy" DOUBLE PRECISION,
    "validatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommunicationOptimization" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "leadIntelligenceId" TEXT NOT NULL,
    "channelPreference" JSONB,
    "bestContactTimes" JSONB,
    "responsePatterns" JSONB,
    "contentPreferences" JSONB,
    "engagementTriggers" JSONB,
    "avoidancePatterns" JSONB,
    "lastOptimizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AutomatedAppointment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "emailThreadId" TEXT,
    "appointmentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "propertyAddress" TEXT,
    "lockboxCode" TEXT,
    "showingInstructions" TEXT,
    "attendeeEmails" JSONB,
    "remindersSent" JSONB,
    "confirmationToken" TEXT,
    "rescheduleToken" TEXT,
    "aiNotes" TEXT,
    "requirements" JSONB,
    "followUpSequence" TEXT,
    "createdBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomatedAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FollowUpSequence" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sequenceType" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "steps" JSONB NOT NULL,
    "conditions" JSONB,
    "stats" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FollowUpExecution" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "emailThreadId" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "nextActionAt" TIMESTAMP(3),
    "completedSteps" JSONB,
    "pausedAt" TIMESTAMP(3),
    "pausedReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "performance" JSONB,
    "customizations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIGeneratedContent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentPurpose" TEXT NOT NULL,
    "template" TEXT,
    "prompt" TEXT,
    "generatedText" TEXT NOT NULL,
    "customizations" JSONB,
    "performance" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIGeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AutomationRule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL,
    "triggers" JSONB NOT NULL,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "stats" JSONB,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyShowingTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "propertyType" TEXT,
    "defaultDuration" INTEGER NOT NULL DEFAULT 30,
    "bufferTime" INTEGER NOT NULL DEFAULT 15,
    "instructions" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "availableTimeSlots" JSONB,
    "confirmationMessage" TEXT,
    "reminderSchedule" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyShowingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentPersonality" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "communicationStyle" TEXT,
    "tonePreferences" JSONB,
    "vocabularyPreferences" JSONB,
    "signatureStyle" TEXT,
    "writingPatterns" JSONB,
    "responseStyle" JSONB,
    "personalBrand" JSONB,
    "sampleCommunications" JSONB,
    "learningProgress" JSONB,
    "refinementHistory" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPersonality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnboardingSession" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "totalSteps" INTEGER NOT NULL DEFAULT 10,
    "conversationHistory" JSONB,
    "extractedInsights" JSONB,
    "styleScores" JSONB,
    "scenarioResponses" JSONB,
    "completedAt" TIMESTAMP(3),
    "timeSpentMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIPersonalityTraining" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "personalityId" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "aiGeneratedContent" TEXT,
    "humanFeedback" TEXT,
    "accuracyScore" DOUBLE PRECISION,
    "improvementNotes" JSONB,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "usedForTraining" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPersonalityTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommunicationTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "personalityId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "subjectLine" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "lastUsed" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentTemplateId" TEXT,
    "generatedByAI" BOOLEAN NOT NULL DEFAULT true,
    "humanApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMember_orgId_userId_key" ON "public"."OrgMember"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerId_key" ON "public"."OAuthAccount"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAccount_userId_provider_key" ON "public"."EmailAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAccount_orgId_provider_externalAccountId_key" ON "public"."EmailAccount"("orgId", "provider", "externalAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SecureToken_tokenRef_key" ON "public"."SecureToken"("tokenRef");

-- CreateIndex
CREATE INDEX "SecureToken_tokenRef_idx" ON "public"."SecureToken"("tokenRef");

-- CreateIndex
CREATE INDEX "SecureToken_orgId_provider_idx" ON "public"."SecureToken"("orgId", "provider");

-- CreateIndex
CREATE INDEX "SecureToken_encryptionStatus_idx" ON "public"."SecureToken"("encryptionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMessage_orgId_messageId_key" ON "public"."EmailMessage"("orgId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarAccount_orgId_provider_key" ON "public"."CalendarAccount"("orgId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_orgId_order_key" ON "public"."PipelineStage"("orgId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_customerId_key" ON "public"."StripeCustomer"("customerId");

-- CreateIndex
CREATE INDEX "PushNotificationLog_emailAccountId_processedAt_idx" ON "public"."PushNotificationLog"("emailAccountId", "processedAt" DESC);

-- CreateIndex
CREATE INDEX "PushNotificationLog_orgId_processedAt_idx" ON "public"."PushNotificationLog"("orgId", "processedAt" DESC);

-- CreateIndex
CREATE INDEX "ChatThread_orgId_idx" ON "public"."ChatThread"("orgId");

-- CreateIndex
CREATE INDEX "ChatThread_userId_idx" ON "public"."ChatThread"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_threadId_idx" ON "public"."ChatMessage"("threadId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "public"."ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_orgId_idx" ON "public"."Notification"("orgId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_orgId_idx" ON "public"."DocumentTemplate"("orgId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_category_idx" ON "public"."DocumentTemplate"("category");

-- CreateIndex
CREATE INDEX "DocumentTemplate_isActive_idx" ON "public"."DocumentTemplate"("isActive");

-- CreateIndex
CREATE INDEX "Document_orgId_idx" ON "public"."Document"("orgId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "public"."Document"("status");

-- CreateIndex
CREATE INDEX "Document_linkedDealId_idx" ON "public"."Document"("linkedDealId");

-- CreateIndex
CREATE INDEX "Document_linkedContactId_idx" ON "public"."Document"("linkedContactId");

-- CreateIndex
CREATE INDEX "Document_folderId_idx" ON "public"."Document"("folderId");

-- CreateIndex
CREATE INDEX "DocumentFolder_orgId_idx" ON "public"."DocumentFolder"("orgId");

-- CreateIndex
CREATE INDEX "DocumentFolder_parentId_idx" ON "public"."DocumentFolder"("parentId");

-- CreateIndex
CREATE INDEX "DocumentFolder_linkedDealId_idx" ON "public"."DocumentFolder"("linkedDealId");

-- CreateIndex
CREATE INDEX "DocumentFolder_linkedContactId_idx" ON "public"."DocumentFolder"("linkedContactId");

-- CreateIndex
CREATE INDEX "DocumentFolder_isArchived_idx" ON "public"."DocumentFolder"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_email_key" ON "public"."Waitlist"("email");

-- CreateIndex
CREATE INDEX "Waitlist_createdAt_idx" ON "public"."Waitlist"("createdAt");

-- CreateIndex
CREATE INDEX "Waitlist_source_idx" ON "public"."Waitlist"("source");

-- CreateIndex
CREATE INDEX "Waitlist_role_idx" ON "public"."Waitlist"("role");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAIAnalysis_emailId_key" ON "public"."EmailAIAnalysis"("emailId");

-- CreateIndex
CREATE INDEX "EmailAIAnalysis_category_idx" ON "public"."EmailAIAnalysis"("category");

-- CreateIndex
CREATE INDEX "EmailAIAnalysis_priorityScore_idx" ON "public"."EmailAIAnalysis"("priorityScore");

-- CreateIndex
CREATE INDEX "EmailAIAnalysis_threadId_idx" ON "public"."EmailAIAnalysis"("threadId");

-- CreateIndex
CREATE INDEX "AISuggestedReply_emailId_idx" ON "public"."AISuggestedReply"("emailId");

-- CreateIndex
CREATE INDEX "AISuggestedReply_status_idx" ON "public"."AISuggestedReply"("status");

-- CreateIndex
CREATE INDEX "AISuggestedReply_threadId_idx" ON "public"."AISuggestedReply"("threadId");

-- CreateIndex
CREATE INDEX "AIFeedback_replyId_idx" ON "public"."AIFeedback"("replyId");

-- CreateIndex
CREATE INDEX "AIFeedback_feedbackType_idx" ON "public"."AIFeedback"("feedbackType");

-- CreateIndex
CREATE INDEX "AIEmailTemplate_category_idx" ON "public"."AIEmailTemplate"("category");

-- CreateIndex
CREATE INDEX "AIEmailTemplate_isActive_idx" ON "public"."AIEmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "AIProcessingQueue_status_idx" ON "public"."AIProcessingQueue"("status");

-- CreateIndex
CREATE INDEX "AIProcessingQueue_priority_idx" ON "public"."AIProcessingQueue"("priority");

-- CreateIndex
CREATE INDEX "AIProcessingQueue_scheduledFor_idx" ON "public"."AIProcessingQueue"("scheduledFor");

-- CreateIndex
CREATE INDEX "AIProcessingQueue_emailId_idx" ON "public"."AIProcessingQueue"("emailId");

-- CreateIndex
CREATE INDEX "LeadIntelligence_overallScore_idx" ON "public"."LeadIntelligence"("overallScore");

-- CreateIndex
CREATE INDEX "LeadIntelligence_conversionProbability_idx" ON "public"."LeadIntelligence"("conversionProbability");

-- CreateIndex
CREATE INDEX "LeadIntelligence_urgencyScore_idx" ON "public"."LeadIntelligence"("urgencyScore");

-- CreateIndex
CREATE INDEX "LeadIntelligence_lastAnalyzedAt_idx" ON "public"."LeadIntelligence"("lastAnalyzedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadIntelligence_orgId_leadId_key" ON "public"."LeadIntelligence"("orgId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadIntelligence_orgId_contactId_key" ON "public"."LeadIntelligence"("orgId", "contactId");

-- CreateIndex
CREATE INDEX "LeadInsight_orgId_idx" ON "public"."LeadInsight"("orgId");

-- CreateIndex
CREATE INDEX "LeadInsight_category_idx" ON "public"."LeadInsight"("category");

-- CreateIndex
CREATE INDEX "LeadInsight_impact_idx" ON "public"."LeadInsight"("impact");

-- CreateIndex
CREATE INDEX "LeadInsight_actionRequired_idx" ON "public"."LeadInsight"("actionRequired");

-- CreateIndex
CREATE INDEX "LeadInsight_isRead_idx" ON "public"."LeadInsight"("isRead");

-- CreateIndex
CREATE INDEX "LeadInsight_createdAt_idx" ON "public"."LeadInsight"("createdAt");

-- CreateIndex
CREATE INDEX "LeadPrediction_orgId_idx" ON "public"."LeadPrediction"("orgId");

-- CreateIndex
CREATE INDEX "LeadPrediction_predictionType_idx" ON "public"."LeadPrediction"("predictionType");

-- CreateIndex
CREATE INDEX "LeadPrediction_probability_idx" ON "public"."LeadPrediction"("probability");

-- CreateIndex
CREATE INDEX "LeadPrediction_expiresAt_idx" ON "public"."LeadPrediction"("expiresAt");

-- CreateIndex
CREATE INDEX "CommunicationOptimization_orgId_idx" ON "public"."CommunicationOptimization"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationOptimization_leadIntelligenceId_key" ON "public"."CommunicationOptimization"("leadIntelligenceId");

-- CreateIndex
CREATE UNIQUE INDEX "AutomatedAppointment_confirmationToken_key" ON "public"."AutomatedAppointment"("confirmationToken");

-- CreateIndex
CREATE UNIQUE INDEX "AutomatedAppointment_rescheduleToken_key" ON "public"."AutomatedAppointment"("rescheduleToken");

-- CreateIndex
CREATE INDEX "AutomatedAppointment_orgId_idx" ON "public"."AutomatedAppointment"("orgId");

-- CreateIndex
CREATE INDEX "AutomatedAppointment_status_idx" ON "public"."AutomatedAppointment"("status");

-- CreateIndex
CREATE INDEX "AutomatedAppointment_scheduledAt_idx" ON "public"."AutomatedAppointment"("scheduledAt");

-- CreateIndex
CREATE INDEX "AutomatedAppointment_appointmentType_idx" ON "public"."AutomatedAppointment"("appointmentType");

-- CreateIndex
CREATE INDEX "FollowUpSequence_orgId_idx" ON "public"."FollowUpSequence"("orgId");

-- CreateIndex
CREATE INDEX "FollowUpSequence_sequenceType_idx" ON "public"."FollowUpSequence"("sequenceType");

-- CreateIndex
CREATE INDEX "FollowUpSequence_isActive_idx" ON "public"."FollowUpSequence"("isActive");

-- CreateIndex
CREATE INDEX "FollowUpExecution_orgId_idx" ON "public"."FollowUpExecution"("orgId");

-- CreateIndex
CREATE INDEX "FollowUpExecution_status_idx" ON "public"."FollowUpExecution"("status");

-- CreateIndex
CREATE INDEX "FollowUpExecution_nextActionAt_idx" ON "public"."FollowUpExecution"("nextActionAt");

-- CreateIndex
CREATE INDEX "FollowUpExecution_sequenceId_idx" ON "public"."FollowUpExecution"("sequenceId");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_orgId_idx" ON "public"."AIGeneratedContent"("orgId");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_contentType_idx" ON "public"."AIGeneratedContent"("contentType");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_contentPurpose_idx" ON "public"."AIGeneratedContent"("contentPurpose");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_isActive_idx" ON "public"."AIGeneratedContent"("isActive");

-- CreateIndex
CREATE INDEX "AutomationRule_orgId_idx" ON "public"."AutomationRule"("orgId");

-- CreateIndex
CREATE INDEX "AutomationRule_isActive_idx" ON "public"."AutomationRule"("isActive");

-- CreateIndex
CREATE INDEX "AutomationRule_ruleType_idx" ON "public"."AutomationRule"("ruleType");

-- CreateIndex
CREATE INDEX "AutomationRule_priority_idx" ON "public"."AutomationRule"("priority");

-- CreateIndex
CREATE INDEX "AutomationRule_nextRunAt_idx" ON "public"."AutomationRule"("nextRunAt");

-- CreateIndex
CREATE INDEX "PropertyShowingTemplate_orgId_idx" ON "public"."PropertyShowingTemplate"("orgId");

-- CreateIndex
CREATE INDEX "PropertyShowingTemplate_propertyType_idx" ON "public"."PropertyShowingTemplate"("propertyType");

-- CreateIndex
CREATE INDEX "PropertyShowingTemplate_isActive_idx" ON "public"."PropertyShowingTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AgentPersonality_orgId_key" ON "public"."AgentPersonality"("orgId");

-- CreateIndex
CREATE INDEX "AgentPersonality_userId_idx" ON "public"."AgentPersonality"("userId");

-- CreateIndex
CREATE INDEX "OnboardingSession_orgId_idx" ON "public"."OnboardingSession"("orgId");

-- CreateIndex
CREATE INDEX "OnboardingSession_userId_idx" ON "public"."OnboardingSession"("userId");

-- CreateIndex
CREATE INDEX "OnboardingSession_status_idx" ON "public"."OnboardingSession"("status");

-- CreateIndex
CREATE INDEX "AIPersonalityTraining_orgId_idx" ON "public"."AIPersonalityTraining"("orgId");

-- CreateIndex
CREATE INDEX "AIPersonalityTraining_personalityId_idx" ON "public"."AIPersonalityTraining"("personalityId");

-- CreateIndex
CREATE INDEX "AIPersonalityTraining_trainingType_idx" ON "public"."AIPersonalityTraining"("trainingType");

-- CreateIndex
CREATE INDEX "AIPersonalityTraining_approved_idx" ON "public"."AIPersonalityTraining"("approved");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_orgId_idx" ON "public"."CommunicationTemplate"("orgId");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_personalityId_idx" ON "public"."CommunicationTemplate"("personalityId");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_templateType_idx" ON "public"."CommunicationTemplate"("templateType");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_scenario_idx" ON "public"."CommunicationTemplate"("scenario");

-- CreateIndex
CREATE INDEX "CommunicationTemplate_isActive_idx" ON "public"."CommunicationTemplate"("isActive");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrgMember" ADD CONSTRAINT "OrgMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrgMember" ADD CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailAccount" ADD CONSTRAINT "EmailAccount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailAccount" ADD CONSTRAINT "EmailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecureToken" ADD CONSTRAINT "SecureToken_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailThread" ADD CONSTRAINT "EmailThread_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailThread" ADD CONSTRAINT "EmailThread_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailMessage" ADD CONSTRAINT "EmailMessage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailMessage" ADD CONSTRAINT "EmailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."EmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarAccount" ADD CONSTRAINT "CalendarAccount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEvent" ADD CONSTRAINT "CalendarEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."CalendarAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEvent" ADD CONSTRAINT "CalendarEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."OrgMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "public"."PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."OrgMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_linkLeadId_fkey" FOREIGN KEY ("linkLeadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PipelineStage" ADD CONSTRAINT "PipelineStage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WebhookSubscription" ADD CONSTRAINT "WebhookSubscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StripeCustomer" ADD CONSTRAINT "StripeCustomer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_stripeCustomerId_fkey" FOREIGN KEY ("stripeCustomerId") REFERENCES "public"."StripeCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushNotificationLog" ADD CONSTRAINT "PushNotificationLog_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES "public"."EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushNotificationLog" ADD CONSTRAINT "PushNotificationLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatThread" ADD CONSTRAINT "ChatThread_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatThread" ADD CONSTRAINT "ChatThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_linkedDealId_fkey" FOREIGN KEY ("linkedDealId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_linkedContactId_fkey" FOREIGN KEY ("linkedContactId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentFolder" ADD CONSTRAINT "DocumentFolder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentFolder" ADD CONSTRAINT "DocumentFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentFolder" ADD CONSTRAINT "DocumentFolder_linkedDealId_fkey" FOREIGN KEY ("linkedDealId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentFolder" ADD CONSTRAINT "DocumentFolder_linkedContactId_fkey" FOREIGN KEY ("linkedContactId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIFeedback" ADD CONSTRAINT "AIFeedback_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "public"."AISuggestedReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadIntelligence" ADD CONSTRAINT "LeadIntelligence_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadIntelligence" ADD CONSTRAINT "LeadIntelligence_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadIntelligence" ADD CONSTRAINT "LeadIntelligence_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadInsight" ADD CONSTRAINT "LeadInsight_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadInsight" ADD CONSTRAINT "LeadInsight_leadIntelligenceId_fkey" FOREIGN KEY ("leadIntelligenceId") REFERENCES "public"."LeadIntelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadPrediction" ADD CONSTRAINT "LeadPrediction_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadPrediction" ADD CONSTRAINT "LeadPrediction_leadIntelligenceId_fkey" FOREIGN KEY ("leadIntelligenceId") REFERENCES "public"."LeadIntelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunicationOptimization" ADD CONSTRAINT "CommunicationOptimization_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunicationOptimization" ADD CONSTRAINT "CommunicationOptimization_leadIntelligenceId_fkey" FOREIGN KEY ("leadIntelligenceId") REFERENCES "public"."LeadIntelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutomatedAppointment" ADD CONSTRAINT "AutomatedAppointment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutomatedAppointment" ADD CONSTRAINT "AutomatedAppointment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutomatedAppointment" ADD CONSTRAINT "AutomatedAppointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FollowUpSequence" ADD CONSTRAINT "FollowUpSequence_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FollowUpExecution" ADD CONSTRAINT "FollowUpExecution_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FollowUpExecution" ADD CONSTRAINT "FollowUpExecution_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "public"."FollowUpSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FollowUpExecution" ADD CONSTRAINT "FollowUpExecution_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FollowUpExecution" ADD CONSTRAINT "FollowUpExecution_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutomationRule" ADD CONSTRAINT "AutomationRule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyShowingTemplate" ADD CONSTRAINT "PropertyShowingTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentPersonality" ADD CONSTRAINT "AgentPersonality_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnboardingSession" ADD CONSTRAINT "OnboardingSession_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIPersonalityTraining" ADD CONSTRAINT "AIPersonalityTraining_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunicationTemplate" ADD CONSTRAINT "CommunicationTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

