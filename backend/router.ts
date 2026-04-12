import { os } from "@orpc/server";
import { holdingsGetAll } from "./procedures/holdings/handler.ts";
import type { AuthContext } from "./middleware/auth.ts";

const authOs = os.$context<AuthContext>();

export const router = authOs.router({
  holdings: authOs.router({
    getAll: holdingsGetAll,
  }),
});
