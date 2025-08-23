import { GmailService } from './gmail';
import { leadDetectionService } from './lead-detection';
import { notificationService } from './notification-service';
import { prisma } from './db';
import { logger } from '@/lib/logger';

export interface EmailProcessingResult {
  threadId: string;
  messageId: string;
  processed: boolean;
  leadDetected: boolean;
  leadId?: string;
  confidence?: number;
  error?: string;
}

export interface WorkflowConfig {
  autoProcessNewEmails: boolean;
  batchProcessingEnabled: boolean;
  processingIntervalMinutes: number;
  maxEmailsPerBatch: number;
  skipInternalEmails: boolean;
  leadDetectionEnabled: boolean;
  notificationsEnabled: boolean;
}

export class EmailWorkflowService {
  private isProcessing = false;
  private processingQueue: string[] = [];

  private defaultConfig: WorkflowConfig = {
    autoProcessNewEmails: true,
    batchProcessingEnabled: true,
    processingIntervalMinutes: 5,
    maxEmailsPerBatch: 20,
    skipInternalEmails: true,
    leadDetectionEnabled: true,
    notificationsEnabled: true
  };

  /**
   * Process a single email thread through the complete workflow
   */
  async processEmailThread(
    orgId: string,
    threadId: string,
    config?: Partial<WorkflowConfig>
  ): Promise<EmailProcessingResult> {
    const workflowConfig = { ...this.defaultConfig, ...config };
    
    try {
      logger.info('Starting email thread processing', {
        orgId,
        threadId,
        action: 'workflow_start'
      });

      // Check if thread exists and get basic info
      const thread = await prisma.emailThread.findFirst({
        where: { id: threadId, orgId },
        include: {
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1
          },
          lead: true
        }
      });

      if (!thread) {
        throw new Error(`Thread ${threadId} not found for org ${orgId}`);
      }

      const latestMessage = thread.messages[0];
      if (!latestMessage) {
        throw new Error(`No messages found in thread ${threadId}`);
      }

      // Skip if already has a lead and we're not reprocessing
      if (thread.lead) {
        logger.info('Thread already has associated lead', {
          orgId,
          threadId,
          leadId: thread.lead.id,
          action: 'workflow_skipped'
        });
        return {
          threadId,
          messageId: latestMessage.id,
          processed: true,
          leadDetected: true,
          leadId: thread.lead.id
        };
      }

      // Skip internal emails if configured
      if (workflowConfig.skipInternalEmails) {
        const isInternal = await this.isInternalEmail(orgId, latestMessage.id);
        if (isInternal) {
          logger.info('Skipping internal email', {
            orgId,
            threadId,
            messageId: latestMessage.id,
            action: 'workflow_skipped_internal'
          });
          return {
            threadId,
            messageId: latestMessage.id,
            processed: true,
            leadDetected: false
          };
        }
      }

      let leadDetected = false;
      let leadId: string | undefined;
      let confidence: number | undefined;

      // Run lead detection if enabled
      if (workflowConfig.leadDetectionEnabled) {
        const leadResult = await leadDetectionService.analyzeMessageForLead(
          orgId,
          latestMessage.id,
          threadId
        );

        confidence = leadResult.confidence;
        
        // Create lead if confidence is high enough
        if (leadResult.isLead && leadResult.confidence > 0.6) {
          leadId = await leadDetectionService.createLeadFromEmail(
            orgId,
            threadId,
            latestMessage.id,
            leadResult
          );
          leadDetected = true;

          logger.info('Lead created from email workflow', {
            orgId,
            threadId,
            leadId,
            confidence: leadResult.confidence,
            action: 'workflow_lead_created'
          });
        }
      }

      // Send notifications if enabled
      if (workflowConfig.notificationsEnabled && leadDetected && leadId) {
        await notificationService.processEmailForNotifications(orgId, threadId);
      }

      // Mark thread as processed
      await this.markThreadAsProcessed(orgId, threadId);

      const result: EmailProcessingResult = {
        threadId,
        messageId: latestMessage.id,
        processed: true,
        leadDetected,
        leadId,
        confidence
      };

      logger.info('Email thread processing completed', {
        orgId,
        threadId,
        leadDetected,
        confidence,
        action: 'workflow_complete'
      });

      return result;

    } catch (error) {
      logger.error('Email thread processing failed', {
        orgId,
        threadId,
        error: error instanceof Error ? error.message : String(error),
        action: 'workflow_failed'
      });

      return {
        threadId,
        messageId: '',
        processed: false,
        leadDetected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch process multiple email threads
   */
  async batchProcessEmails(
    orgId: string,
    threadIds?: string[],
    config?: Partial<WorkflowConfig>
  ): Promise<{
    totalProcessed: number;
    leadsDetected: number;
    errors: number;
    results: EmailProcessingResult[];
  }> {
    if (this.isProcessing) {
      throw new Error('Batch processing already in progress');
    }

    this.isProcessing = true;
    const workflowConfig = { ...this.defaultConfig, ...config };

    try {
      logger.info('Starting batch email processing', {
        orgId,
        threadCount: threadIds?.length || 'auto',
        action: 'batch_workflow_start'
      });

      // Get threads to process if not provided
      if (!threadIds) {
        threadIds = await this.getUnprocessedThreadIds(
          orgId,
          workflowConfig.maxEmailsPerBatch
        );
      }

      if (threadIds.length === 0) {
        logger.info('No threads to process', {
          orgId,
          action: 'batch_workflow_empty'
        });
        return {
          totalProcessed: 0,
          leadsDetected: 0,
          errors: 0,
          results: []
        };
      }

      const results: EmailProcessingResult[] = [];
      let totalProcessed = 0;
      let leadsDetected = 0;
      let errors = 0;

      // Process threads with rate limiting
      for (const threadId of threadIds) {
        try {
          const result = await this.processEmailThread(orgId, threadId, workflowConfig);
          results.push(result);

          if (result.processed) {
            totalProcessed++;
          }
          if (result.leadDetected) {
            leadsDetected++;
          }
          if (result.error) {
            errors++;
          }

          // Add small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          errors++;
          results.push({
            threadId,
            messageId: '',
            processed: false,
            leadDetected: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info('Batch email processing completed', {
        orgId,
        totalProcessed,
        leadsDetected,
        errors,
        threadCount: threadIds.length,
        action: 'batch_workflow_complete'
      });

      return {
        totalProcessed,
        leadsDetected,
        errors,
        results
      };

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Handle new email webhook from Gmail
   */
  async handleGmailWebhook(
    orgId: string,
    emailAccountId: string,
    historyId: string
  ): Promise<void> {
    try {
      logger.info('Processing Gmail webhook', {
        orgId,
        emailAccountId,
        historyId,
        action: 'webhook_received'
      });

      // Create Gmail service instance
      const gmailService = await GmailService.createFromAccount(orgId, emailAccountId);

      // Sync messages based on history ID
      await gmailService.syncMessages(orgId, emailAccountId, historyId);

      // Get recently added threads (within last hour)
      const recentThreadIds = await this.getRecentThreadIds(orgId, emailAccountId, 60);

      if (recentThreadIds.length > 0) {
        // Process new threads automatically if enabled
        const config = await this.getWorkflowConfig(orgId);
        if (config.autoProcessNewEmails) {
          // Add to processing queue to avoid blocking the webhook
          this.processingQueue.push(...recentThreadIds.map(id => `${orgId}:${id}`));
          
          // Process queue asynchronously
          setImmediate(() => this.processQueue());
        }
      }

      logger.info('Gmail webhook processed', {
        orgId,
        emailAccountId,
        newThreads: recentThreadIds.length,
        action: 'webhook_processed'
      });

    } catch (error) {
      logger.error('Gmail webhook processing failed', {
        orgId,
        emailAccountId,
        historyId,
        error: error instanceof Error ? error.message : String(error),
        action: 'webhook_failed'
      });
      throw error;
    }
  }

  /**
   * Process the queue of pending email threads
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const batch = this.processingQueue.splice(0, 10); // Process up to 10 at a time
      
      for (const item of batch) {
        const [orgId, threadId] = item.split(':');
        try {
          await this.processEmailThread(orgId, threadId);
        } catch (error) {
          logger.error('Queue processing error', {
            orgId,
            threadId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Continue processing if more items remain
      if (this.processingQueue.length > 0) {
        setImmediate(() => this.processQueue());
      }

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get workflow configuration for organization
   */
  async getWorkflowConfig(orgId: string): Promise<WorkflowConfig> {
    // For now return default config
    // This could be extended to read from database settings
    return this.defaultConfig;
  }

  /**
   * Get unprocessed thread IDs for an organization
   */
  private async getUnprocessedThreadIds(
    orgId: string,
    limit: number
  ): Promise<string[]> {
    const threads = await prisma.emailThread.findMany({
      where: {
        orgId,
        leadId: null, // No associated lead yet
        status: {
          not: 'processed'
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: { id: true }
    });

    return threads.map(t => t.id);
  }

  /**
   * Get recently created thread IDs
   */
  private async getRecentThreadIds(
    orgId: string,
    emailAccountId: string,
    minutesBack: number
  ): Promise<string[]> {
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);

    const threads = await prisma.emailThread.findMany({
      where: {
        orgId,
        accountId: emailAccountId,
        createdAt: {
          gte: cutoff
        }
      },
      select: { id: true }
    });

    return threads.map(t => t.id);
  }

  /**
   * Check if email is internal (between org members)
   */
  private async isInternalEmail(
    orgId: string,
    messageId: string
  ): Promise<boolean> {
    try {
      // Get message details
      const message = await prisma.emailMessage.findFirst({
        where: { id: messageId, orgId }
      });

      if (!message) return false;

      // Get org email domains
      const emailAccounts = await prisma.emailAccount.findMany({
        where: { orgId },
        select: { email: true }
      });

      const orgDomains = emailAccounts
        .map(acc => acc.email?.split('@')[1])
        .filter(Boolean);

      // Check if sender/recipient are from same domain
      // This is a simplified check - could be enhanced with actual decryption
      // For now, consider it internal if we have multiple accounts in same org
      return emailAccounts.length > 1;

    } catch (error) {
      logger.warn('Failed to check if email is internal', {
        orgId,
        messageId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Mark thread as processed in workflow
   */
  private async markThreadAsProcessed(
    orgId: string,
    threadId: string
  ): Promise<void> {
    await prisma.emailThread.update({
      where: { id: threadId },
      data: { 
        status: 'processed',
        updatedAt: new Date()
      }
    });
  }

  /**
   * Get workflow statistics for organization
   */
  async getWorkflowStats(orgId: string): Promise<{
    totalThreads: number;
    processedThreads: number;
    leadsCreated: number;
    pendingThreads: number;
    processingRate: number;
  }> {
    const [
      totalThreads,
      processedThreads,
      leadsCreated,
      pendingThreads
    ] = await Promise.all([
      prisma.emailThread.count({ where: { orgId } }),
      prisma.emailThread.count({ where: { orgId, status: 'processed' } }),
      prisma.lead.count({ where: { orgId, source: 'email_detection' } }),
      prisma.emailThread.count({ 
        where: { 
          orgId, 
          leadId: null,
          status: { not: 'processed' }
        }
      })
    ]);

    const processingRate = totalThreads > 0 
      ? Math.round((processedThreads / totalThreads) * 100)
      : 0;

    return {
      totalThreads,
      processedThreads,
      leadsCreated,
      pendingThreads,
      processingRate
    };
  }

  /**
   * Start automated batch processing interval
   */
  startAutomatedProcessing(orgId: string): void {
    const config = this.defaultConfig;
    
    setInterval(async () => {
      try {
        if (!this.isProcessing) {
          logger.info('Starting scheduled email processing', {
            orgId,
            action: 'scheduled_processing_start'
          });
          
          await this.batchProcessEmails(orgId);
        }
      } catch (error) {
        logger.error('Scheduled processing failed', {
          orgId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, config.processingIntervalMinutes * 60 * 1000);
  }
}

export const emailWorkflowService = new EmailWorkflowService();