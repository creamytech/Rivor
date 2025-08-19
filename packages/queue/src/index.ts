import { Queue } from 'bullmq';

export function createQueue(name: string, redisUrl: string) {
  return new Queue(name, { connection: { url: redisUrl } });
}
