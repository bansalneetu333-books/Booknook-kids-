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
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as BookPayload;

    const title = cleanString(body.title);
    const slug = cleanString(body.slug);
    const author = cleanString(body.author);
    const description = cleanString(body.description);
    const genre = cleanString(body.genre);
    const ageCategory = cleanString(body.ageCategory);

    if (!title) {
      return NextResponse.json(
        { error: "Book title is required." },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { error: "Book slug is required." },
        { status: 400 }
      );
    }

    if (!author) {
      return NextResponse.json(
        { error: "Author is required." },
        { status: 400 }
      );
    }

    if (!genre) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }

    const price = Number(body.price ?? 0);

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Price must be a valid non-negative number." },
        { status: 400 }
      );
    }

    const bookData = {
      title,
      slug,
      author,
      description,
      price,
      genre,
      age_category: ageCategory,
      published: Boolean(body.published),
      is_published: Boolean(body.published),
      featured: Boolean(body.featured),
      is_featured: Boolean(body.featured),
    };

    if (body.bookId) {
      const { data: existingBook, error: existingError } =
        await supabase
          .from("books")
          .select("id")
          .eq("id", body.bookId)
          .maybeSingle();

      if (existingError) {
        console.error(existingError);

        return NextResponse.json(
          { error: "Unable to find the existing book." },
          { status: 500 }
        );
      }

      if (!existingBook) {
        return NextResponse.json(
          { error: "Book not found." },
          { status: 404 }
        );
      }

      const { data, error } = await supabase
        .from("books")
        .update(bookData)
        .eq("id", body.bookId)
        .select(
          "id,title,slug,author,description,price,genre,age_category,published,featured,cover_path"
        )
        .single();

      if (error) {
        console.error(error);

        if (error.code === "23505") {
          return NextResponse.json(
            { error: "A book with this slug already exists." },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        id: data.id,
        book: data,
      });
    }

    const { data, error } = await supabase
      .from("books")
      .insert(bookData)
      .select(
        "id,title,slug,author,description,price,genre,age_category,published,featured,cover_path"
      )
      .single();

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A book with this slug already exists." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        id: data.id,
        book: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin books API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save the book.",
      },
      { status: 500 }
    );
  }
}
