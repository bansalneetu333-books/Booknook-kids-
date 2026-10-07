import { createClient } from "@/lib/supabase/server";

export { BOOK_CATEGORIES } from "@/lib/book-categories";
export type {
  BookCategory,
  BookCategoryName,
  BookCategorySlug,
} from "@/lib/book-categories";

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
