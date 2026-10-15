import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Use the bare Supabase project URL, for example https://your-project.supabase.co."
    );
  }
}

export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl || !serviceRoleKey) {
    throw new Error(
      "Missing server-only Supabase service-role configuration."
    );
  }

  return createClient(normalizeSupabaseUrl(rawUrl), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
