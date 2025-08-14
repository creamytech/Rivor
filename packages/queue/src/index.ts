import { Queue } from 'bullmq';\n\nexport function createQueue(name: string, redisUrl: string) {\n  return new Queue(name, { connection: { url: redisUrl } });\n}\n
