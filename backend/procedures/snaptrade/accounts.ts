import { os } from "@orpc/server";
import { GetAccountsInput, GetAccountsOutput } from "../../contract/snaptrade.ts";
import { getUserSecret, getAccounts } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

export const snaptradeAccounts = os
  .$context<AuthContext>()
  .input(GetAccountsInput)
  .output(GetAccountsOutput)
  .handler(async ({ context }) => {
    const { userId } = context;
    const record = await getUserSecret(userId);
    if (!record) throw new Error("User secret not found");

    const accounts = await getAccounts(userId);

    return {
      accounts: accounts.map((a) => ({
        id: a.id,
        brokerage_authorization: a.brokerage_authorization ?? null,
        name: a.name ?? null,
        number: a.number ?? null,
        institution_name: a.institution_name ?? null,
      })),
    };
  });
