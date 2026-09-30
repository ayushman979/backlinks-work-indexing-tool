import { Hono } from "hono";
import { z } from "zod";

/**
 * Bulk submit stub.
 *
 * ToS: every URL must be owner-verified for the agency's Google SA.
 * Do not accept third-party spam submissions.
 */
export const submitRoutes = new Hono();

const itemSchema = z.object({
  url: z.string().url(),
  type: z.enum(["url", "backlink"]).default("url"),
});

const bulkSchema = z.object({
  items: z.array(itemSchema).min(1).max(5000),
});

submitRoutes.post("/", async (c) => {
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

  const jobId = `stub-job-${Date.now()}`;

  return c.json({
    stub: true,
    tosWarning:
      "Google Indexing API: submit only owner-verified URLs. No third-party spam.",
    jobId,
    itemCount: parsed.data.items.length,
    estimatedCreditCost: estimatedCost,
    status: "queued",
    message:
      "Submit stub — persist SubmitJob/SubmitItem + enqueue BullMQ in a later week",
  });
});
