// Supabase DBクライアント
// Secret keyを使用してRLSをバイパスし、任意のユーザーのデータにアクセスする

import { supabaseServiceRoleClient } from "./supabaseClient.ts";

type UserSecret = {
  snaptrade_user_secret: string;
};

// DBからuserSecretを取得する。未登録の場合はnullを返す
// TODO: snaptrade_user_secret は平文保存。本来はSupabase Vault等で暗号化すべき
export async function getUserSecret(userId: string): Promise<UserSecret | null> {
  const { data } = await supabaseServiceRoleClient
    .from("user_secrets")
    .select("snaptrade_user_secret")
    .eq("user_id", userId)
    .maybeSingle();

  return data as UserSecret | null;
}

// DBにuserSecretを保存する（初回登録時・upsert）
// TODO: snaptrade_user_secret は平文保存。本来はSupabase Vault等で暗号化すべき
export async function saveUserSecret(
  userId: string,
  snaptradeUserSecret: string,
): Promise<void> {
  const { error } = await supabaseServiceRoleClient
    .from("user_secrets")
    .upsert({
      user_id: userId,
      snaptrade_user_secret: snaptradeUserSecret,
    });

  if (error) {
    throw new Error(`Failed to save user secret: ${error.message}`);
  }
}

// --- キャッシュ書き込み ---

type AccountRow = {
  id: string;
  user_id: string;
  brokerage_authorization: string | null;
  name: string | null;
  number: string | null;
  institution_name: string | null;
};

type PositionRow = {
  account_id: string;
  user_id: string;
  ticker: string;
  name: string | null;
  units: number | null;
  price: number | null;
  open_pnl: number | null;
  average_purchase_price: number | null;
  currency: string | null;
};

type BalanceRow = {
  account_id: string;
  user_id: string;
  currency: string;
  cash: number | null;
  buying_power: number | null;
};

type TransactionRow = {
  id: string;
  account_id: string;
  user_id: string;
  type: string | null;
  description: string | null;
  amount: number | null;
  currency: string | null;
  trade_date: string | null;
  ticker: string | null;
  units: number | null;
  price: number | null;
  fee: number | null;
};

export async function upsertAccounts(rows: AccountRow[]): Promise<void> {
  const { error } = await supabaseServiceRoleClient
    .from("accounts")
    .upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Failed to upsert accounts: ${error.message}`);
}

// positionsはスナップショットなので対象accountのデータを全削除後に再挿入
export async function replacePositions(accountId: string, rows: PositionRow[]): Promise<void> {
  const { error: delError } = await supabaseServiceRoleClient
    .from("positions")
    .delete()
    .eq("account_id", accountId);
  if (delError) throw new Error(`Failed to delete positions: ${delError.message}`);

  if (rows.length === 0) return;
  const { error } = await supabaseServiceRoleClient.from("positions").insert(rows);
  if (error) throw new Error(`Failed to insert positions: ${error.message}`);
}

// balancesも同様にスナップショット
export async function replaceBalances(accountId: string, rows: BalanceRow[]): Promise<void> {
  const { error: delError } = await supabaseServiceRoleClient
    .from("balances")
    .delete()
    .eq("account_id", accountId);
  if (delError) throw new Error(`Failed to delete balances: ${delError.message}`);

  if (rows.length === 0) return;
  const { error } = await supabaseServiceRoleClient.from("balances").insert(rows);
  if (error) throw new Error(`Failed to insert balances: ${error.message}`);
}

// transactionsはIDベースのupsert（冪等）
export async function upsertTransactions(rows: TransactionRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabaseServiceRoleClient
    .from("transactions")
    .upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Failed to upsert transactions: ${error.message}`);
}

// --- キャッシュ読み取り ---

export async function getAccounts(userId: string): Promise<AccountRow[]> {
  const { data, error } = await supabaseServiceRoleClient
    .from("accounts")
    .select("*")
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to get accounts: ${error.message}`);
  return (data ?? []) as AccountRow[];
}

export async function getPositions(userId: string, accountId: string): Promise<PositionRow[]> {
  const { data, error } = await supabaseServiceRoleClient
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .eq("account_id", accountId);
  if (error) throw new Error(`Failed to get positions: ${error.message}`);
  return (data ?? []) as PositionRow[];
}

export async function getBalances(userId: string, accountId: string): Promise<BalanceRow[]> {
  const { data, error } = await supabaseServiceRoleClient
    .from("balances")
    .select("*")
    .eq("user_id", userId)
    .eq("account_id", accountId);
  if (error) throw new Error(`Failed to get balances: ${error.message}`);
  return (data ?? []) as BalanceRow[];
}

export async function getTransactions(userId: string, accountId: string): Promise<TransactionRow[]> {
  const { data, error } = await supabaseServiceRoleClient
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("account_id", accountId)
    .order("trade_date", { ascending: false });
  if (error) throw new Error(`Failed to get transactions: ${error.message}`);
  return (data ?? []) as TransactionRow[];
}

// --- キャッシュ削除 ---

// 特定の接続に紐づく口座（とそのcascade先）を削除
export async function deleteAccountsByAuthorization(
  userId: string,
  authorizationId: string,
): Promise<void> {
  const { error } = await supabaseServiceRoleClient
    .from("accounts")
    .delete()
    .eq("user_id", userId)
    .eq("brokerage_authorization", authorizationId);
  if (error) throw new Error(`Failed to delete accounts: ${error.message}`);
}

// ユーザーに紐づく全データを削除
export async function deleteAllUserData(userId: string): Promise<void> {
  const { error: accountsError } = await supabaseServiceRoleClient
    .from("accounts")
    .delete()
    .eq("user_id", userId);
  if (accountsError) throw new Error(`Failed to delete accounts: ${accountsError.message}`);

  const { error: secretError } = await supabaseServiceRoleClient
    .from("user_secrets")
    .delete()
    .eq("user_id", userId);
  if (secretError) throw new Error(`Failed to delete user_secrets: ${secretError.message}`);
}
