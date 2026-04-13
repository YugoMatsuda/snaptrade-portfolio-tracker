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

    const grouped = new Map<string, typeof accounts>();
    for (const a of accounts) {
      const authId = a.brokerage_authorization ?? "unknown";
      if (!grouped.has(authId)) grouped.set(authId, []);
      grouped.get(authId)!.push(a);
    }

    return {
      connections: Array.from(grouped.entries()).map(([authId, accs]) => ({
        authorizationId: authId,
        institutionName: accs[0].institution_name ?? null,
        accounts: accs.map((a) => ({
          id: a.id,
          name: a.name ?? null,
          number: a.number ?? null,
        })),
      })),
    };
  });
