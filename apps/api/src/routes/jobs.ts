import { Hono } from "hono";

/**
 * Job status stubs.
 */
export const jobsRoutes = new Hono();

jobsRoutes.get("/:id", (c) => {
  const id = c.req.param("id");
  return c.json({
    stub: true,
    id,
    status: "queued",
    itemCount: 0,
    successCount: 0,
    errorCount: 0,
    items: [],
    message: "Job status stub — load SubmitJob + SubmitItems from DB later",
  });
});

jobsRoutes.get("/", (c) => {
  return c.json({
    stub: true,
    jobs: [],
    message: "Job list stub",
  });
});
