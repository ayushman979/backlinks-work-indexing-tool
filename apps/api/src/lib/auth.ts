import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

export interface JwtPayload {
  sub: string;
  email: string;
  agencyId: string;
  role: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "change-me-to-a-long-random-string";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: JwtPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  return new SignJWT({
    email: payload.email,
    agencyId: payload.agencyId,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  const sub = payload.sub;
  const email = payload.email;
  const agencyId = payload.agencyId;
  const role = payload.role;
  if (
    typeof sub !== "string" ||
    typeof email !== "string" ||
    typeof agencyId !== "string" ||
    typeof role !== "string"
  ) {
    throw new Error("Invalid token payload");
  }
  return { sub, email, agencyId, role };
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "agency";
}
