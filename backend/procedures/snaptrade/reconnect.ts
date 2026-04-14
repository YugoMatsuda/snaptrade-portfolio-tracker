import { os } from "@orpc/server";
import { ReconnectSnapTradeInput, ReconnectSnapTradeOutput } from "../../contract/snaptrade.ts";
import { getReconnectPortalUrl } from "../../lib/snaptrade.ts";
import { getUserSecret } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

export const snaptradeReconnect = os
  .$context<AuthContext>()
  .input(ReconnectSnapTradeInput)
  .output(ReconnectSnapTradeOutput)
  .handler(async ({ input, context }) => {
    const { userId } = context;
    const record = await getUserSecret(userId);
    if (!record) throw new Error("User secret not found");

    const { redirectURI } = await getReconnectPortalUrl(
      userId,
      record.snaptrade_user_secret,
      input.authorizationId,
      "snaptrade://connected",
    );
    return { redirectURI };
  });
