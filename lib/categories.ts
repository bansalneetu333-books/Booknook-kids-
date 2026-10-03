import { createClient } from "@/lib/supabase/server";

export const BOOK_CATEGORIES = [
  {
    name: "Adventure",
    icon: "🗺️",
    slug: "adventure",
  },
  {
    name: "Science",
    icon: "🔬",
    slug: "science",
  },
  {
    name: "Money",
    icon: "💰",
    slug: "money",
  },
  {
    name: "Friendship",
    icon: "🤝",
    slug: "friendship",
  },
  {
    name: "History",
    icon: "🏛️",
    slug: "history",
  },
  {
    name: "Superheroes",
    icon: "🦸",
    slug: "superheroes",
  },
  {
    name: "Fantasy",
    icon: "✨",
    slug: "fantasy",
  },
  {
    name: "Comics",
    icon: "📚",
    slug: "comics",
  },
  {
    name: "Learning",
    icon: "🎓",
    slug: "learning",
  },
  {
    name: "Life Skills",
    icon: "🌟",
    slug: "life-skills",
  },
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
};

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,icon")
    .order("name", { ascending: true });

  if (error) {
    console.error("Unable to load categories:", error);
    return [];
  }

  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,icon")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Unable to load category:", error);
    return null;
  }

  return data as Category | null;
}
