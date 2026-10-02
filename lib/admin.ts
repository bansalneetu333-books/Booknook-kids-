import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "bansalneetu333@gmail.com";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing server-only Supabase service-role configuration."
    );
  }

  return createSupabaseAdminClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
      isAdmin: false as const,
    };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id,full_name,email,role")
    .eq("id", user.id)
    .maybeSingle();

  const emailIsAdmin =
    user.email?.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase();

  const roleIsAdmin =
    profile?.role === "admin";

  const isAdmin =
    emailIsAdmin || roleIsAdmin;

  return {
    supabase: isAdmin ? admin : supabase,
    user,
    profile,
    isAdmin,
  };
}

export { ADMIN_EMAIL };
