import { z } from "zod";

// userId and userSecret are retrieved by the backend from the Supabase DB
// Only accountId is passed from iOS
export const GetHoldingsInput = z.object({
  accountId: z.string(),
});

// Schema aligned with the actual response structure of the SnapTrade API
// positions[].symbol.symbol.symbol is the ticker string
export const PositionSchema = z.object({
  symbol: z.object({
    symbol: z.object({
      symbol: z.string().nullable(),
      description: z.string().nullable(),
    }).nullable(),
  }).nullable(),
  units: z.number().nullable(),
  price: z.number().nullable(),
  open_pnl: z.number().nullable(),
  average_purchase_price: z.number().nullable(),
  currency: z.object({ code: z.string() }).nullable(),
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
  currency: z.string().nullable(),  // currency code for total_value
});
