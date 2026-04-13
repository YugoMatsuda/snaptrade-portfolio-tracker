import { os } from "@orpc/server";
import { DeleteUserInput, DeleteUserOutput } from "../../contract/snaptrade.ts";
import { deleteUser } from "../../lib/snaptrade.ts";
import { deleteAllUserData } from "../../lib/supabase.ts";
import type { AuthContext } from "../../middleware/auth.ts";

export const snaptradeDeleteUser = os
  .$context<AuthContext>()
  .input(DeleteUserInput)
  .output(DeleteUserOutput)
  .handler(async ({ context }) => {
    const { userId } = context;

    // NOTE: SnapTrade's deleteUser is asynchronous — the API returns immediately with
    // status "deleted" but actual deletion is queued. A USER_DELETED webhook is sent
    // when deletion is complete. Ideally, Supabase data should be cleaned up upon
    // receiving that webhook, not here. For now we delete eagerly as a simplification.
    await deleteUser(userId);
    await deleteAllUserData(userId);

    return {};
  });
