import { os } from "@orpc/server";
import { GetTransactionsInput, GetTransactionsOutput } from "../../contract/transactions.ts";
import { fetchActivities } from "../../lib/snaptrade.ts";
import { getUserSecret } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

type SnapTradeActivity = {
  id: string;
  type: string | null;
  description: string | null;
  amount: number | null;
  currency: { code: string } | null;
  trade_date: string | null;
  symbol: { symbol: string | null; raw_symbol: string | null } | null;
  units: number | null;
  price: number | null;
  fee: number | null;
};

type SnapTradeActivitiesResponse = {
  data: SnapTradeActivity[];
  pagination: { offset: number; limit: number; total: number };
};

export const transactionsGetAll = os
  .$context<AuthContext>()
  .input(GetTransactionsInput)
  .output(GetTransactionsOutput)
  .handler(async ({ input, context }) => {
    const record = await getUserSecret(context.userId);
    if (!record) throw new Error("User secret not found");
    const { snaptrade_user_secret } = record;

    const response = await fetchActivities<SnapTradeActivitiesResponse>(
      context.userId,
      snaptrade_user_secret,
      input.accountId,
    );

    return {
      transactions: response.data.map((a) => ({
        id: a.id,
        type: a.type ?? null,
        description: a.description ?? null,
        amount: a.amount ?? null,
        currency: a.currency?.code ?? null,
        trade_date: a.trade_date ?? null,
        ticker: a.symbol?.raw_symbol ?? null,
        units: a.units ?? null,
        price: a.price ?? null,
        fee: a.fee ?? null,
      })),
    };
  });
