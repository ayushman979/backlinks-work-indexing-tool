import { Hono } from "hono";
import { z } from "zod";
import { parseServiceAccountJson } from "@bw/google";

/**
 * Service-account connect stub.
 * Accepts SA JSON metadata only — does NOT invent credentials.
 *
 * ToS: connected SA must have GSC ownership for all submitted URLs.
 */
export const serviceAccountRoutes = new Hono();

const connectSchema = z.object({
  /** Raw service-account JSON string (client uploads) */
  credentialsJson: z.string().min(10),
  label: z.string().optional(),
});

serviceAccountRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }

  let clientEmail: string;
  let projectId: string | undefined;
  try {
    const creds = parseServiceAccountJson(parsed.data.credentialsJson);
    clientEmail = creds.client_email;
    projectId = typeof creds.project_id === "string" ? creds.project_id : undefined;
  } catch (err) {
    return c.json(
      {
        error: "Invalid service-account JSON",
        message: err instanceof Error ? err.message : "parse failed",
      },
      400,
    );
  }

  return c.json({
    stub: true,
    tosWarning:
      "Connected SA must verify ownership in Search Console for every submitted URL. Owner-only; no third-party spam.",
    serviceAccount: {
      clientEmail,
      projectId: projectId ?? null,
      label: parsed.data.label ?? null,
      isActive: true,
    },
    message:
      "SA connect stub — encrypt + store credentialsEnc on ServiceAccount later. Never log private_key.",
  });
});

serviceAccountRoutes.get("/", (c) => {
  return c.json({
    stub: true,
    accounts: [],
    message: "List connected SAs stub",
  });
});
