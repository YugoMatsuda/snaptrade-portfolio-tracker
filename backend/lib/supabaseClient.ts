import { createClient } from "@supabase/supabase-js";

function requireEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");
const SUPABASE_SECRET_KEY = requireEnv("SUPABASE_SECRET_KEY");

// For JWT verification (passes the JWT received from iOS to getUser())
export const supabaseAnonRoleClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// For DB operations (bypasses RLS to access the DB from the server side)
export const supabaseServiceRoleClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
