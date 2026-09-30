import "./env.js";
/**
 * Worker — processes SubmitItem jobs from BullMQ.
 *
 * Loads agency ServiceAccount, decrypts credentials, calls @bw/google,
 * updates SubmitItem status. Credits already deducted on enqueue;
 * hard failures get a per-item refund.
 *
 * ToS: every URL must be owner-verified for the agency's SA.
 * Success ≠ guaranteed indexing.
 *
 * Run: pnpm --filter @bw/queue worker
 */
import { Worker, type Job } from "bullmq";
import {
  publishUrlNotification,
  decryptCredentials,
  parseServiceAccountJson,
  type ServiceAccountCredentials,
} from "@bw/google";
import { prisma } from "@bw/db";
import {
  SUBMIT_QUEUE_NAME,
  getRedisConnection,
  type SubmitItemJobPayload,
} from "./index.js";

const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 5);

async function loadAgencyCredentials(
  agencyId: string,
): Promise<ServiceAccountCredentials | null> {
  const sa = await prisma.serviceAccount.findFirst({
    where: { agencyId, isActive: true },
  });
  if (!sa?.credentialsEnc) {
    // Optional env file path fallback for local MVP
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyFile) {
      try {
        const { readFile } = await import("node:fs/promises");
        const raw = await readFile(keyFile, "utf8");
        return parseServiceAccountJson(raw);
      } catch {
        return null;
      }
    }
    return null;
  }
  try {
    const raw = decryptCredentials(sa.credentialsEnc);
    return parseServiceAccountJson(raw);
  } catch (err) {
    console.error(
      `[worker] failed to decrypt SA for agency=${agencyId}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

async function refundOneCredit(
  agencyId: string,
  jobId: string,
  itemId: string,
  cost: number,
): Promise<void> {
  if (cost <= 0) return;
  await prisma.$transaction(async (tx) => {
    const updated = await tx.creditBalance.update({
      where: { agencyId },
      data: { balance: { increment: cost } },
    });
    await tx.creditTxn.create({
      data: {
        agencyId,
        type: "refund",
        amount: cost,
        balanceAfter: updated.balance,
        reason: `Refund item ${itemId} hard fail`,
        refJobId: jobId,
      },
    });
  });
}

async function refreshJobCounts(jobId: string): Promise<void> {
  const [successCount, errorCount, queuedCount, total] = await Promise.all([
    prisma.submitItem.count({ where: { jobId, status: "submitted" } }),
    prisma.submitItem.count({ where: { jobId, status: "error" } }),
    prisma.submitItem.count({ where: { jobId, status: "queued" } }),
    prisma.submitItem.count({ where: { jobId } }),
  ]);

  const done = successCount + errorCount;
  let status = "processing";
  let completedAt: Date | null = null;
  if (queuedCount === 0 && done >= total) {
    status = errorCount === total ? "failed" : "completed";
    completedAt = new Date();
  }

  await prisma.submitJob.update({
    where: { id: jobId },
    data: { successCount, errorCount, status, completedAt },
  });
}

async function processSubmitItem(
  job: Job<SubmitItemJobPayload>,
): Promise<{ ok: boolean; stub: boolean; gscResponse?: string }> {
  const { itemId, jobId, agencyId, url, type } = job.data;
  console.log(
    `[worker] processing item=${itemId} type=${type} url=${url}`,
  );

  const cost =
    type === "backlink"
      ? Number(process.env.CREDITS_COST_PER_BACKLINK ?? 1)
      : Number(process.env.CREDITS_COST_PER_URL ?? 1);

  await prisma.submitItem.update({
    where: { id: itemId },
    data: { attempts: { increment: 1 } },
  });

  const credentials = await loadAgencyCredentials(agencyId);
  const result = await publishUrlNotification(credentials, url, "URL_UPDATED");

  if (result.ok) {
    await prisma.submitItem.update({
      where: { id: itemId },
      data: {
        status: "submitted",
        gscResponse: result.gscResponse ?? null,
        errorMessage: result.stub
          ? "Submitted via stub (GOOGLE_INDEXING_STUB or simulated)"
          : null,
        submittedAt: new Date(),
      },
    });
  } else {
    await prisma.submitItem.update({
      where: { id: itemId },
      data: {
        status: "error",
        gscResponse: result.gscResponse ?? null,
        errorMessage: result.errorMessage ?? "Unknown error",
      },
    });
    // Refund on hard fail (no successful notification)
    try {
      await refundOneCredit(agencyId, jobId, itemId, cost);
    } catch (err) {
      console.error(
        `[worker] refund failed item=${itemId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  await refreshJobCounts(jobId);

  console.log(
    `[worker] item=${itemId} ok=${result.ok} stub=${result.stub ?? false} err=${result.errorMessage ?? ""}`,
  );
  console.log(
    "[worker] note: API acceptance ≠ guaranteed indexing (Google ToS).",
  );

  return {
    ok: result.ok,
    stub: result.stub ?? false,
    gscResponse: result.gscResponse,
  };
}

console.log(
  `[worker] starting SubmitItem worker concurrency=${concurrency} queue=${SUBMIT_QUEUE_NAME}`,
);
console.log(
  "[worker] ToS reminder: owner-only URLs; no third-party spam via Indexing API. No indexing guarantee.",
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
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
