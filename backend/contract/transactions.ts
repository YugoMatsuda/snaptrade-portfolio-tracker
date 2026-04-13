import { z } from "zod";

export const GetTransactionsInput = z.object({
  accountId: z.string(),
});

export const TransactionSchema = z.object({
  id: z.string(),
  type: z.string().nullable(),
  description: z.string().nullable(),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  trade_date: z.string().nullable(),
  ticker: z.string().nullable(),
  units: z.number().nullable(),
  price: z.number().nullable(),
  fee: z.number().nullable(),
});

export const GetTransactionsOutput = z.object({
  transactions: z.array(TransactionSchema),
});
