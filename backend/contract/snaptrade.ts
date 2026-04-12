import { z } from "zod";

// POST /snaptrade/connect
// SnapTrade未登録なら registerUser → 登録済みならスキップ
// ブローカー接続ポータルURLを返す
export const ConnectSnapTradeInput = z.object({});

export const ConnectSnapTradeOutput = z.object({
  redirectURI: z.string(),
});

// GET /snaptrade/accounts
export const GetAccountsInput = z.object({});

export const AccountSchema = z.object({
  id: z.string(),
  brokerage_authorization: z.string().nullable(),
  name: z.string().nullable(),
  number: z.string().nullable(),
  institution_name: z.string().nullable(),
});

export const GetAccountsOutput = z.object({
  accounts: z.array(AccountSchema),
});
