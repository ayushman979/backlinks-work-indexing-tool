/**
 * @bw/db — Prisma client + shared domain types
 */
import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Shared domain enums / shapes for API & web (mirror Prisma) */
export type SubmitItemTypeValue = "url" | "backlink";
export type SubmitItemStatusValue = "queued" | "submitted" | "error";
export type CreditTxnTypeValue = "grant" | "debit" | "refund" | "adjustment";

export interface BulkSubmitInput {
  urls: Array<{ url: string; type?: SubmitItemTypeValue }>;
}

export interface JobStatusView {
  id: string;
  status: string;
  itemCount: number;
  successCount: number;
  errorCount: number;
  items: Array<{
    id: string;
    url: string;
    type: SubmitItemTypeValue;
    status: SubmitItemStatusValue;
    errorMessage?: string | null;
  }>;
}
