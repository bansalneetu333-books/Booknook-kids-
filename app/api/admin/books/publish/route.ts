import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

type PublishPayload = {
  bookId?: string;
  published?: boolean;
};

export async function PATCH(request: Request) {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as PublishPayload;

    const bookId =
      typeof body.bookId === "string" ? body.bookId.trim() : "";

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    if (typeof body.published !== "boolean") {
      return NextResponse.json(
        { error: "Published must be true or false." },
        { status: 400 }
      );
    }

    // Make sure the book exists.
    const { data: existingBook, error: findError } = await supabase
      .from("books")
      .select("id,title,published")
      .eq("id", bookId)
      .maybeSingle();

    if (findError) {
      console.error("Publish book lookup error:", findError);

      return NextResponse.json(
        { error: "Unable to find the book." },
        { status: 500 }
      );
    }

    if (!existingBook) {
      return NextResponse.json(
        { error: "Book not found." },
        { status: 404 }
      );
    }

    // Update only the existing published field.
    const { data: book, error: updateError } = await supabase
      .from("books")
      .update({
        published: body.published,
      })
      .eq("id", bookId)
      .select(
        "id,title,slug,author,description,price,genre,age_category,published,featured,cover_path"
      )
      .single();

    if (updateError) {
      console.error("Publish book update error:", updateError);

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      book,
      message: body.published
        ? "Book published successfully."
        : "Book unpublished successfully.",
    });
  } catch (error) {
    console.error("Admin publish book API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update book publication status.",
      },
      { status: 500 }
    );
  }
}
