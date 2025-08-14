import { Worker, Job } from "bullmq";
import { prisma } from "../server/db";
import { decryptForOrg } from "../server/crypto";

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return { connection: { url } } as const;
}

async function processJob(job: Job) {
  const { orgId, emailAccountId } = job.data as { orgId: string; emailAccountId: string };
  console.log("[worker] email:sync", { orgId, emailAccountId });
  // TODO: Implement Gmail/Graph incremental sync; placeholder respects FLE contract
  // Example of decrypting a field when necessary:
  // const messages = await prisma.emailMessage.findMany({ where: { orgId }, take: 1 });
  // if (messages[0]?.subjectEnc) {
  //   const subject = await decryptForOrg(orgId, messages[0].subjectEnc, 'email:subject');
  //   console.log('decrypted subject len', subject.length);
  // }
}

export function startEmailSyncWorker() {
  const worker = new Worker("email:sync", processJob, getConnection());
  worker.on("failed", (job, err) => console.error("[worker] failed", job?.id, err));
  worker.on("completed", (job) => console.log("[worker] done", job.id));
  return worker;
}
