import { Hono } from "hono";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@bw/db";
import { parseServiceAccountJson } from "@bw/google";
import { encryptText } from "../lib/crypto.js";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";

/**
 * Service-account connect.
 * Stores encrypted credentialsEnc + optional file under data/service-accounts/
 * (gitignored). Never invent credentials. Never log private_key.
 *
 * ToS: connected SA must have GSC ownership for all submitted URLs.
 */
export const serviceAccountRoutes = new Hono<{ Variables: AuthVariables }>();

serviceAccountRoutes.use("*", requireAuth);

const connectSchema = z.object({
  credentialsJson: z.string().min(10),
  label: z.string().optional(),
});

serviceAccountRoutes.post("/", async (c) => {
  const auth = c.get("user");
  const body = await c.req.json().catch(() => null);
  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }

  let clientEmail: string;
  let projectId: string | undefined;
  let normalizedJson: string;
  try {
    const creds = parseServiceAccountJson(parsed.data.credentialsJson);
    clientEmail = creds.client_email;
    projectId = typeof creds.project_id === "string" ? creds.project_id : undefined;
    // Re-stringify parsed object so we store valid JSON only
    normalizedJson = JSON.stringify(creds);
  } catch (err) {
    return c.json(
      {
        error: "Invalid service-account JSON",
        message: err instanceof Error ? err.message : "parse failed",
      },
      400,
    );
  }

  const credentialsEnc = encryptText(normalizedJson);

  // Optional file-path MVP: write gitignored file for local GOOGLE_APPLICATION_CREDENTIALS-style use
  const storeDir = path.isAbsolute(process.env.SA_STORAGE_DIR ?? "")
    ? (process.env.SA_STORAGE_DIR as string)
    : path.resolve(
        process.cwd(),
        process.env.SA_STORAGE_DIR ?? "../../data/service-accounts",
      );
  await mkdir(storeDir, { recursive: true });
  const fileName = `${auth.agencyId}-${clientEmail.replace(/[^a-zA-Z0-9._-]/g, "_")}.json.enc`;
  const filePath = path.join(storeDir, fileName);
  await writeFile(filePath, credentialsEnc, { mode: 0o600 });

  const sa = await prisma.serviceAccount.upsert({
    where: {
      agencyId_clientEmail: {
        agencyId: auth.agencyId,
        clientEmail,
      },
    },
    create: {
      agencyId: auth.agencyId,
      clientEmail,
      projectId: projectId ?? null,
      credentialsEnc,
      label: parsed.data.label ?? null,
      isActive: true,
    },
    update: {
      projectId: projectId ?? null,
      credentialsEnc,
      label: parsed.data.label ?? undefined,
      isActive: true,
    },
  });

  // Deactivate other SAs for this agency (single active for MVP)
  await prisma.serviceAccount.updateMany({
    where: {
      agencyId: auth.agencyId,
      id: { not: sa.id },
    },
    data: { isActive: false },
  });

  return c.json({
    tosWarning:
      "Connected SA must verify ownership in Search Console for every submitted URL. Owner-only; no third-party spam. Connecting does not guarantee indexing.",
    serviceAccount: {
      id: sa.id,
      clientEmail: sa.clientEmail,
      projectId: sa.projectId,
      label: sa.label,
      isActive: sa.isActive,
      connectedAt: sa.connectedAt,
    },
    storedEncrypted: true,
    // Path is local-only hint; never return plaintext key
    storageHint: `Encrypted blob stored (file: ${fileName})`,
  });
});

serviceAccountRoutes.get("/", async (c) => {
  const auth = c.get("user");
  const accounts = await prisma.serviceAccount.findMany({
    where: { agencyId: auth.agencyId },
    orderBy: { connectedAt: "desc" },
    select: {
      id: true,
      clientEmail: true,
      projectId: true,
      label: true,
      isActive: true,
      connectedAt: true,
      updatedAt: true,
    },
  });
  return c.json({ accounts });
});
