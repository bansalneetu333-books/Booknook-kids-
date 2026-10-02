import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    bookId: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const { bookId } = await context.params;

    if (!bookId?.trim()) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 1. Load the book
    // ------------------------------------------------------------
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select(
        `
        id,
        title,
        slug,
        author,
        description,
        price,
        currency,
        category_id,
        genre,
        age_category,
        cover_url,
        cover_path,
        epub_path,
        published,
        featured,
        sort_order,
        created_at,
        updated_at
        `
      )
      .eq("id", bookId.trim())
      .maybeSingle();

    if (bookError) {
      console.error(
        "Admin book details lookup error:",
        bookError
      );

      return NextResponse.json(
        { error: bookError.message },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        { error: "Book not found." },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // 2. Load all versions separately.
    // This avoids depending on a specific foreign-key relationship
    // name in Supabase's nested select.
    // ------------------------------------------------------------
    const { data: versions, error: versionsError } =
      await supabase
        .from("book_versions")
        .select(
          `
          id,
          book_id,
          version,
          version_number,
          file_url,
          file_path,
          file_type,
          file_size,
          is_current,
          epub_path,
          uploaded_at,
          active,
          created_at
          `
        )
        .eq("book_id", book.id)
        .order("created_at", { ascending: false });

    if (versionsError) {
      console.error(
        "Admin book versions lookup error:",
        versionsError
      );

      return NextResponse.json(
        { error: versionsError.message },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 3. Determine active/current version
    // ------------------------------------------------------------
    const activeVersion =
      (versions ?? []).find(
        (version) => version.active === true
      ) ??
      (versions ?? []).find(
        (version) => version.is_current === true
      ) ??
      null;

    // ------------------------------------------------------------
    // 4. Format versions
    // ------------------------------------------------------------
    const formattedVersions = (versions ?? []).map((version) => ({
      id: version.id,
      bookId: version.book_id,

      version: version.version,
      versionNumber: version.version_number,

      fileUrl: version.file_url,
      filePath: version.file_path,
      fileType: version.file_type,
      fileSize: version.file_size,

      epubPath: version.epub_path,

      isCurrent: version.is_current,
      active: version.active,

      uploadedAt: version.uploaded_at,
      createdAt: version.created_at,
    }));

    // ------------------------------------------------------------
    // 5. Return complete admin book details
    // ------------------------------------------------------------
    return NextResponse.json({
      ok: true,

      book: {
        id: book.id,
        title: book.title,
        slug: book.slug,
        author: book.author,
        description: book.description,

        price: Number(book.price) || 0,
        currency: book.currency || "INR",

        categoryId: book.category_id,
        genre: book.genre,
        ageCategory: book.age_category,

        coverUrl: book.cover_url,
        coverPath: book.cover_path,

        epubPath: book.epub_path,

        published: book.published,
        featured: book.featured,
        sortOrder: book.sort_order,

        createdAt: book.created_at,
        updatedAt: book.updated_at,
      },

      versions: formattedVersions,

      activeVersion: activeVersion
        ? {
            id: activeVersion.id,
            version: activeVersion.version,
            versionNumber: activeVersion.version_number,
            filePath: activeVersion.file_path,
            epubPath: activeVersion.epub_path,
            fileType: activeVersion.file_type,
            fileSize: activeVersion.file_size,
            active: activeVersion.active,
            isCurrent: activeVersion.is_current,
            uploadedAt: activeVersion.uploaded_at,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Admin book details API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load book details.",
      },
      { status: 500 }
    );
  }
}
