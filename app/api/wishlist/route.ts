import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function GET(request: Request) {
  try {
    const { supabase, user } =
      await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { wishlisted: false },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const bookId = url.searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();

    if (error) {
      console.error("Wishlist lookup error:", error);

      return NextResponse.json(
        { error: "Unable to check wishlist." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      wishlisted: Boolean(data),
    });
  } catch (error) {
    console.error("Wishlist GET error:", error);

    return NextResponse.json(
      { error: "Unable to load wishlist." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } =
      await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to use your wishlist." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const bookId = String(body?.bookId || "").trim();

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    const { data: book, error: bookError } =
      await supabase
        .from("books")
        .select("id")
        .eq("id", bookId)
        .eq("published", true)
        .maybeSingle();

    if (bookError) {
      console.error(
        "Wishlist book lookup error:",
        bookError
      );

      return NextResponse.json(
        { error: "Unable to find the selected book." },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        { error: "Book not found." },
        { status: 404 }
      );
    }

    const { data: existing, error: existingError } =
      await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();

    if (existingError) {
      console.error(
        "Wishlist existing lookup error:",
        existingError
      );

      return NextResponse.json(
        { error: "Unable to update wishlist." },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json({
        success: true,
        wishlisted: true,
      });
    }

    const { error: insertError } =
      await supabase
        .from("wishlists")
        .insert({
          user_id: user.id,
          book_id: bookId,
        });

    if (insertError) {
      console.error(
        "Wishlist insert error:",
        insertError
      );

      return NextResponse.json(
        { error: "Unable to add book to wishlist." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wishlisted: true,
    });
  } catch (error) {
    console.error("Wishlist POST error:", error);

    return NextResponse.json(
      { error: "Unable to update wishlist." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } =
      await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to use your wishlist." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const bookId = String(body?.bookId || "").trim();

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("book_id", bookId);

    if (error) {
      console.error(
        "Wishlist delete error:",
        error
      );

      return NextResponse.json(
        { error: "Unable to remove book from wishlist." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wishlisted: false,
    });
  } catch (error) {
    console.error("Wishlist DELETE error:", error);

    return NextResponse.json(
      { error: "Unable to update wishlist." },
      { status: 500 }
    );
  }
}
