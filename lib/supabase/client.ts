import { createBrowserClient } from "@supabase/ssr";

function normalizeSupabaseUrl(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Use the bare Supabase project URL, for example https://your-project.supabase.co."
    );
  }
}

export function createClient() {
  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawSupabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient(
    normalizeSupabaseUrl(rawSupabaseUrl),
    supabaseKey
  );
}
