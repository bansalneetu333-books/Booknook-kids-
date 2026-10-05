import { createClient } from "@/lib/supabase/server";

export type Book = {
  id: string;
  title: string;
  slug: string;
  author: string;
  description: string | null;
  price: number;
  currency?: string | null;
  genre: string | null;
  age_category: string | null;
  cover_path: string | null;
  published: boolean;
  is_published?: boolean | null;
  featured: boolean;
  is_free: boolean;
  created_at: string;
};

const BOOK_FIELDS = `
  id,
  title,
  slug,
  author,
  description,
  price,
  currency,
  genre,
  age_category,
  cover_path,
  published,
  is_published,
  featured,
  is_free,
  created_at
`;

function normalizeBook(
  book: any
): Book {
  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    author: book.author,
    description:
      book.description ?? null,
    price: Number(book.price ?? 0),
    currency:
      book.currency ?? "INR",
    genre: book.genre ?? null,
    age_category:
      book.age_category ?? null,
    cover_path:
      book.cover_path ?? null,
    published: Boolean(
      book.published ?? book.is_published
    ),
    is_published: book.is_published ?? null,
    featured: Boolean(
      book.featured
    ),
    is_free: Boolean(book.is_free),
    created_at:
      book.created_at,
  };
}

export async function getPublishedBooks(): Promise<Book[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select(BOOK_FIELDS)
    .or("published.eq.true,is_published.eq.true")
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load published books:",
      error
    );

    return [];
  }

  return (data ?? []).map(
    normalizeBook
  );
}

export async function getBookBySlug(
  slug: string
): Promise<Book | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select(BOOK_FIELDS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load book:",
      error
    );

    return null;
  }

  return data
    ? normalizeBook(data)
    : null;
}

export async function getFreeBooks(categorySlug?: string): Promise<Book[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select(`${BOOK_FIELDS},
      book_categories!inner (
        categories!inner (
          name,
          slug,
          icon
        )
      )
    `)
    .eq("published", true)
    .eq("is_free", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load free books:", error);
    return [];
  }

  const books = (data ?? []).map(normalizeBook);

  if (!categorySlug) return books;

  const wanted = categorySlug.toLowerCase();
  return (data ?? [])
    .filter((book: any) =>
      (book.book_categories ?? []).some((item: any) => {
        const category = Array.isArray(item.categories) ? item.categories[0] : item.categories;
        return category?.slug?.toLowerCase() === wanted;
      })
    )
    .map(normalizeBook);
}

export async function getFeaturedBooks(): Promise<Book[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select(BOOK_FIELDS)
    .eq("published", true)
    .eq("featured", true)
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load featured books:",
      error
    );

    return [];
  }

  return (data ?? []).map(
    normalizeBook
  );
}
