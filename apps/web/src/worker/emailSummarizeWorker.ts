import { Worker, Job } from 'bullmq';
import { summarizeThread } from '@/server/ai';

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not set');
  return { connection: { url } } as const;
}

async function processJob(job: Job) {
  const { orgId, threadId, mode } = job.data as { orgId: string; threadId: string; mode?: 'short'|'medium'|'detailed' };
  // Map 'medium' to 'detailed' since summarizeThread only accepts 'short' or 'detailed'
  const summarizeMode = mode === 'medium' ? 'detailed' : (mode ?? 'short');
  await summarizeThread(orgId, threadId, summarizeMode);
}

export function startEmailSummarizeWorker() {
  const worker = new Worker('email:summarize', processJob, getConnection());
  worker.on('failed', (job, err) => console.error('[worker] failed', job?.id, err));
  worker.on('completed', (job) => console.log('[worker] done', job.id));
  return worker;
}


