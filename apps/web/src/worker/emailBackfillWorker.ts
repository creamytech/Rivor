import { Worker, Job } from 'bullmq';
import { prisma } from '@/server/db';
import { GmailService } from '@/server/gmail';
import { logger } from '@/lib/logger';

interface BackfillJobData {
  orgId: string;
  emailAccountId: string;
  daysPastToSync?: number;
}

function getConnection() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return { connection: { url } } as const;
}

async function processJob(job: Job) {
  const { orgId, emailAccountId, daysPastToSync = 90 } = job.data as BackfillJobData;
  const correlationId = `backfill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('[worker] email:backfill started', { 
    correlationId,
    orgId, 
    emailAccountId, 
    daysPastToSync 
  });

  try {
    // Update sync status to running with proper status
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: { 
        syncStatus: 'running',
        lastSyncedAt: new Date(),
        errorReason: null,
        status: 'connected' // Ensure status is connected during backfill
      }
    });

    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
      include: { org: true }
    });

    if (!emailAccount) {
      throw new Error(`Email account ${emailAccountId} not found`);
    }

    if (emailAccount.provider !== 'google') {
      throw new Error(`Backfill only supports Google provider, got: ${emailAccount.provider}`);
    }

    // Create Gmail service
    const gmailService = await GmailService.createFromAccount(orgId, emailAccountId);
    
    // Calculate date range for backfill
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysPastToSync);
    
    // Perform initial backfill
    await gmailService.performInitialBackfill(orgId, emailAccountId, cutoffDate);
    
    // Set up Gmail watch after successful backfill
    try {
      await gmailService.watchMailbox(orgId, emailAccountId);
      logger.info('[worker] Gmail watch setup successful', { 
        correlationId,
        emailAccountId 
      });
    } catch (watchError: unknown) {
      // Don't fail the whole job if watch setup fails
      logger.warn('[worker] Gmail watch setup failed, backfill completed', {
        correlationId,
        emailAccountId,
        error: watchError.message
      });
    }

    // Update sync status to idle (backfilled)
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: { 
        syncStatus: 'idle',
        lastSyncedAt: new Date(),
        status: 'connected'
      }
    });

    logger.info('[worker] email:backfill completed successfully', { 
      correlationId,
      orgId, 
      emailAccountId 
    });

  } catch (error: unknown) {
    logger.error('[worker] email:backfill failed', { 
      correlationId,
      orgId, 
      emailAccountId, 
      error: error.message 
    });

    // Update sync status to error
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: { 
        syncStatus: 'error',
        errorReason: error.message
      }
    }).catch(() => {}); // Don't fail on database update error

    throw error;
  }
}

export function startEmailBackfillWorker() {
  const worker = new Worker('email-backfill', processJob, getConnection());
  
  worker.on('failed', (job, err) => {
    console.error('[worker] email-backfill failed', job?.id, err);
  });
  
  worker.on('completed', (job) => {
    console.log('[worker] email-backfill completed', job.id);
  });
  
  return worker;
}
