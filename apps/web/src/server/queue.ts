import { Queue } from "bullmq";

const globalQueues = globalThis as unknown as {
  emailSyncQueue?: Queue;
  emailBackfillQueue?: Queue;
  emailSummarizeQueue?: Queue;
  calendarSyncQueue?: Queue;
  calendarBackfillQueue?: Queue;
  webhooksRenewQueue?: Queue;
  healthProbeQueue?: Queue;
  cryptoRotateQueue?: Queue;
  retentionPurgeQueue?: Queue;
  indexRebuildQueue?: Queue;
};

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return { connection: { url } } as const;
}

export function getEmailSyncQueue(): Queue {
  if (!globalQueues.emailSyncQueue) {
    globalQueues.emailSyncQueue = new Queue("email-sync", getConnection());
  }
  return globalQueues.emailSyncQueue;
}

export async function enqueueEmailSync(orgId: string, emailAccountId: string) {
  try {
    const queue = getEmailSyncQueue();
    await queue.add("sync", { orgId, emailAccountId }, { attempts: 3, backoff: { type: "exponential", delay: 1000 } });
  } catch (err) {
    console.warn("[queue] enqueueEmailSync failed", err);
  }
}

export async function enqueueCalendarSync(orgId: string, calendarAccountId: string, daysPast = 30, daysFuture = 30) {
  try {
    const queue = getCalendarSyncQueue();
    await queue.add("sync", { 
      orgId, 
      calendarAccountId, 
      daysPastToSync: daysPast, 
      daysFutureToSync: daysFuture 
    }, { 
      attempts: 3, 
      backoff: { type: "exponential", delay: 1000 } 
    });
  } catch (err) {
    console.warn("[queue] enqueueCalendarSync failed", err);
  }
}

// Queue for initial email backfill jobs
export function getEmailBackfillQueue(): Queue {
  if (!globalQueues.emailBackfillQueue) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    globalQueues.emailBackfillQueue = new Queue('email-backfill', { connection: { url } });
  }
  return globalQueues.emailBackfillQueue;
}

export async function enqueueEmailBackfill(orgId: string, emailAccountId: string, daysPastToSync = 90) {
  try {
    const queue = getEmailBackfillQueue();
    const idempotencyKey = `${orgId}-${emailAccountId}-backfill`;
    
    await queue.add("backfill", 
      { orgId, emailAccountId, daysPastToSync }, 
      { 
        jobId: idempotencyKey, // Prevents duplicate backfill jobs
        attempts: 2, 
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 10,
        removeOnFail: 5
      }
    );
    console.log(`[queue] enqueued email backfill for account ${emailAccountId}`);
  } catch (err) {
    console.warn("[queue] enqueueEmailBackfill failed", err);
  }
}

// Queue for calendar backfill jobs
export function getCalendarBackfillQueue(): Queue {
  if (!globalQueues.calendarBackfillQueue) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    globalQueues.calendarBackfillQueue = new Queue('calendar-backfill', { connection: { url } });
  }
  return globalQueues.calendarBackfillQueue;
}

export async function enqueueCalendarBackfill(orgId: string, calendarAccountId: string, daysFutureToSync = 90) {
  try {
    const queue = getCalendarBackfillQueue();
    const idempotencyKey = `${orgId}-${calendarAccountId}-backfill`;
    
    await queue.add("backfill", 
      { orgId, calendarAccountId, daysFutureToSync }, 
      { 
        jobId: idempotencyKey, // Prevents duplicate backfill jobs
        attempts: 2, 
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 10,
        removeOnFail: 5
      }
    );
    console.log(`[queue] enqueued calendar backfill for account ${calendarAccountId}`);
  } catch (err) {
    console.warn("[queue] enqueueCalendarBackfill failed", err);
  }
}

export function getEmailSummarizeQueue(): Queue {
  if (!globalQueues.emailSummarizeQueue) {
    globalQueues.emailSummarizeQueue = new Queue("email-summarize", getConnection());
  }
  return globalQueues.emailSummarizeQueue;
}

export function getCalendarSyncQueue(): Queue {
  if (!globalQueues.calendarSyncQueue) {
    globalQueues.calendarSyncQueue = new Queue("calendar-sync", getConnection());
  }
  return globalQueues.calendarSyncQueue;
}

export function getWebhooksRenewQueue(): Queue {
  if (!globalQueues.webhooksRenewQueue) {
    globalQueues.webhooksRenewQueue = new Queue("webhooks-renew", getConnection());
  }
  return globalQueues.webhooksRenewQueue;
}

export function getHealthProbeQueue(): Queue {
  if (!globalQueues.healthProbeQueue) {
    globalQueues.healthProbeQueue = new Queue("health-probe", getConnection());
  }
  return globalQueues.healthProbeQueue;
}

export async function enqueueWebhookRenewal(
  provider: 'gmail' | 'calendar',
  accountId: string,
  orgId: string,
  delayMs?: number
) {
  const queue = getWebhooksRenewQueue();
  await queue.add(
    `renew-${provider}-${accountId}`,
    { provider, accountId, orgId },
    {
      delay: delayMs,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000, // Start with 1 minute delay
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );
}

export function getCryptoRotateQueue(): Queue {
  if (!globalQueues.cryptoRotateQueue) {
    globalQueues.cryptoRotateQueue = new Queue("crypto-rotate", getConnection());
  }
  return globalQueues.cryptoRotateQueue;
}

export function getRetentionPurgeQueue(): Queue {
  if (!globalQueues.retentionPurgeQueue) {
    globalQueues.retentionPurgeQueue = new Queue("retention-purge", getConnection());
  }
  return globalQueues.retentionPurgeQueue;
}

export function getIndexRebuildQueue(): Queue {
  if (!globalQueues.indexRebuildQueue) {
    globalQueues.indexRebuildQueue = new Queue("index-rebuild", getConnection());
  }
  return globalQueues.indexRebuildQueue;
}