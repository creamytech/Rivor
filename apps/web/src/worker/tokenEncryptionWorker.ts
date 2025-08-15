import { Worker, Job } from 'bullmq';
import { processTokenEncryptionJob, type EncryptTokenJobData } from '../server/queue-jobs';
import { logger } from '@/lib/logger';

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return { url };
}

// Worker for token encryption jobs
const worker = new Worker(
  'token:encrypt',
  async (job: Job<EncryptTokenJobData>) => {
    await processTokenEncryptionJob(job);
  },
  {
    connection: getConnection(),
    concurrency: 3, // Process up to 3 token encryption jobs simultaneously
  }
);

worker.on('ready', () => {
  logger.info('Token encryption worker ready', {
    queueName: 'token:encrypt',
    worker: 'tokenEncryptionWorker'
  });
});

worker.on('active', (job: Job) => {
  logger.info('Token encryption job started', {
    jobId: job.id,
    orgId: job.data.orgId,
    emailAccountId: job.data.emailAccountId,
  });
});

worker.on('completed', (job: Job) => {
  logger.info('Token encryption job completed', {
    jobId: job.id,
    orgId: job.data.orgId,
    emailAccountId: job.data.emailAccountId,
    duration: Date.now() - job.timestamp,
  });
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error('Token encryption job failed', {
    jobId: job?.id,
    orgId: job?.data?.orgId,
    emailAccountId: job?.data?.emailAccountId,
    error: err.message,
    failedReason: job?.failedReason,
  });
});

worker.on('stalled', (jobId: string) => {
  logger.warn('Token encryption job stalled', { jobId });
});

worker.on('error', (err: Error) => {
  logger.error('Token encryption worker error', { error: err.message });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down token encryption worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down token encryption worker...');
  await worker.close();
  process.exit(0);
});

export default worker;
