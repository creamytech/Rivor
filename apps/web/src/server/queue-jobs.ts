import { Queue, Job } from "bullmq";
import { prisma } from "./db";
import { retryFailedTokenEncryption } from "./secure-tokens";
import { logger } from "@/lib/logger";

// Queue setup
function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return { connection: { url } } as const;
}

let tokenEncryptionQueue: Queue | undefined;
let syncInitQueue: Queue | undefined;

export function getTokenEncryptionQueue(): Queue {
  if (!tokenEncryptionQueue) {
    tokenEncryptionQueue = new Queue("token:encrypt", getConnection());
  }
  return tokenEncryptionQueue;
}

export function getSyncInitQueue(): Queue {
  if (!syncInitQueue) {
    syncInitQueue = new Queue("sync:init", getConnection());
  }
  return syncInitQueue;
}

// Job interfaces
export interface EncryptTokenJobData {
  orgId: string;
  emailAccountId: string;
  tokenRef: string;
  originalToken: string; // Will be handled securely
  provider: string;
  externalAccountId: string;
}

export interface StartInitialSyncJobData {
  orgId: string;
  emailAccountId: string;
  provider: string;
}

/**
 * Enqueues token encryption retry with exponential backoff
 */
export async function enqueueTokenEncryption(data: EncryptTokenJobData): Promise<void> {
  const queue = getTokenEncryptionQueue();
  
  await queue.add(
    "encrypt-token",
    data,
    {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 seconds
      },
      removeOnComplete: 10,
      removeOnFail: 5,
      delay: 1000, // Initial delay of 1 second
    }
  );

  logger.info('Enqueued token encryption job', {
    orgId: data.orgId,
    emailAccountId: data.emailAccountId,
    tokenRef: data.tokenRef,
    provider: data.provider,
  });
}

/**
 * Enqueues initial sync job (only if encryption is successful)
 */
export async function enqueueInitialSync(data: StartInitialSyncJobData): Promise<void> {
  const queue = getSyncInitQueue();
  
  await queue.add(
    "start-sync",
    data,
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 seconds
      },
      removeOnComplete: 5,
      removeOnFail: 3,
      delay: 2000, // Wait 2 seconds before starting
    }
  );

  logger.info('Enqueued initial sync job', {
    orgId: data.orgId,
    emailAccountId: data.emailAccountId,
    provider: data.provider,
  });
}

/**
 * Processes token encryption jobs
 */
export async function processTokenEncryptionJob(job: Job<EncryptTokenJobData>): Promise<void> {
  const { orgId, emailAccountId, tokenRef, originalToken, provider, externalAccountId } = job.data;
  
  logger.info('Processing token encryption job', {
    jobId: job.id,
    orgId,
    emailAccountId,
    tokenRef,
    provider,
    attempt: job.attemptsMade + 1,
  });

  try {
    // Attempt to encrypt the token
    const success = await retryFailedTokenEncryption(tokenRef, originalToken);
    
    if (success) {
      // Update EmailAccount status
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: {
          encryptionStatus: 'ok',
          status: 'connected',
          tokenRef,
          kmsErrorCode: null,
          kmsErrorAt: null,
        },
      });

      // Schedule initial sync now that encryption is successful
      await enqueueInitialSync({
        orgId,
        emailAccountId,
        provider,
      });

      logger.info('Token encryption job completed successfully', {
        jobId: job.id,
        emailAccountId,
        tokenRef,
      });

    } else {
      throw new Error('Token encryption retry failed');
    }

  } catch (error: any) {
    logger.error('Token encryption job failed', {
      jobId: job.id,
      orgId,
      emailAccountId,
      tokenRef,
      error: error?.message || error,
      attempt: job.attemptsMade + 1,
    });

    // If this is the final attempt, mark as permanently failed
    if (job.attemptsMade >= (job.opts.attempts || 5) - 1) {
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: {
          encryptionStatus: 'failed',
          status: 'action_needed',
          kmsErrorCode: getErrorCode(error),
          kmsErrorAt: new Date(),
        },
      });

      logger.error('Token encryption job permanently failed', {
        jobId: job.id,
        emailAccountId,
        tokenRef,
        totalAttempts: job.attemptsMade + 1,
      });
    }

    throw error;
  }
}

