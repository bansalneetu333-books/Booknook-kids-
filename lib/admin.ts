import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export const ADMIN_EMAIL = "bansalneetu333@gmail.com";

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

  const emailIsAdmin =
    user.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  let profile: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null = null;

  try {
    const admin = createAdminClient();

    const { data } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    profile = data;
  } catch {
    // Admin authorization is based on the configured admin email.
    // A missing profile must not prevent the admin account from working.
  }

  return {
    supabase: emailIsAdmin ? createAdminClient() : supabase,
    user,
    profile,
    isAdmin: emailIsAdmin,
  };
}
