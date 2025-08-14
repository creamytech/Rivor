import { Queue } from "bullmq";

const globalQueues = globalThis as unknown as {
  emailSyncQueue?: Queue;
  emailSummarizeQueue?: Queue;
  calendarSyncQueue?: Queue;
  webhooksRenewQueue?: Queue;
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
    globalQueues.emailSyncQueue = new Queue("email:sync", getConnection());
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

export function getEmailSummarizeQueue(): Queue {
  if (!globalQueues.emailSummarizeQueue) {
    globalQueues.emailSummarizeQueue = new Queue("email:summarize", getConnection());
  }
  return globalQueues.emailSummarizeQueue;
}

export function getCalendarSyncQueue(): Queue {
  if (!globalQueues.calendarSyncQueue) {
    globalQueues.calendarSyncQueue = new Queue("calendar:sync", getConnection());
  }
  return globalQueues.calendarSyncQueue;
}

export function getWebhooksRenewQueue(): Queue {
  if (!globalQueues.webhooksRenewQueue) {
    globalQueues.webhooksRenewQueue = new Queue("webhooks:renew", getConnection());
  }
  return globalQueues.webhooksRenewQueue;
}

export function getCryptoRotateQueue(): Queue {
  if (!globalQueues.cryptoRotateQueue) {
    globalQueues.cryptoRotateQueue = new Queue("crypto:rotate", getConnection());
  }
  return globalQueues.cryptoRotateQueue;
}

export function getRetentionPurgeQueue(): Queue {
  if (!globalQueues.retentionPurgeQueue) {
    globalQueues.retentionPurgeQueue = new Queue("retention:purge", getConnection());
  }
  return globalQueues.retentionPurgeQueue;
}

export function getIndexRebuildQueue(): Queue {
  if (!globalQueues.indexRebuildQueue) {
    globalQueues.indexRebuildQueue = new Queue("index:rebuild", getConnection());
  }
  return globalQueues.indexRebuildQueue;
}