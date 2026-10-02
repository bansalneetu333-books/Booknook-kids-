import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to save reading progress." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const bookId = String(body?.bookId || "").trim();
    const location = String(body?.location || "").trim();

    const rawProgress =
      body?.progressPercentage ??
      body?.progress_percentage ??
      0;

    const progressPercentage = Number(rawProgress);

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { error: "Reading location is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(progressPercentage) ||
      progressPercentage < 0 ||
      progressPercentage > 100
    ) {
      return NextResponse.json(
        { error: "Progress must be between 0 and 100." },
        { status: 400 }
      );
    }

    /*
     * Verify that the customer owns the book.
     * This prevents users from writing progress for
     * books they have not purchased.
     */
    const { data: ownership, error: ownershipError } =
      await supabase
        .from("order_items")
        .select(
          "id,book_id,orders!inner(user_id,status)"
        )
        .eq("book_id", bookId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "paid")
        .limit(1)
        .maybeSingle();

    if (ownershipError) {
      console.error(
        "Progress ownership lookup error:",
        ownershipError
      );

      return NextResponse.json(
        { error: "Unable to verify book ownership." },
        { status: 500 }
      );
    }

    if (!ownership) {
      return NextResponse.json(
        { error: "You do not own this book." },
        { status: 403 }
      );
    }

    /*
     * Save or update the customer's progress.
     *
     * The unique user/book combination is expected
     * to be protected by the database constraint.
     */
    const { data, error } = await supabase
      .from("reading_progress")
      .upsert(
        {
          user_id: user.id,
          book_id: bookId,
          location,
          progress_percentage: progressPercentage,
          last_read_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,book_id",
        }
      )
      .select(
        "book_id,location,progress_percentage,last_read_at"
      )
      .single();

    if (error) {
      console.error(
        "Reading progress save error:",
        error
      );

      return NextResponse.json(
        { error: "Unable to save reading progress." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress: data,
    });
  } catch (error) {
    console.error(
      "Reading progress API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save reading progress.",
      },
      { status: 500 }
    );
  }
}
