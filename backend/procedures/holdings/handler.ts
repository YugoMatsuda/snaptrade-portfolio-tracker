import { os } from "@orpc/server";
import { GetHoldingsInput, GetHoldingsOutput } from "../../contract/holdings.ts";
import { getUserSecret, getPositions, getBalances } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

export const holdingsGetAll = os
  .$context<AuthContext>()
  .input(GetHoldingsInput)
  .output(GetHoldingsOutput)
  .handler(async ({ input, context }) => {
    const record = await getUserSecret(context.userId);
    if (!record) throw new Error("User secret not found");

    const [positions, balances] = await Promise.all([
      getPositions(context.userId, input.accountId),
      getBalances(context.userId, input.accountId),
    ]);

    const totalValue = balances.reduce((sum, b) => sum + (b.cash ?? 0), 0);
    const currency = balances[0]?.currency ?? null;

    return {
      positions: positions.map((p) => ({
        symbol: {
          symbol: {
            symbol: p.ticker,
            description: p.name ?? null,
          },
        },
        units: p.units ?? null,
        price: p.price ?? null,
        open_pnl: p.open_pnl ?? null,
        average_purchase_price: p.average_purchase_price ?? null,
        currency: p.currency ? { code: p.currency } : null,
      })),
      balances: balances.map((b) => ({
        currency: { code: b.currency },
        cash: b.cash ?? null,
        buying_power: b.buying_power ?? null,
      })),
      total_value: totalValue,
      currency,
    };
  });
