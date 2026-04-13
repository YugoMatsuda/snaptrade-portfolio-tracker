import { os } from "@orpc/server";
import { GetTransactionsInput, GetTransactionsOutput } from "../../contract/transactions.ts";
import { getUserSecret, getTransactions } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

export const transactionsGetAll = os
  .$context<AuthContext>()
  .input(GetTransactionsInput)
  .output(GetTransactionsOutput)
  .handler(async ({ input, context }) => {
    const record = await getUserSecret(context.userId);
    if (!record) throw new Error("User secret not found");

    const transactions = await getTransactions(context.userId, input.accountId);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type ?? null,
        description: t.description ?? null,
        amount: t.amount ?? null,
        currency: t.currency ?? null,
        trade_date: t.trade_date ?? null,
        ticker: t.ticker ?? null,
        units: t.units ?? null,
        price: t.price ?? null,
        fee: t.fee ?? null,
      })),
    };
  });
