/**
 * @bw/queue — BullMQ queue helpers for SubmitItem processing
 */
import { Queue, type ConnectionOptions } from "bullmq";
import { Redis } from "ioredis";

export const SUBMIT_QUEUE_NAME = "submit-items";

export interface SubmitItemJobPayload {
  itemId: string;
  jobId: string;
  agencyId: string;
  url: string;
  type: "url" | "backlink";
}

export function getRedisConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return { url } as ConnectionOptions;
}

export function createRedisClient(): Redis {
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
}

let submitQueue: Queue<SubmitItemJobPayload> | null = null;

export function getSubmitQueue(): Queue<SubmitItemJobPayload> {
  if (!submitQueue) {
    submitQueue = new Queue<SubmitItemJobPayload>(SUBMIT_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return submitQueue;
}

export async function enqueueSubmitItem(
  payload: SubmitItemJobPayload,
): Promise<string> {
  const queue = getSubmitQueue();
  const job = await queue.add("process-submit-item", payload, {
    jobId: `item-${payload.itemId}`,
  });
  return job.id ?? payload.itemId;
}
