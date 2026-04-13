import { os } from "@orpc/server";
import { holdingsGetAll } from "./procedures/holdings/handler.ts";
import { snaptradeConnect } from "./procedures/snaptrade/connect.ts";
import { snaptradeAccounts } from "./procedures/snaptrade/accounts.ts";
import { transactionsGetAll } from "./procedures/transactions/handler.ts";
import type { AuthContext } from "./middleware/auth.ts";

const authOs = os.$context<AuthContext>();

export const router = authOs.router({
  holdings: authOs.router({
    getAll: holdingsGetAll,
  }),
  snaptrade: authOs.router({
    connect: snaptradeConnect,
    accounts: snaptradeAccounts,
  }),
  transactions: authOs.router({
    getAll: transactionsGetAll,
  }),
});
