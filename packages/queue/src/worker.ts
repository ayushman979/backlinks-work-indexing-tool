/**
 * Worker stub — processes SubmitItem jobs from BullMQ.
 *
 * ToS: every URL passed to @bw/google must be owner-verified for the
 * agency's connected service account. This stub does not call Google.
 *
 * Run: pnpm --filter @bw/queue worker
 */
import { Worker, type Job } from "bullmq";
import { publishUrlNotification } from "@bw/google";
import {
  SUBMIT_QUEUE_NAME,
  getRedisConnection,
  type SubmitItemJobPayload,
} from "./index.js";

const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 5);

async function processSubmitItem(
  job: Job<SubmitItemJobPayload>,
): Promise<{ ok: boolean; stub: boolean; gscResponse?: string }> {
  const { itemId, url, type } = job.data;
  console.log(
    `[worker] processing item=${itemId} type=${type} url=${url} (stub)`,
  );

  // STUB: no DB update, no real SA credentials loaded.
  // Later weeks: load ServiceAccount for agencyId, decrypt credentials,
  // call publishUrlNotification, persist gscResponse + status on SubmitItem.
  const result = await publishUrlNotification(null, url, "URL_UPDATED");

  console.log(
    `[worker] item=${itemId} ok=${result.ok} stub=${result.stub ?? false} err=${result.errorMessage ?? ""}`,
  );

  return {
    ok: result.ok,
    stub: result.stub ?? true,
    gscResponse: result.gscResponse,
  };
}

console.log(
  `[worker] starting SubmitItem worker concurrency=${concurrency} queue=${SUBMIT_QUEUE_NAME}`,
);
console.log(
  "[worker] ToS reminder: owner-only URLs; no third-party spam via Indexing API.",
);

const worker = new Worker<SubmitItemJobPayload>(
  SUBMIT_QUEUE_NAME,
  processSubmitItem,
  {
    connection: getRedisConnection(),
    concurrency,
  },
);

worker.on("completed", (job) => {
  console.log(`[worker] completed job=${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] failed job=${job?.id}:`, err.message);
});

worker.on("error", (err) => {
  console.error("[worker] error:", err.message);
});

async function shutdown() {
  console.log("[worker] shutting down…");
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
