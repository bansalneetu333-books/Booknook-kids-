import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Re-export for existing API routes that import this helper from "@/lib/admin".
export { createAdminClient };

export const ADMIN_EMAIL = "bansalneetu333@gmail.com";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_admin: boolean | null;
};

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

  let profile: Profile | null = null;

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    profile = data;
  } catch {
    // A missing or unreadable profile must never grant admin access.
  }

  const isAdmin = emailIsAdmin && profile?.is_admin === true;

  return {
    supabase: isAdmin ? createAdminClient() : supabase,
    user,
    profile,
    isAdmin,
  };
}
