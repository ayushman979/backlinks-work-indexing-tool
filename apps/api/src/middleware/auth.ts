import { createMiddleware } from "hono/factory";
import { verifyToken, type JwtPayload } from "../lib/auth.js";

export type AuthVariables = {
  user: JwtPayload;
};

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const header = c.req.header("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) {
      return c.json({ error: "Unauthorized — Bearer token required" }, 401);
    }
    try {
      const user = await verifyToken(match[1]!);
      c.set("user", user);
      await next();
    } catch {
      return c.json({ error: "Unauthorized — invalid or expired token" }, 401);
    }
  },
);
