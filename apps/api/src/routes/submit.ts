import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@bw/db";
import { enqueueSubmitItem } from "@bw/queue";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";

/**
 * Bulk submit — persists SubmitJob + SubmitItems, deducts credits, enqueues.
 *
 * ToS: every URL must be owner-verified for the agency's Google SA.
 * Do not accept third-party spam submissions.
 * Submission ≠ guaranteed indexing.
 */
export const submitRoutes = new Hono<{ Variables: AuthVariables }>();

submitRoutes.use("*", requireAuth);

const itemSchema = z.object({
  url: z.string().url(),
  type: z.enum(["url", "backlink"]).default("url"),
});

const bulkSchema = z.object({
  items: z.array(itemSchema).min(1).max(5000),
});

submitRoutes.post("/", async (c) => {
  const auth = c.get("user");
  const body = await c.req.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }

  const costPerUrl = Number(process.env.CREDITS_COST_PER_URL ?? 1);
  const costPerBacklink = Number(process.env.CREDITS_COST_PER_BACKLINK ?? 1);
  const estimatedCost = parsed.data.items.reduce(
    (sum, item) =>
      sum + (item.type === "backlink" ? costPerBacklink : costPerUrl),
    0,
  );

  const sa = await prisma.serviceAccount.findFirst({
    where: { agencyId: auth.agencyId, isActive: true },
  });
  if (!sa) {
    return c.json(
      {
        error: "No active service account",
        message: "Connect a Google service account before submitting URLs.",
        tosWarning:
          "Google Indexing API: submit only owner-verified URLs. No third-party spam.",
      },
      400,
    );
  }

  let jobId: string;
  let itemIds: Array<{ id: string; url: string; type: "url" | "backlink" }>;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const balance = await tx.creditBalance.findUnique({
        where: { agencyId: auth.agencyId },
      });
      if (!balance || balance.balance < estimatedCost) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      const job = await tx.submitJob.create({
        data: {
          agencyId: auth.agencyId,
          userId: auth.sub,
          status: "queued",
          itemCount: parsed.data.items.length,
        },
      });

      const items = await Promise.all(
        parsed.data.items.map((item) =>
          tx.submitItem.create({
            data: {
              jobId: job.id,
              url: item.url,
              type: item.type,
              status: "queued",
            },
            select: { id: true, url: true, type: true },
          }),
        ),
      );

      const updated = await tx.creditBalance.update({
        where: { agencyId: auth.agencyId },
        data: { balance: { decrement: estimatedCost } },
      });

      await tx.creditTxn.create({
        data: {
          agencyId: auth.agencyId,
          type: "debit",
          amount: -estimatedCost,
          balanceAfter: updated.balance,
          reason: `Bulk submit ${parsed.data.items.length} item(s)`,
          refJobId: job.id,
        },
      });

      return { job, items };
    });

    jobId = created.job.id;
    itemIds = created.items.map((i) => ({
      id: i.id,
      url: i.url,
      type: i.type as "url" | "backlink",
    }));
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_CREDITS") {
      return c.json(
        {
          error: "Insufficient credits",
          estimatedCreditCost: estimatedCost,
        },
        402,
      );
    }
    throw err;
  }

  // Enqueue outside transaction (Redis may be briefly unavailable)
  const enqueueErrors: string[] = [];
  for (const item of itemIds) {
    try {
      await enqueueSubmitItem({
        itemId: item.id,
        jobId,
        agencyId: auth.agencyId,
        url: item.url,
        type: item.type,
      });
    } catch (err) {
      enqueueErrors.push(
        `${item.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (enqueueErrors.length > 0) {
    await prisma.submitJob.update({
      where: { id: jobId },
      data: { status: "processing" },
    });
  } else {
    await prisma.submitJob.update({
      where: { id: jobId },
      data: { status: "processing" },
    });
  }

  return c.json({
    tosWarning:
      "Google Indexing API: submit only owner-verified URLs. No third-party spam. Submission does not guarantee indexing.",
    jobId,
    itemCount: itemIds.length,
    estimatedCreditCost: estimatedCost,
    status: "processing",
    enqueueErrors: enqueueErrors.length ? enqueueErrors : undefined,
  });
});
