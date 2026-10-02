import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

type RouteContext = {
  params: Promise<{
    bookId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { bookId } = await params;

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const { createAdminClient } = await import("@/lib/admin");
    const supabase = createAdminClient();

    const { data: book, error } = await supabase
      .from("books")
      .select(`
        id,
        title,
        slug,
        author,
        description,
        price,
        currency,
        cover_url,
        cover_path,
        epub_path,
        category_id,
        genre,
        age_category,
        published,
        featured,
        is_published,
        is_featured,
        sort_order,
        created_at,
        updated_at
      `)
      .eq("id", bookId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Unable to load the book." },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        { error: "Book not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      book,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load the book.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { bookId } = await params;

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      updates.title = String(body.title).trim();
    }

    if (body.slug !== undefined) {
      updates.slug = String(body.slug).trim();
    }

    if (body.author !== undefined) {
      updates.author = String(body.author).trim();
    }

    if (body.description !== undefined) {
      updates.description =
        body.description === null
          ? null
          : String(body.description);
    }

    if (body.price !== undefined) {
      const price = Number(body.price);

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: "Invalid book price." },
          { status: 400 }
        );
      }

      updates.price = price;
    }

    if (body.genre !== undefined) {
      updates.genre = String(body.genre).trim();
    }

    if (body.age_category !== undefined) {
      updates.age_category = String(body.age_category).trim();
    }

    if (body.category_id !== undefined) {
      updates.category_id = body.category_id || null;
    }

    if (body.cover_path !== undefined) {
      updates.cover_path = body.cover_path || null;
    }

    if (body.cover_url !== undefined) {
      updates.cover_url = body.cover_url || null;
    }

    if (body.published !== undefined) {
      updates.published = Boolean(body.published);
    }

    if (body.featured !== undefined) {
      updates.featured = Boolean(body.featured);
    }

    if (body.sort_order !== undefined) {
      const sortOrder = Number(body.sort_order);

      if (!Number.isInteger(sortOrder)) {
        return NextResponse.json(
          { error: "Invalid sort order." },
          { status: 400 }
        );
      }

      updates.sort_order = sortOrder;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No changes were provided." },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { createAdminClient } = await import("@/lib/admin");
    const supabase = createAdminClient();

    const { data: book, error } = await supabase
      .from("books")
      .update(updates)
      .eq("id", bookId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Unable to update the book." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      book,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update the book.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { bookId } = await params;

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const { createAdminClient } = await import("@/lib/admin");
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("books")
      .delete()
      .eq("id", bookId);

    if (error) {
      return NextResponse.json(
        {
          error:
            "Unable to delete the book. It may have existing orders or related records.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete the book.",
      },
      { status: 500 }
    );
  }
}
