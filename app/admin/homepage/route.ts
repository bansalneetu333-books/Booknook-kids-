import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("books")
      .select(
        "id, title, slug, author, description, price, cover_path, published, featured, sort_order, created_at, updated_at"
      )
      .order("featured", {
        ascending: false,
      })
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      return NextResponse.json(
        {
          error:
            "Unable to load homepage books.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      books: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load homepage books.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const bookId = String(
      body?.bookId ?? ""
    ).trim();

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.featured !== undefined) {
      updates.featured = Boolean(
        body.featured
      );
    }

    if (body.published !== undefined) {
      updates.published = Boolean(
        body.published
      );
    }

    if (body.sort_order !== undefined) {
      const sortOrder = Number(
        body.sort_order
      );

      if (
        !Number.isInteger(sortOrder) ||
        sortOrder < 0
      ) {
        return NextResponse.json(
          {
            error:
              "Sort order must be a non-negative integer.",
          },
          { status: 400 }
        );
      }

      updates.sort_order = sortOrder;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          error:
            "No homepage changes were provided.",
        },
        { status: 400 }
      );
    }

    updates.updated_at =
      new Date().toISOString();

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("books")
      .update(updates)
      .eq("id", bookId)
      .select(
        "id, title, slug, author, description, price, cover_path, published, featured, sort_order, created_at, updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            "Unable to update homepage settings.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      book: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update homepage settings.",
      },
      { status: 500 }
    );
  }
}
