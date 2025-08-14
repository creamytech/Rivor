import { Queue } from "bullmq";

const globalQueues = globalThis as unknown as {
  emailSyncQueue?: Queue;
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