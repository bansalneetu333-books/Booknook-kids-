import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function normalizeSupabaseUrl(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Use the bare Supabase project URL, for example https://your-project.supabase.co."
    );
  }
}

export async function createClient() {
  const cookieStore = await cookies();

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

  return createServerClient(
    normalizeSupabaseUrl(rawSupabaseUrl),
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {
            // Server Components cannot always write cookies.
            // Middleware handles session refresh.
          }
        },
      },
    }
  );
}
