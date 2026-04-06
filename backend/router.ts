import { os } from "@orpc/server";
import { holdingsGetAll } from "./procedures/holdings/handler.ts";

export const router = os.router({
  holdings: os.router({
    getAll: holdingsGetAll,
  }),
});
