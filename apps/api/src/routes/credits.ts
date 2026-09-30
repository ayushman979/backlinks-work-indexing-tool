import { Hono } from "hono";
import { prisma } from "@bw/db";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";

export const creditsRoutes = new Hono<{ Variables: AuthVariables }>();

creditsRoutes.use("*", requireAuth);

creditsRoutes.get("/", async (c) => {
  const auth = c.get("user");
  const balance = await prisma.creditBalance.findUnique({
    where: { agencyId: auth.agencyId },
  });
  return c.json({
    balance: balance?.balance ?? 0,
    costPerUrl: Number(process.env.CREDITS_COST_PER_URL ?? 1),
    costPerBacklink: Number(process.env.CREDITS_COST_PER_BACKLINK ?? 1),
  });
});

creditsRoutes.get("/txns", async (c) => {
  const auth = c.get("user");
  const txns = await prisma.creditTxn.findMany({
    where: { agencyId: auth.agencyId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return c.json({ txns });
});
