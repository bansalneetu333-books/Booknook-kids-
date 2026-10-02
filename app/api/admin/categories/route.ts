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
      .from("categories")
      .select(
        "id, name, slug, icon, description, sort_order, created_at"
      )
      .order("sort_order", {
        ascending: true,
      })
      .order("name", {
        ascending: true,
      });

    if (error) {
      return NextResponse.json(
        {
          error:
            "Unable to load categories.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      categories: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load categories.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(
      body?.name ?? ""
    ).trim();

    const slug = String(
      body?.slug ?? ""
    )
      .trim()
      .toLowerCase();

    const icon =
      body?.icon === null ||
      body?.icon === undefined
        ? null
        : String(body.icon).trim() || null;

    const description =
      body?.description === null ||
      body?.description === undefined
        ? null
        : String(body.description).trim() || null;

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Category name is required.",
        },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Category slug is required.",
        },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        {
          error:
            "Slug may contain only lowercase letters, numbers and hyphens.",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error:
            "A category with this slug already exists.",
        },
        { status: 409 }
      );
    }

    const { data: highest } = await supabase
      .from("categories")
      .select("sort_order")
      .order("sort_order", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    const nextSortOrder =
      Number(highest?.sort_order ?? 0) + 1;

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        icon,
        description,
        sort_order: nextSortOrder,
      })
      .select(
        "id, name, slug, icon, description, sort_order, created_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            "Unable to create category.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        category: data,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create category.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const categoryId =
      searchParams.get("id")?.trim() || "";

    if (!categoryId) {
      return NextResponse.json(
        {
          error:
            "Category ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { count, error: countError } =
      await supabase
        .from("books")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("category_id", categoryId);

    if (countError) {
      return NextResponse.json(
        {
          error:
            "Unable to check whether this category is being used.",
        },
        { status: 500 }
      );
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "This category is being used by one or more books. Reassign those books before deleting the category.",
        },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      return NextResponse.json(
        {
          error:
            "Unable to delete category.",
        },
        { status: 500 }
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
            : "Unable to delete category.",
      },
      { status: 500 }
    );
  }
}
