import { z } from "zod";

export const SyncInput = z.object({});

export const SyncOutput = z.object({
  syncedAccounts: z.number(),
});
