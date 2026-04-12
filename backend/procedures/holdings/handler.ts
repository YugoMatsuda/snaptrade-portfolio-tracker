import { os } from "@orpc/server";
import { GetHoldingsInput, GetHoldingsOutput } from "../../contract/holdings.ts";
import { fetchHoldings } from "../../lib/snaptrade.ts";
import { getUserSecret } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

type SnapTradeHoldingsResponse = {
  positions: {
    symbol: { symbol: { symbol: string | null; description: string | null } | null } | null;
    units: number | null;
    price: number | null;
    open_pnl: number | null;
    average_purchase_price: number | null;
    currency: { code: string } | null;
  }[];
  balances: {
    currency: { code: string } | null;
    cash: number | null;
    buying_power: number | null;
  }[];
  total_value: { value: number; currency: string } | null;
};

export const holdingsGetAll = os
  .$context<AuthContext>()
  .input(GetHoldingsInput)
  .output(GetHoldingsOutput)
  .handler(async ({ input, context }) => {
    const record = await getUserSecret(context.userId);
    if (!record) throw new Error("User secret not found");
    const { snaptrade_user_secret } = record;

    const data = await fetchHoldings<SnapTradeHoldingsResponse>(
      context.userId,
      snaptrade_user_secret,
      input.accountId,
    );

    return {
      positions: data.positions ?? [],
      balances: data.balances ?? [],
      total_value: data.total_value?.value ?? null,
      currency: data.total_value?.currency ?? null,
    };
  });
