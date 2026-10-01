import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

type FinalizePayload = {
  bookId?: string;
  version?: string;
  epubPath?: string | null;
  epubSize?: number | null;
  coverPath?: string | null;
  published?: boolean;
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

    const body = (await request.json()) as FinalizePayload;

    const bookId = cleanString(body.bookId);
    const version = cleanString(body.version);
    const epubPath = cleanString(body.epubPath);
    const coverPath = cleanString(body.coverPath);

    const published = Boolean(body.published);

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    /*
     * Verify that the book exists.
     */
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,title,slug")
      .eq("id", bookId)
      .maybeSingle();

    if (bookError) {
      console.error("Book lookup error:", bookError);

      return NextResponse.json(
        { error: "Unable to verify the book." },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        { error: "Book not found." },
        { status: 404 }
      );
    }

    /*
     * Update the main book record.
     */
    const bookUpdate: Record<string, unknown> = {
      published,
    };

    if (coverPath) {
      bookUpdate.cover_path = coverPath;
    }

    if (epubPath) {
      bookUpdate.epub_path = epubPath;
    }

    const { error: bookUpdateError } = await supabase
      .from("books")
      .update(bookUpdate)
      .eq("id", bookId);

    if (bookUpdateError) {
      console.error(
        "Book finalize update error:",
        bookUpdateError
      );

      return NextResponse.json(
        { error: bookUpdateError.message },
        { status: 500 }
      );
    }

    /*
     * If there is no EPUB in this upload,
     * there is no new book version to create.
     *
     * This is useful when editing only the cover
     * or publishing/unpublishing an existing book.
     */
    if (!epubPath) {
      return NextResponse.json({
        ok: true,
        bookId,
        published,
        message: "Book details finalized.",
      });
    }

    if (!version) {
      return NextResponse.json(
        { error: "Version is required when uploading an EPUB." },
        { status: 400 }
      );
    }

    const epubSize =
      typeof body.epubSize === "number" &&
      Number.isFinite(body.epubSize) &&
      body.epubSize > 0
        ? Math.floor(body.epubSize)
        : null;

    /*
     * Find the current/latest version so the new version
     * can receive a clean human-readable number.
     *
     * Example:
     * first upload  -> 1.0
     * second upload -> 2.0
     * third upload  -> 3.0
     */
    const { data: existingVersions, error: versionsError } =
      await supabase
        .from("book_versions")
        .select("version_number,created_at")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (versionsError) {
      console.error(
        "Existing versions lookup error:",
        versionsError
      );

      return NextResponse.json(
        { error: "Unable to inspect existing book versions." },
        { status: 500 }
      );
    }

    let nextVersionNumber = 1;

    for (const existing of existingVersions ?? []) {
      const parsed = Number(existing.version_number);

      if (Number.isFinite(parsed)) {
        nextVersionNumber = Math.max(
          nextVersionNumber,
          Math.floor(parsed) + 1
        );
      }
    }

    const humanVersion = `${nextVersionNumber}.0`;

    /*
     * Deactivate previous versions.
     */
    const { error: deactivateError } = await supabase
      .from("book_versions")
      .update({
        active: false,
        is_current: false,
      })
      .eq("book_id", bookId);

    if (deactivateError) {
      console.error(
        "Version deactivation error:",
        deactivateError
      );

      return NextResponse.json(
        { error: "Unable to deactivate the previous version." },
        { status: 500 }
      );
    }

    /*
     * Create the new active version.
     *
     * The database contains both the older compatibility
     * fields (version/file_path) and the newer EPUB fields.
     * We populate both where appropriate.
     */
    const { data: newVersion, error: versionError } =
      await supabase
        .from("book_versions")
        .insert({
          book_id: bookId,
          version: version,
          version_number: humanVersion,
          file_path: epubPath,
          epub_path: epubPath,
          file_type: "application/epub+zip",
          file_size: epubSize,
          is_current: true,
          active: true,
          uploaded_at: new Date().toISOString(),
        })
        .select(
          "id,book_id,version,version_number,epub_path,file_path,file_type,file_size,is_current,active,uploaded_at"
        )
        .single();

    if (versionError) {
      console.error(
        "New book version error:",
        versionError
      );

      /*
       * Try to restore the previous active version if
       * inserting the new version failed.
       */
      const { data: previousVersion } = await supabase
        .from("book_versions")
        .select("id")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (previousVersion?.id) {
        await supabase
          .from("book_versions")
          .update({
            active: true,
            is_current: true,
          })
          .eq("id", previousVersion.id);
      }

      return NextResponse.json(
        {
          error: versionError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      bookId,
      published,
      version: newVersion,
      message: `Book finalized successfully as version ${humanVersion}.`,
    });
  } catch (error) {
    console.error(
      "Admin book finalize error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to finalize the book.",
      },
      { status: 500 }
    );
  }
}
