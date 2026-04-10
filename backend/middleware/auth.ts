// Supabase AuthのJWTを検証するミドルウェア
// iOSから Authorization: Bearer <JWT> ヘッダーで受け取る

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

export type AuthContext = {
  userId: string;
};

export async function getAuthContext(request: Request): Promise<AuthContext> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const jwt = authHeader.slice("Bearer ".length);

  // Supabase Auth APIでJWT検証 → ユーザー情報取得
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "apikey": SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  const user = await res.json() as { id: string };
  return { userId: user.id };
}
