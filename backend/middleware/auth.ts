// Middleware that verifies the Supabase Auth JWT
// Received from iOS via the Authorization: Bearer <JWT> header

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

  // Pass the JWT to the Supabase SDK to retrieve user information
  const { data: { user }, error } = await supabaseAnonRoleClient.auth.getUser(jwt);

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { userId: user.id };
}
