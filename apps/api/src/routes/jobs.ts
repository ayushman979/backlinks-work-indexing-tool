import { Hono } from "hono";
import { prisma } from "@bw/db";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";

export const jobsRoutes = new Hono<{ Variables: AuthVariables }>();

jobsRoutes.use("*", requireAuth);

jobsRoutes.get("/", async (c) => {
  const auth = c.get("user");
  const jobs = await prisma.submitJob.findMany({
    where: { agencyId: auth.agencyId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      itemCount: true,
      successCount: true,
      errorCount: true,
      createdAt: true,
      completedAt: true,
    },
  });
  return c.json({ jobs });
});

jobsRoutes.get("/:id", async (c) => {
  const auth = c.get("user");
  const id = c.req.param("id");
  const job = await prisma.submitJob.findFirst({
    where: { id, agencyId: auth.agencyId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          url: true,
          type: true,
          status: true,
          errorMessage: true,
          gscResponse: true,
          attempts: true,
          submittedAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }
  return c.json({
    id: job.id,
    status: job.status,
    itemCount: job.itemCount,
    successCount: job.successCount,
    errorCount: job.errorCount,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    items: job.items,
    note:
      "Status reflects API notification attempts only — Google does not guarantee indexing.",
  });
});
