import { Worker, Job } from 'bullmq';
import { runHealthProbe } from '../server/health-probes';
import { logger } from '@/lib/logger';

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return { url };
}

interface HealthProbeJobData {
  emailAccountId: string;
}

// Worker for health probe jobs
const worker = new Worker(
  'health-probe',
  async (job: Job<HealthProbeJobData>) => {
    const { emailAccountId } = job.data;
    await runHealthProbe(emailAccountId);
  },
  {
    connection: getConnection(),
    concurrency: 5, // Process up to 5 health probes simultaneously
  }
);

worker.on('ready', () => {
  logger.info('Health probe worker ready', {
    queueName: 'health-probe',
    worker: 'healthProbeWorker'
  });
});

worker.on('active', (job: Job) => {
  logger.info('Health probe job started', {
    jobId: job.id,
    emailAccountId: job.data.emailAccountId,
  });
});

worker.on('completed', (job: Job) => {
  logger.info('Health probe job completed', {
    jobId: job.id,
    emailAccountId: job.data.emailAccountId,
    duration: Date.now() - job.timestamp,
  });
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error('Health probe job failed', {
    jobId: job?.id,
    emailAccountId: job?.data?.emailAccountId,
    error: err.message,
    failedReason: job?.failedReason,
  });
});

worker.on('stalled', (jobId: string) => {
  logger.warn('Health probe job stalled', { jobId });
});

worker.on('error', (err: Error) => {
  logger.error('Health probe worker error', { error: err.message });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down health probe worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down health probe worker...');
  await worker.close();
  process.exit(0);
});

export default worker;