/**
 * Processes initial sync jobs
 */
export async function processInitialSyncJob(job: Job<StartInitialSyncJobData>): Promise<void> {
  const { orgId, emailAccountId, provider } = job.data;
  
  logger.info('Processing initial sync job', {
    jobId: job.id,
    orgId,
    emailAccountId,
    provider,
    attempt: job.attemptsMade + 1,
  });

  try {
    // Check that EmailAccount still has valid encryption
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
    });

    if (!emailAccount) {
      throw new Error('EmailAccount not found');
    }

    if (emailAccount.encryptionStatus !== 'ok') {
      throw new Error(`Cannot start sync - encryption status is ${emailAccount.encryptionStatus}`);
    }

    // Update sync status
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: {
        syncStatus: 'scheduled',
      },
    });

    // Import and call the appropriate sync function
    if (provider === 'google') {
      const { enqueueEmailSync } = await import("./queue");
      await enqueueEmailSync(orgId, emailAccountId);
    } else if (provider === 'microsoft') {
      // Add Microsoft sync when implemented
      logger.warn('Microsoft sync not yet implemented', { emailAccountId });
    }

    logger.info('Initial sync job completed successfully', {
      jobId: job.id,
      emailAccountId,
      provider,
    });

  } catch (error: any) {
    // Update sync status on failure
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: {
        syncStatus: 'error',
        errorReason: error.message,
      },
    });

    logger.error('Initial sync job failed', {
      jobId: job.id,
      orgId,
      emailAccountId,
      provider,
      error,
      attempt: job.attemptsMade + 1,
    });

    throw error;
  }
}

/**
 * Dead letter queue handler for permanently failed jobs
 */
export async function handleDeadLetterJob(job: Job): Promise<void> {
  logger.error('Job moved to dead letter queue', {
    jobId: job.id,
    jobName: job.name,
    queueName: job.queueName,
    data: job.data,
    failedReason: job.failedReason,
    totalAttempts: job.attemptsMade,
  });

  // Send alert for dead letter jobs
  await sendDeadLetterAlert(job);
}

/**
 * Sends alert for dead letter jobs (implement with your alerting system)
 */
async function sendDeadLetterAlert(job: Job): Promise<void> {
  // This would integrate with your alerting system (Sentry, PagerDuty, etc.)
  logger.error('ALERT: Job permanently failed and moved to dead letter queue', {
    jobId: job.id,
    jobName: job.name,
    queueName: job.queueName,
    data: job.data,
    alertLevel: 'high',
  });

  // You could also save to a monitoring table
  try {
    await prisma.auditLog.create({
      data: {
        orgId: job.data?.orgId || 'system',
        action: 'dead_letter_job',
        resource: `${job.queueName}:${job.name}`,
        success: false,
        purpose: `Job ${job.id} permanently failed after ${job.attemptsMade} attempts`,
      },
    });
  } catch (auditError) {
    logger.error('Failed to log dead letter job to audit', { auditError });
  }
}

/**
 * Helper to extract error codes
 */
function getErrorCode(error: any): string {
  if (error?.code) return error.code;
  if (error?.name) return error.name;
  return 'UNKNOWN_ERROR';
}

/**
 * Gets queue statistics for monitoring
 */
export async function getQueueStats() {
  try {
    const tokenQueue = getTokenEncryptionQueue();
    const syncQueue = getSyncInitQueue();

    const [tokenWaiting, tokenActive, tokenFailed, syncWaiting, syncActive, syncFailed] = await Promise.all([
      tokenQueue.getWaiting(),
      tokenQueue.getActive(),
      tokenQueue.getFailed(),
      syncQueue.getWaiting(),
      syncQueue.getActive(),
      syncQueue.getFailed(),
    ]);

    return {
      tokenEncryption: {
        waiting: tokenWaiting.length,
        active: tokenActive.length,
        failed: tokenFailed.length,
      },
      syncInit: {
        waiting: syncWaiting.length,
        active: syncActive.length,
        failed: syncFailed.length,
      },
    };
  } catch (error: any) {
    logger.error('Failed to get queue stats', { error });
    return null;
  }
}
