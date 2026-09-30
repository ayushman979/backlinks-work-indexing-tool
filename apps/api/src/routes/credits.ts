import { Hono } from "hono";

/**
 * Credits stubs — agency prepaid balance.
 */
export const creditsRoutes = new Hono();

creditsRoutes.get("/", (c) => {
  const defaultBalance = Number(process.env.CREDITS_DEFAULT_BALANCE ?? 1000);
  return c.json({
    stub: true,
    balance: defaultBalance,
    costPerUrl: Number(process.env.CREDITS_COST_PER_URL ?? 1),
    costPerBacklink: Number(process.env.CREDITS_COST_PER_BACKLINK ?? 1),
    message: "Credits stub — read CreditBalance from DB in a later week",
  });
});

creditsRoutes.get("/txns", (c) => {
  return c.json({
    stub: true,
    txns: [],
    message: "CreditTxn list stub",
  });
});
