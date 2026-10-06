import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

type BookPayload = {
  bookId?: string;
  title?: string;
  slug?: string;
  author?: string;
  description?: string;
  price?: number;
  genre?: string;
  ageCategory?: string;
  published?: boolean;
  featured?: boolean;
  isFree?: boolean;
  categorySlugs?: string[];
  coverPath?: string | null;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const CATEGORY_NAMES: Record<string, string> = {
  adventure: "Adventure", science: "Science", money: "Money",
  friendship: "Friendship", history: "History", superheroes: "Superheroes",
  fantasy: "Fantasy", comics: "Comics", learning: "Learning",
  "life-skills": "Life Skills",
};

export async function POST(request: Request) {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();
    if (!user || !isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const body = (await request.json()) as BookPayload;
    const title = cleanString(body.title);
    const slug = cleanString(body.slug);
    const author = cleanString(body.author);
    const description = cleanString(body.description);
    const genre = cleanString(body.genre);
    const ageCategory = cleanString(body.ageCategory);
    const coverPath = cleanString(body.coverPath);
    const categorySlugs = Array.isArray(body.categorySlugs)
      ? [...new Set(body.categorySlugs.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map(v => v.trim().toLowerCase()))]
      : [];

    if (!title) return NextResponse.json({ error: "Book title is required." }, { status: 400 });
    if (!slug) return NextResponse.json({ error: "Book slug is required." }, { status: 400 });
    if (!author) return NextResponse.json({ error: "Author is required." }, { status: 400 });
    if (categorySlugs.length === 0) return NextResponse.json({ error: "Select at least one category." }, { status: 400 });

    const price = Number(body.price ?? 0);
    if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Price must be a valid non-negative number." }, { status: 400 });

    async function syncCategories(bookId: string) {
      let { data: categories, error } = await supabase.from("categories").select("id,slug").in("slug", categorySlugs);
      if (error) throw error;

      const found = new Set((categories ?? []).map(c => c.slug));
      const missing = categorySlugs.filter(s => !found.has(s));
      if (missing.length) {
        const { error: insertError } = await supabase.from("categories").insert(
          missing.map(slug => ({ slug, name: CATEGORY_NAMES[slug] ?? slug }))
        );
        if (insertError && insertError.code !== "23505") throw insertError;

        const refreshed = await supabase.from("categories").select("id,slug").in("slug", categorySlugs);
        if (refreshed.error) throw refreshed.error;
        categories = refreshed.data;
      }

      if (!categories || categories.length !== categorySlugs.length) {
        throw new Error("One or more selected categories could not be saved.");
      }

      const { error: deleteError } = await supabase.from("book_categories").delete().eq("book_id", bookId);
      if (deleteError) throw deleteError;

      const { error: insertRelationError } = await supabase.from("book_categories").insert(
        categories.map(category => ({ book_id: bookId, category_id: category.id }))
      );
      if (insertRelationError) throw insertRelationError;
    }

    const bookData = {
      title, slug, author, description, price,
      genre: genre || categorySlugs.map(s => CATEGORY_NAMES[s] ?? s).join(" / "),
      age_category: ageCategory,
      published: Boolean(body.published),
      is_published: Boolean(body.published),
      featured: Boolean(body.featured),
      is_featured: Boolean(body.featured),
      is_free: Boolean(body.isFree),
      ...(coverPath ? { cover_path: coverPath, cover_url: "/api/books/cover?path=" + encodeURIComponent(coverPath) } : {}),
    };

    if (body.bookId) {
      const { data: existing, error: existingError } = await supabase.from("books").select("id").eq("id", body.bookId).maybeSingle();
      if (existingError) return NextResponse.json({ error: "Unable to find the existing book." }, { status: 500 });
      if (!existing) return NextResponse.json({ error: "Book not found." }, { status: 404 });

      const { data, error } = await supabase.from("books").update(bookData).eq("id", body.bookId)
        .select("id,title,slug,author,description,price,genre,age_category,published,featured,cover_path").single();
      if (error) {
        if (error.code === "23505") return NextResponse.json({ error: "A book with this slug already exists." }, { status: 409 });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      try {
        await syncCategories(data.id);
      } catch (error) {
        console.error("Book category sync failed:", error);
        return NextResponse.json({ error: "Book was saved, but its categories could not be synchronized. Please try again." }, { status: 500 });
      }

      return NextResponse.json({ ok: true, id: data.id, book: data });
    }

    const { data, error } = await supabase.from("books").insert(bookData)
      .select("id,title,slug,author,description,price,genre,age_category,published,featured,cover_path").single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "A book with this slug already exists." }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      await syncCategories(data.id);
    } catch (error) {
      console.error("Book category sync failed:", error);
      await supabase.from("books").delete().eq("id", data.id);
      return NextResponse.json({ error: "Book could not be completed because its categories could not be saved." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id, book: data }, { status: 201 });
  } catch (error) {
    console.error("Admin books API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save the book." }, { status: 500 });
  }
}
