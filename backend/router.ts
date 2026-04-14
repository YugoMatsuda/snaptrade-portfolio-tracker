import { os } from "@orpc/server";
import { holdingsGetAll } from "./procedures/holdings/handler.ts";
import { snaptradeConnect } from "./procedures/snaptrade/connect.ts";
import { snaptradeAccounts } from "./procedures/snaptrade/accounts.ts";
import { snaptradeSync } from "./procedures/snaptrade/sync.ts";
import { snaptradeDeleteConnection } from "./procedures/snaptrade/deleteConnection.ts";
import { snaptradeDeleteUser } from "./procedures/snaptrade/deleteUser.ts";
import { snaptradeReconnect } from "./procedures/snaptrade/reconnect.ts";
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
    sync: snaptradeSync,
    deleteConnection: snaptradeDeleteConnection,
    deleteSnapTradeUser: snaptradeDeleteUser,
    reconnect: snaptradeReconnect,
  }),
  transactions: authOs.router({
    getAll: transactionsGetAll,
  }),
});
