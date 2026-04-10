// Supabase AuthのJWTを検証するミドルウェア
// iOSから Authorization: Bearer <JWT> ヘッダーで受け取る

import { supabaseAnonRoleClient } from "../lib/supabaseClient.ts";

export type AuthContext = {
  userId: string;
};

export async function getAuthContext(request: Request): Promise<AuthContext> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const jwt = authHeader.slice("Bearer ".length);

  // JWTをSupabase SDKに渡してユーザー情報を取得
  const { data: { user }, error } = await supabaseAnonRoleClient.auth.getUser(jwt);

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { userId: user.id };
}
