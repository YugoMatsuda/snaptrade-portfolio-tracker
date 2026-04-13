import { os } from "@orpc/server";
import { DeleteConnectionInput, DeleteConnectionOutput } from "../../contract/snaptrade.ts";
import { deleteAuthorization } from "../../lib/snaptrade.ts";
import { getUserSecret, deleteAccountsByAuthorization } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

export const snaptradeDeleteConnection = os
  .$context<AuthContext>()
  .input(DeleteConnectionInput)
  .output(DeleteConnectionOutput)
  .handler(async ({ input, context }) => {
    const { userId } = context;
    const record = await getUserSecret(userId);
    if (!record) throw new Error("User secret not found");

    await deleteAuthorization(userId, record.snaptrade_user_secret, input.authorizationId);
    await deleteAccountsByAuthorization(userId, input.authorizationId);

    return {};
  });
