import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@bw/db";
import {
  hashPassword,
  verifyPassword,
  signToken,
  slugify,
  type JwtPayload,
} from "../lib/auth.js";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";

export const authRoutes = new Hono<{ Variables: AuthVariables }>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  agencyName: z.string().min(1).max(120),
  name: z.string().optional(),
});

authRoutes.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }

  const { email, password, agencyName, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const defaultCredits = Number(process.env.CREDITS_DEFAULT_BALANCE ?? 1000);
  let slug = slugify(agencyName);
  const slugTaken = await prisma.agency.findUnique({ where: { slug } });
  if (slugTaken) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const agency = await tx.agency.create({
      data: { name: agencyName, slug },
    });
    const user = await tx.user.create({
      data: {
        agencyId: agency.id,
        email,
        name: name ?? null,
        passwordHash,
        role: "owner",
      },
    });
    await tx.creditBalance.create({
      data: { agencyId: agency.id, balance: defaultCredits },
    });
    await tx.creditTxn.create({
      data: {
        agencyId: agency.id,
        type: "grant",
        amount: defaultCredits,
        balanceAfter: defaultCredits,
        reason: "Welcome grant on agency create",
      },
    });
    return { agency, user };
  });

  const token = await signToken({
    sub: result.user.id,
    email: result.user.email,
    agencyId: result.agency.id,
    role: result.user.role,
  });

  return c.json({
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    },
    agency: {
      id: result.agency.id,
      name: result.agency.name,
      slug: result.agency.slug,
    },
    creditsGranted: defaultCredits,
  });
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { agency: true },
  });
  if (!user?.passwordHash) {
    return c.json({ error: "Invalid email or password" }, 401);
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    agencyId: user.agencyId,
    role: user.role,
  });

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    agency: {
      id: user.agency.id,
      name: user.agency.name,
      slug: user.agency.slug,
    },
  });
});

authRoutes.get("/me", requireAuth, async (c) => {
  const auth = c.get("user") as JwtPayload;
  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    include: { agency: true },
  });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  const balance = await prisma.creditBalance.findUnique({
    where: { agencyId: user.agencyId },
  });
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    agency: {
      id: user.agency.id,
      name: user.agency.name,
      slug: user.agency.slug,
    },
    credits: balance?.balance ?? 0,
  });
});
