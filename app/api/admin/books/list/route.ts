import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getBookFileAvailability } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const genre = searchParams.get("genre")?.trim() || "";
    const published = searchParams.get("published")?.trim() || "";
    const featured = searchParams.get("featured")?.trim() || "";

    // ------------------------------------------------------------
    // 1. Load all books
    // ------------------------------------------------------------
    let query = supabase
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
        genre,
        age_category,
        cover_path,
        epub_path,
        published,
        is_published,
        featured,
        is_featured,
        is_free,
        created_at,
        updated_at,
        book_categories (
          categories (
            name,
            slug
          )
        ),
        book_versions(
          id,
          version,
          version_number,
          file_path,
          epub_path,
          file_type,
          file_size,
          is_current,
          active,
          uploaded_at,
          created_at
        )
        `
      )
      .order("created_at", { ascending: false });

    // ------------------------------------------------------------
    // 2. Filters
    // ------------------------------------------------------------
    if (genre) {
      query = query.eq("genre", genre);
    }

    if (published === "true") {
      query = query.eq("published", true);
    }

    if (published === "false") {
      query = query.eq("published", false);
    }

    if (featured === "true") {
      query = query.eq("featured", true);
    }

    if (featured === "false") {
      query = query.eq("featured", false);
    }

    const { data: books, error } = await query;

    if (error) {
      console.error("Admin books list lookup error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 3. Optional search
    //
    // We perform search after loading the filtered catalogue so
    // that we don't need to assume additional database indexes
    // or columns.
    // ------------------------------------------------------------
    const filteredBooks = (books ?? []).filter((book) => {
      if (!search) {
        return true;
      }

      const searchableText = [
        book.title,
        book.slug,
        book.author,
        book.description,
        book.genre,
        book.age_category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search.toLowerCase());
    });

    // ------------------------------------------------------------
    // 4. Format version information
    // ------------------------------------------------------------
    const formattedBooks = await Promise.all(filteredBooks.map(async (book) => {
      const fileAvailability = await getBookFileAvailability(book.id);
      const versions = [...(book.book_versions ?? [])].sort(
        (a, b) => {
          const dateA = a.uploaded_at || a.created_at || "";
          const dateB = b.uploaded_at || b.created_at || "";

          return (
            new Date(dateB).getTime() -
            new Date(dateA).getTime()
          );
        }
      );

      const activeVersion =
        versions.find((version) => version.active === true) ??
        versions.find((version) => version.is_current === true) ??
        null;

      return {
        id: book.id,
        title: book.title,
        slug: book.slug,
        author: book.author,
        description: book.description,
        price: Number(book.price) || 0,
        currency: book.currency || "INR",
        genre: book.genre,
        ageCategory: book.age_category,

        coverPath: book.cover_path,
        epubPath: book.epub_path,
        epubAvailable: fileAvailability.epubAvailable,
        pdfAvailable: fileAvailability.pdfAvailable,
        epubFilePath: fileAvailability.epubPath,
        pdfFilePath: fileAvailability.pdfPath,

        published: Boolean(book.published ?? book.is_published),
        featured: Boolean(book.featured ?? book.is_featured),
        isFree: Boolean(book.is_free),
        categories: (book.book_categories ?? []).map((item: any) => {
          const category = Array.isArray(item.categories) ? item.categories[0] : item.categories;
          return category ? { name: category.name, slug: category.slug } : null;
        }).filter(Boolean),

        createdAt: book.created_at,
        updatedAt: book.updated_at,

        versions: versions.map((version) => ({
          id: version.id,
          version: version.version,
          versionNumber: version.version_number,
          filePath: version.file_path,
          epubPath: version.epub_path,
          fileType: version.file_type,
          fileSize: version.file_size,
          isCurrent: version.is_current,
          active: version.active,
          uploadedAt: version.uploaded_at,
          createdAt: version.created_at,
        })),

        activeVersion: activeVersion
          ? {
              id: activeVersion.id,
              versionNumber: activeVersion.version_number,
              fileSize: activeVersion.file_size,
              active: activeVersion.active,
            }
          : null,
      };
    });

    // ------------------------------------------------------------
    // 5. Summary
    // ------------------------------------------------------------
    const summary = {
      total: formattedBooks.length,

      published: formattedBooks.filter(
        (book) => book.published === true
      ).length,

      drafts: formattedBooks.filter(
        (book) => book.published !== true
      ).length,

      featured: formattedBooks.filter(
        (book) => book.featured === true
      ).length,

      withCover: formattedBooks.filter(
        (book) => Boolean(book.coverPath)
      ).length,

      withEpub: formattedBooks.filter(
        (book) =>
          Boolean(book.epubAvailable) ||
          Boolean(book.epubPath) ||
          Boolean(book.activeVersion)
      ).length,
    };

    return NextResponse.json({
      ok: true,
      books: formattedBooks,
      count: formattedBooks.length,
      summary,
    });
  } catch (error) {
    console.error("Admin books list API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load books.",
      },
      { status: 500 }
    );
  }
}
