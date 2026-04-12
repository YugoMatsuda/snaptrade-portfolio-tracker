import { os } from "@orpc/server";
import { ConnectSnapTradeInput, ConnectSnapTradeOutput } from "../../contract/snaptrade.ts";
import { registerUser, getConnectionPortalUrl } from "../../lib/snaptrade.ts";
import { saveUserSecret, getUserSecret } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

export const snaptradeConnect = os
  .$context<AuthContext>()
  .input(ConnectSnapTradeInput)
  .output(ConnectSnapTradeOutput)
  .handler(async ({ context }) => {
    const { userId } = context;

    // 未登録なら registerUser してシークレットを保存
    const existing = await getUserSecret(userId);
    let userSecret: string;
    if (existing === null) {
      const result = await registerUser(userId);
      await saveUserSecret(userId, result.userSecret);
      userSecret = result.userSecret;
    } else {
      userSecret = existing.snaptrade_user_secret;
    }

    const { redirectURI } = await getConnectionPortalUrl(userId, userSecret);
    return { redirectURI };
  });
