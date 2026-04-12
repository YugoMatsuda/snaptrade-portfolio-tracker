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
