import { z } from "zod";

export const PositionSchema = z.object({
  symbol: z.object({
    ticker: z.string().nullable(),
    name: z.string().nullable(),
  }).nullable(),
  units: z.number().nullable(),
  price: z.number().nullable(),
  open_pnl: z.number().nullable(),
  average_purchase_price: z.number().nullable(),
});

export const BalanceSchema = z.object({
  currency: z.object({ code: z.string() }).nullable(),
  cash: z.number().nullable(),
  buying_power: z.number().nullable(),
});

export const GetHoldingsOutput = z.object({
  positions: z.array(PositionSchema),
  balances: z.array(BalanceSchema),
  total_value: z.number().nullable(),
  currency: z.string().nullable(),
});
