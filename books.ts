import { createClient } from "@/lib/supabase/server";

export type Book = {
  id: string;
  title: string;
  slug: string;
  author: string;
  description: string;
  price: number;
  genre: string;
  age_category: string;
  cover_path: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
};

export async function getPublishedBooks(options?: {
  search?: string;
  genre?: string;
  age?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("books")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (options?.search) {
    const search = options.search.trim();
    query = query.or(
      `title.ilike.%${search}%,author.ilike.%${search}%,genre.ilike.%${search}%`
    );
  }

  if (options?.genre) query = query.ilike("genre", `%${options.genre}%`);
  if (options?.age) query = query.eq("age_category", options.age);

  const { data, error } = await query;
  if (error) throw new Error("Unable to load books.");
  return (data ?? []) as Book[];
}

export async function getBookBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error("Unable to load book.");
  return data as Book | null;
}

export async function getFeaturedBooks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("published", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) throw new Error("Unable to load featured books.");
  return (data ?? []) as Book[];
}
