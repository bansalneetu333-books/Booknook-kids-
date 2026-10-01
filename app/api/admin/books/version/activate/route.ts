import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

type ActivatePayload = {
  versionId?: string;
  bookId?: string;
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

    const body = (await request.json()) as ActivatePayload;

    const versionId = cleanString(body.versionId);
    const bookId = cleanString(body.bookId);

    if (!versionId) {
      return NextResponse.json(
        { error: "Version ID is required." },
        { status: 400 }
      );
    }

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    /*
     * Verify that the requested version belongs
     * to the requested book.
     */
    const { data: version, error: versionError } =
      await supabase
        .from("book_versions")
        .select(
          "id,book_id,version,version_number,epub_path,file_path,file_size,active,is_current"
        )
        .eq("id", versionId)
        .eq("book_id", bookId)
        .maybeSingle();

    if (versionError) {
      console.error(
        "Version lookup error:",
        versionError
      );

      return NextResponse.json(
        { error: "Unable to verify the book version." },
        { status: 500 }
      );
    }

    if (!version) {
      return NextResponse.json(
        { error: "Book version not found." },
        { status: 404 }
      );
    }

    /*
     * Make every version of this book inactive.
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
        {
          error:
            "Unable to deactivate the previous book version.",
        },
        { status: 500 }
      );
    }

    /*
     * Activate the selected version.
     */
    const { data: activatedVersion, error: activateError } =
      await supabase
        .from("book_versions")
        .update({
          active: true,
          is_current: true,
        })
        .eq("id", versionId)
        .eq("book_id", bookId)
        .select(
          "id,book_id,version,version_number,epub_path,file_path,file_size,active,is_current,uploaded_at"
        )
        .single();

    if (activateError) {
      console.error(
        "Version activation error:",
        activateError
      );

      /*
       * Attempt to restore the selected version as active.
       */
      await supabase
        .from("book_versions")
        .update({
          active: true,
          is_current: true,
        })
        .eq("id", versionId)
        .eq("book_id", bookId);

      return NextResponse.json(
        {
          error: activateError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Keep books.epub_path synchronized with the
     * newly activated version.
     */
    const currentEpubPath =
      activatedVersion.epub_path ||
      activatedVersion.file_path ||
      null;

    const { error: bookUpdateError } = await supabase
      .from("books")
      .update({
        epub_path: currentEpubPath,
      })
      .eq("id", bookId);

    if (bookUpdateError) {
      console.error(
        "Book EPUB path synchronization error:",
        bookUpdateError
      );

      /*
       * The version itself is already correctly activated,
       * so do not undo it just because the convenience
       * books.epub_path field could not be synchronized.
       */
    }

    return NextResponse.json({
      ok: true,
      bookId,
      version: activatedVersion,
      message: `Version ${
        activatedVersion.version_number ||
        activatedVersion.version
      } is now active.`,
    });
  } catch (error) {
    console.error(
      "Admin version activation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to activate the book version.",
      },
      { status: 500 }
    );
  }
}
