/**
 * Encrypt / decrypt service-account JSON at rest (AES-256-GCM).
 * Key from CREDENTIALS_ENCRYPTION_KEY (preferred) or JWT_SECRET fallback.
 * Never log plaintext private_key.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getKey(): Buffer {
  const raw =
    process.env.CREDENTIALS_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "dev-only-insecure-credentials-key";
  return createHash("sha256").update(raw).digest();
}

/** Returns base64(iv:authTag:ciphertext) */
export function encryptCredentials(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptCredentials(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  if (buf.length < 28) throw new Error("Invalid encrypted payload");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
