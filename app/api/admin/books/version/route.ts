import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const PRIVATE_EBOOK_BUCKET = "ebooks-private";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function cleanPart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
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

    const formData = await request.formData();

    const bookIdValue = formData.get("bookId");
    const versionValue = formData.get("version");
    const epubValue = formData.get("epub");

    const bookId =
      typeof bookIdValue === "string"
        ? bookIdValue.trim()
        : "";

    const version =
      typeof versionValue === "string"
        ? versionValue.trim()
        : "";

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    if (!version) {
      return NextResponse.json(
        { error: "Version is required." },
        { status: 400 }
      );
    }

    if (!(epubValue instanceof File)) {
      return NextResponse.json(
        { error: "EPUB file is required." },
        { status: 400 }
      );
    }

    if (epubValue.size <= 0) {
      return NextResponse.json(
        { error: "The EPUB file is empty." },
        { status: 400 }
      );
    }

    if (epubValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "EPUB files must be 50 MB or smaller.",
        },
        { status: 400 }
      );
    }

    const fileName = epubValue.name.toLowerCase();

    if (!fileName.endsWith(".epub")) {
      return NextResponse.json(
        { error: "Only EPUB files are allowed." },
        { status: 400 }
      );
    }

    /*
     * Verify book.
     */
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,slug,title")
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

    const safeSlug = cleanPart(book.slug || book.id);
    const safeVersion = cleanPart(version);

    const path =
      `${safeSlug}/v${safeVersion}/epub.epub`;

    /*
     * Upload the EPUB using the server-side admin client.
     */
    const fileBuffer = Buffer.from(
      await epubValue.arrayBuffer()
    );

    const { error: uploadError } = await supabase.storage
      .from(PRIVATE_EBOOK_BUCKET)
      .upload(path, fileBuffer, {
        contentType: "application/epub+zip",
        upsert: false,
      });

    if (uploadError) {
      console.error("EPUB upload error:", uploadError);

      return NextResponse.json(
        {
          error:
            uploadError.message ||
            "Unable to upload the EPUB.",
        },
        { status: 500 }
      );
    }

    /*
     * Determine the next human-readable version number.
     */
    const { data: existingVersions } = await supabase
      .from("book_versions")
      .select("version_number,created_at")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false })
      .limit(50);

    let nextVersion = 1;

    for (const item of existingVersions ?? []) {
      const number = Number(item.version_number);

      if (Number.isFinite(number)) {
        nextVersion = Math.max(
          nextVersion,
          Math.floor(number) + 1
        );
      }
    }

    const humanVersion = `${nextVersion}.0`;

    /*
     * Make all previous versions inactive.
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

      /*
       * Remove the newly uploaded file because the
       * database could not be updated safely.
       */
      await supabase.storage
        .from(PRIVATE_EBOOK_BUCKET)
        .remove([path]);

      return NextResponse.json(
        {
          error:
            "Unable to deactivate the previous book version.",
        },
        { status: 500 }
      );
    }

    /*
     * Create the new version record.
     */
    const { data: newVersion, error: insertError } =
      await supabase
        .from("book_versions")
        .insert({
          book_id: bookId,
          version,
          version_number: humanVersion,
          file_path: path,
          epub_path: path,
          file_type: "application/epub+zip",
          file_size: epubValue.size,
          is_current: true,
          active: true,
          uploaded_at: new Date().toISOString(),
        })
        .select(
          "id,book_id,version,version_number,epub_path,file_path,file_type,file_size,is_current,active,uploaded_at"
        )
        .single();

    if (insertError) {
      console.error(
        "Version database insert error:",
        insertError
      );

      /*
       * Remove uploaded file if database insertion fails.
       */
      await supabase.storage
        .from(PRIVATE_EBOOK_BUCKET)
        .remove([path]);

      /*
       * Restore the most recent previous version.
       */
      const previous =
        existingVersions?.[0];

      if (previous) {
        await supabase
          .from("book_versions")
          .update({
            active: true,
            is_current: true,
          })
          .eq("book_id", bookId)
          .eq(
            "version_number",
            previous.version_number
          );
      }

      return NextResponse.json(
        {
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Keep the main books table pointing to the
     * current EPUB as well.
     */
    const { error: bookUpdateError } = await supabase
      .from("books")
      .update({
        epub_path: path,
      })
      .eq("id", bookId);

    if (bookUpdateError) {
      console.error(
        "Book EPUB path update error:",
        bookUpdateError
      );
    }

    return NextResponse.json({
      ok: true,
      book: {
        id: book.id,
        title: book.title,
      },
      version: newVersion,
      message: `Version ${humanVersion} uploaded successfully.`,
    });
  } catch (error) {
    console.error(
      "Admin version upload error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload the book version.",
      },
      { status: 500 }
    );
  }
}
