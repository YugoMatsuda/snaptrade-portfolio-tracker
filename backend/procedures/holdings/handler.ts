import { os } from "@orpc/server";
import { GetHoldingsInput, GetHoldingsOutput } from "../../contract/holdings.ts";
import { fetchHoldings } from "../../lib/snaptrade.ts";

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
  .input(GetHoldingsInput)
  .output(GetHoldingsOutput)
  .handler(async ({ input }) => {
    const data = await fetchHoldings(
      input.userId,
      input.userSecret,
      input.accountId,
    ) as SnapTradeHoldingsResponse;

    return {
      positions: data.positions ?? [],
      balances: data.balances ?? [],
      total_value: data.total_value?.value ?? null,
      currency: data.total_value?.currency ?? null,
    };
  });
