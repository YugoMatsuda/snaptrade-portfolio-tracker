// Supabase DB client
// Uses the secret key to bypass RLS and access data for any user

import { supabaseServiceRoleClient } from "./supabaseClient.ts";

type UserSecret = {
  snaptrade_user_secret: string;
};

// Retrieves the userSecret from the DB. Returns null if the user is not registered.
// TODO: snaptrade_user_secret is stored in plaintext. Should be encrypted using Supabase Vault or similar.
export async function getUserSecret(userId: string): Promise<UserSecret | null> {
  const { data } = await supabaseServiceRoleClient
    .from("user_secrets")
    .select("snaptrade_user_secret")
    .eq("user_id", userId)
    .maybeSingle();

  return data as UserSecret | null;
}

// Saves the userSecret to the DB (on first registration, via upsert)
// TODO: snaptrade_user_secret is stored in plaintext. Should be encrypted using Supabase Vault or similar.
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

// --- Cache Writes ---

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

// positions is a snapshot, so delete all data for the target account before re-inserting
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

// balances is also a snapshot, same approach
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

// transactions uses ID-based upsert (idempotent)
export async function upsertTransactions(rows: TransactionRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabaseServiceRoleClient
    .from("transactions")
    .upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Failed to upsert transactions: ${error.message}`);
}

// --- Cache Reads ---

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

// --- Authorization ---

type AuthorizationRow = {
  authorization_id: string;
  user_id: string;
  is_disabled: boolean;
  disabled_date: string | null;
};

export async function upsertAuthorizations(rows: AuthorizationRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabaseServiceRoleClient
    .from("user_authorizations")
    .upsert(rows, { onConflict: "authorization_id" });
  if (error) throw new Error(`Failed to upsert authorizations: ${error.message}`);
}

export async function getAuthorizations(userId: string): Promise<AuthorizationRow[]> {
  const { data, error } = await supabaseServiceRoleClient
    .from("user_authorizations")
    .select("*")
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to get authorizations: ${error.message}`);
  return (data ?? []) as AuthorizationRow[];
}

// --- Cache Deletes ---

// Deletes accounts (and their cascade targets) associated with a specific connection
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

// Deletes all data associated with a user
export async function deleteAllUserData(userId: string): Promise<void> {
  const { error: accountsError } = await supabaseServiceRoleClient
    .from("accounts")
    .delete()
    .eq("user_id", userId);
  if (accountsError) throw new Error(`Failed to delete accounts: ${accountsError.message}`);

  const { error: authError } = await supabaseServiceRoleClient
    .from("user_authorizations")
    .delete()
    .eq("user_id", userId);
  if (authError) throw new Error(`Failed to delete user_authorizations: ${authError.message}`);

  const { error: secretError } = await supabaseServiceRoleClient
    .from("user_secrets")
    .delete()
    .eq("user_id", userId);
  if (secretError) throw new Error(`Failed to delete user_secrets: ${secretError.message}`);
}
