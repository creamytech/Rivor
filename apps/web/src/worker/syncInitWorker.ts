import { Worker, Job } from 'bullmq';
import { processInitialSyncJob, type StartInitialSyncJobData } from '../server/queue-jobs';
import { logger } from '@/lib/logger';

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return { url };
}

// Worker for initial sync jobs
const worker = new Worker(
  'sync:init',
  async (job: Job<StartInitialSyncJobData>) => {
    await processInitialSyncJob(job);
  },
  {
    connection: getConnection(),
    concurrency: 2, // Process up to 2 sync init jobs simultaneously
  }
);

worker.on('ready', () => {
  logger.info('Sync init worker ready', {
    queueName: 'sync:init',
    worker: 'syncInitWorker'
  });
});

worker.on('active', (job: Job) => {
  logger.info('Sync init job started', {
    jobId: job.id,
    orgId: job.data.orgId,
    emailAccountId: job.data.emailAccountId,
    provider: job.data.provider,
  });
});

worker.on('completed', (job: Job) => {
  logger.info('Sync init job completed', {
    jobId: job.id,
    orgId: job.data.orgId,
    emailAccountId: job.data.emailAccountId,
    provider: job.data.provider,
    duration: Date.now() - job.timestamp,
  });
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error('Sync init job failed', {
    jobId: job?.id,
    orgId: job?.data?.orgId,
    emailAccountId: job?.data?.emailAccountId,
    provider: job?.data?.provider,
    error: err.message,
    failedReason: job?.failedReason,
  });
});

worker.on('stalled', (jobId: string) => {
  logger.warn('Sync init job stalled', { jobId });
});

worker.on('error', (err: Error) => {
  logger.error('Sync init worker error', { error: err.message });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down sync init worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down sync init worker...');
  await worker.close();
  process.exit(0);
});

export default worker;
