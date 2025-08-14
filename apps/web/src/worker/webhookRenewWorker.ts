import { Worker, Job } from 'bullmq';

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not set');
  return { connection: { url } } as const;
}

async function processJob(job: Job) {
  const { provider } = job.data as { provider: 'gmail' | 'microsoft' };
  console.log('[worker] webhooks:renew', { provider });
  // TODO: implement subscription renewal for Graph and Gmail watch management
}

export function startWebhookRenewWorker() {
  const worker = new Worker('webhooks:renew', processJob, getConnection());
  worker.on('failed', (job, err) => console.error('[worker] failed', job?.id, err));
  worker.on('completed', (job) => console.log('[worker] done', job.id));
  return worker;
}


