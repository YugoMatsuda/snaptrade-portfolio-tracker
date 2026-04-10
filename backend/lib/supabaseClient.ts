import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

// JWT検証用（iOSから受け取ったJWTをgetUser()に渡す）
export const supabaseAnonRoleClient = createClient(
  SUPABASE_URL,
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
);

// DB操作用（RLSをバイパスしてサーバーサイドからDBにアクセスする）
export const supabaseServiceRoleClient = createClient(
  SUPABASE_URL,
  Deno.env.get("SUPABASE_SECRET_KEY") ?? "",
);
