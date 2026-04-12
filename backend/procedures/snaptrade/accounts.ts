import { os } from "@orpc/server";
import { GetAccountsInput, GetAccountsOutput } from "../../contract/snaptrade.ts";
import { fetchAccounts } from "../../lib/snaptrade.ts";
import { getUserSecret } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

type SnapTradeAccount = {
  id: string;
  brokerage_authorization: string | null;
  name: string | null;
  number: string | null;
  institution_name: string | null;
};

export const snaptradeAccounts = os
  .$context<AuthContext>()
  .input(GetAccountsInput)
  .output(GetAccountsOutput)
  .handler(async ({ context }) => {
    const { userId } = context;
    const record = await getUserSecret(userId);
    if (!record) throw new Error("User secret not found");
    const { snaptrade_user_secret } = record;

    const data = await fetchAccounts<SnapTradeAccount[]>(userId, snaptrade_user_secret);

    return {
      accounts: data.map((a) => ({
        id: a.id,
        brokerage_authorization: a.brokerage_authorization ?? null,
        name: a.name ?? null,
        number: a.number ?? null,
        institution_name: a.institution_name ?? null,
      })),
    };
  });
