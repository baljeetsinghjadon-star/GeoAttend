import { createClient } from "@supabase/supabase-js";

/**
 * Service role client.
 * WARNING: This client bypasses Row Level Security (RLS).
 * It must ONLY be imported and called inside Server Components, Server Actions, or Route Handlers.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Server admin tasks require this secret."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
