import { Hono } from "hono";
import { z } from "zod";

/**
 * Auth stubs — week-1 placeholders.
 * Later: JWT sessions, password hashing, agency provisioning.
 */
export const authRoutes = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  agencyName: z.string().min(1),
  name: z.string().optional(),
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }

  // STUB: no real auth yet
  return c.json({
    stub: true,
    message: "Login stub — wire JWT + User lookup in a later week",
    token: "stub-jwt-token",
    user: {
      email: parsed.data.email,
      role: "owner",
    },
  });
});

authRoutes.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
  }

  const defaultCredits = Number(process.env.CREDITS_DEFAULT_BALANCE ?? 1000);

  return c.json({
    stub: true,
    message: "Register stub — creates Agency + User + CreditBalance later",
    agency: { name: parsed.data.agencyName },
    user: { email: parsed.data.email, name: parsed.data.name ?? null },
    creditsGranted: defaultCredits,
  });
});

authRoutes.get("/me", (c) => {
  return c.json({
    stub: true,
    message: "Auth /me stub — requires JWT middleware",
    user: null,
  });
});
