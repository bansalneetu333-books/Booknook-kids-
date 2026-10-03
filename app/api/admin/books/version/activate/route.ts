import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const bookId =
      typeof body.bookId === "string"
        ? body.bookId.trim()
        : "";

    const versionId =
      typeof body.versionId === "string"
        ? body.versionId.trim()
        : "";

    if (!bookId || !versionId) {
      return NextResponse.json(
        {
          error:
            "Book ID and version ID are required.",
        },
        { status: 400 }
      );
    }

    const { createAdminClient } =
      await import("@/lib/admin");

    const admin = createAdminClient();

    /*
     * First make sure the version actually
     * belongs to the requested book.
     */
    const { data: version, error: findError } =
      await admin
        .from("book_versions")
        .select(
          `
            id,
            book_id,
            file_path,
            epub_path
          `
        )
        .eq("id", versionId)
        .eq("book_id", bookId)
        .maybeSingle();

    if (findError) {
      console.error(
        "Unable to find book version:",
        findError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find the requested version.",
        },
        { status: 500 }
      );
    }

    if (!version) {
      return NextResponse.json(
        {
          error:
            "The selected version does not belong to this book.",
        },
        { status: 404 }
      );
    }

    if (
      !version.epub_path &&
      !version.file_path
    ) {
      return NextResponse.json(
        {
          error:
            "This version does not contain an EPUB file.",
        },
        { status: 400 }
      );
    }

    /*
     * Remove current/active status from every
     * version of this book.
     */
    const { error: deactivateError } =
      await admin
        .from("book_versions")
        .update({
          is_current: false,
          active: false,
        })
        .eq("book_id", bookId);

    if (deactivateError) {
      console.error(
        "Unable to deactivate existing versions:",
        deactivateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to deactivate the previous version.",
        },
        { status: 500 }
      );
    }

    /*
     * Make the selected version the only
     * active/current version.
     */
    const { data: activated, error: activateError } =
      await admin
        .from("book_versions")
        .update({
          is_current: true,
          active: true,
        })
        .eq("id", versionId)
        .eq("book_id", bookId)
        .select(
          `
            id,
            book_id,
            version,
            version_number,
            file_path,
            epub_path,
            file_type,
            file_size,
            is_current,
            active,
            created_at
          `
        )
        .single();

    if (activateError) {
      console.error(
        "Unable to activate version:",
        activateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to activate the selected version.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      version: activated,
    });
  } catch (error) {
    console.error(
      "Version activation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to activate the book version.",
      },
      { status: 500 }
    );
  }
}
