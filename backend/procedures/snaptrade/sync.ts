import { os } from "@orpc/server";
import { SyncInput, SyncOutput } from "../../contract/sync.ts";
import { fetchAccounts, fetchHoldings, fetchActivities } from "../../lib/snaptrade.ts";
import { getUserSecret, upsertAccounts, replacePositions, replaceBalances, upsertTransactions } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

type SnapTradeAccount = {
  id: string;
  brokerage_authorization: string | null;
  name: string | null;
  number: string | null;
  institution_name: string | null;
};

type SnapTradeHoldings = {
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
};

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

export const snaptradeSync = os
  .$context<AuthContext>()
  .input(SyncInput)
  .output(SyncOutput)
  .handler(async ({ context }) => {
    const { userId } = context;
    const record = await getUserSecret(userId);
    if (!record) throw new Error("User secret not found");
    const { snaptrade_user_secret } = record;

    // 1. 口座一覧を取得してキャッシュ
    const accounts = await fetchAccounts<SnapTradeAccount[]>(userId, snaptrade_user_secret);
    await upsertAccounts(accounts.map((a) => ({
      id: a.id,
      user_id: userId,
      brokerage_authorization: a.brokerage_authorization ?? null,
      name: a.name ?? null,
      number: a.number ?? null,
      institution_name: a.institution_name ?? null,
    })));

    // 2. 各口座の holdings + transactions を並行取得してキャッシュ
    await Promise.all(accounts.map(async (account) => {
      const [holdings, activitiesRes] = await Promise.all([
        fetchHoldings<SnapTradeHoldings>(userId, snaptrade_user_secret, account.id),
        fetchActivities<SnapTradeActivitiesResponse>(userId, snaptrade_user_secret, account.id),
      ]);

      // positions
      const positions = holdings.positions
        .filter((p) => p.symbol?.symbol?.symbol != null)
        .map((p) => ({
          account_id: account.id,
          user_id: userId,
          ticker: p.symbol!.symbol!.symbol!,
          name: p.symbol?.symbol?.description ?? null,
          units: p.units ?? null,
          price: p.price ?? null,
          open_pnl: p.open_pnl ?? null,
          average_purchase_price: p.average_purchase_price ?? null,
          currency: p.currency?.code ?? null,
        }));
      await replacePositions(account.id, positions);

      // balances
      const balances = holdings.balances
        .filter((b) => b.currency?.code != null)
        .map((b) => ({
          account_id: account.id,
          user_id: userId,
          currency: b.currency!.code,
          cash: b.cash ?? null,
          buying_power: b.buying_power ?? null,
        }));
      await replaceBalances(account.id, balances);

      // transactions
      const transactions = activitiesRes.data.map((a) => ({
        id: a.id,
        account_id: account.id,
        user_id: userId,
        type: a.type ?? null,
        description: a.description ?? null,
        amount: a.amount ?? null,
        currency: a.currency?.code ?? null,
        trade_date: a.trade_date ?? null,
        ticker: a.symbol?.raw_symbol ?? null,
        units: a.units ?? null,
        price: a.price ?? null,
        fee: a.fee ?? null,
      }));
      await upsertTransactions(transactions);
    }));

    return { syncedAccounts: accounts.length };
  });
