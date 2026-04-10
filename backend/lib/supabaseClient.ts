import { createClient } from "@supabase/supabase-js";

function requireEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");
const SUPABASE_SECRET_KEY = requireEnv("SUPABASE_SECRET_KEY");

// JWT検証用（iOSから受け取ったJWTをgetUser()に渡す）
export const supabaseAnonRoleClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DB操作用（RLSをバイパスしてサーバーサイドからDBにアクセスする）
export const supabaseServiceRoleClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
