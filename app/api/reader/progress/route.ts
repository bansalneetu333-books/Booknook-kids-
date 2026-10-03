import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
    };
  }

  return {
    supabase,
    user,
  };
}

async function ownsBook(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  bookId: string
) {
  const { data, error } = await supabase
    .from("order_items")
    .select(
      `
        id,
        orders!inner (
          id,
          user_id,
          status
        )
      `
    )
    .eq("book_id", bookId)
    .eq("orders.user_id", userId)
    .eq("orders.status", "paid")
    .limit(1);

  if (error) {
    console.error(
      "Unable to verify book ownership:",
      error
    );

    return false;
  }

  return Boolean(data && data.length > 0);
}

export async function GET(request: Request) {
  try {
    const { supabase, user } =
      await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const bookId =
      url.searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json(
        {
          error: "Book ID is required.",
        },
        { status: 400 }
      );
    }

    const hasAccess = await ownsBook(
      supabase,
      user.id,
      bookId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "You do not own this book.",
        },
        { status: 403 }
      );
    }

    const { data, error } =
      await supabase
        .from("reading_progress")
        .select(
          `
            book_id,
            location,
            progress_percentage,
            last_read_at
          `
        )
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();

    if (error) {
      console.error(
        "Unable to load reading progress:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load reading progress.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookId,
      location:
        data?.location ?? null,
      progressPercentage:
        Number(
          data?.progress_percentage ?? 0
        ),
      lastReadAt:
        data?.last_read_at ?? null,
    });
  } catch (error) {
    console.error(
      "Reader progress GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load reading progress.",
      },
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
        {
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const bookId =
      typeof body.bookId === "string"
        ? body.bookId.trim()
        : "";

    const location =
      typeof body.location === "string"
        ? body.location
        : null;

    const rawProgress =
      Number(body.progressPercentage);

    if (!bookId) {
      return NextResponse.json(
        {
          error: "Book ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(rawProgress)
    ) {
      return NextResponse.json(
        {
          error:
            "Progress percentage must be a number.",
        },
        { status: 400 }
      );
    }

    const progressPercentage =
      Math.min(
        100,
        Math.max(
          0,
          rawProgress
        )
      );

    const hasAccess = await ownsBook(
      supabase,
      user.id,
      bookId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "You do not own this book.",
        },
        { status: 403 }
      );
    }

    const { error } =
      await supabase
        .from("reading_progress")
        .upsert(
          {
            user_id: user.id,
            book_id: bookId,
            location,
            progress_percentage:
              progressPercentage,
            last_read_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id,book_id",
          }
        );

    if (error) {
      console.error(
        "Unable to save reading progress:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to save reading progress.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookId,
      location,
      progressPercentage,
    });
  } catch (error) {
    console.error(
      "Reader progress POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save reading progress.",
      },
      { status: 500 }
    );
  }
}
