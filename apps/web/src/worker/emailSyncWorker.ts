import { Worker, Job } from "bullmq";

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return { connection: { url } } as const;
}

async function processJob(job: Job) {
  const { orgId, emailAccountId } = job.data as { orgId: string; emailAccountId: string };
  console.log("[worker] email:sync", { orgId, emailAccountId });
}

export function startEmailSyncWorker() {
  const worker = new Worker("email:sync", processJob, getConnection());
  worker.on("failed", (job, err) => console.error("[worker] failed", job?.id, err));
  worker.on("completed", (job) => console.log("[worker] done", job.id));
  return worker;
}
