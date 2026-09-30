import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth.js";
import { creditsRoutes } from "./routes/credits.js";
import { submitRoutes } from "./routes/submit.js";
import { jobsRoutes } from "./routes/jobs.js";
import { serviceAccountRoutes } from "./routes/service-account.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.WEB_BASE_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "bw-indexing-api",
    tos:
      "Google Indexing API: owner-only URLs; no third-party spam. See README.",
  }),
);

app.route("/auth", authRoutes);
app.route("/credits", creditsRoutes);
app.route("/submit", submitRoutes);
app.route("/jobs", jobsRoutes);
app.route("/service-account", serviceAccountRoutes);

const port = Number(process.env.API_PORT ?? 3001);

console.log(`[@bw/api] listening on http://localhost:${port}`);
console.log(
  "[@bw/api] ToS: Indexing API is for owner-verified URLs only — no third-party spam.",
);

serve({ fetch: app.fetch, port });

export default app;
