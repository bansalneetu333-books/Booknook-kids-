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

/*
 * GET
 * Load all versions belonging to one book.
 */
export async function GET(request: Request) {
  try {
    const { supabase, user, isAdmin } =
      await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);

    const bookId =
      url.searchParams
        .get("bookId")
        ?.trim() ?? "";

    if (!bookId) {
      return NextResponse.json(
        {
          error: "Book ID is required.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("book_versions")
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
          created_at,
          uploaded_at
        `
      )
      .eq("book_id", bookId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Unable to load book versions:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load book versions.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      versions: data ?? [],
    });
  } catch (error) {
    console.error(
      "Admin version GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load book versions.",
      },
      { status: 500 }
    );
  }
}

/*
 * POST
 * Upload a new EPUB version.
 *
 * IMPORTANT:
 * A newly uploaded version is NOT made active.
 * The administrator must explicitly choose
 * "Make Active".
 */
export async function POST(request: Request) {
  try {
    const {
      supabase,
      user,
      isAdmin,
    } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const formData =
      await request.formData();

    const bookIdValue =
      formData.get("bookId");

    const versionValue =
      formData.get("version");

    const epubValue =
      formData.get("epub");

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
        {
          error: "Book ID is required.",
        },
        { status: 400 }
      );
    }

    if (!version) {
      return NextResponse.json(
        {
          error: "Version is required.",
        },
        { status: 400 }
      );
    }

    if (!(epubValue instanceof File)) {
      return NextResponse.json(
        {
          error: "EPUB file is required.",
        },
        { status: 400 }
      );
    }

    if (epubValue.size <= 0) {
      return NextResponse.json(
        {
          error:
            "The EPUB file is empty.",
        },
        { status: 400 }
      );
    }

    if (
      epubValue.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "EPUB files must be 50 MB or smaller.",
        },
        { status: 400 }
      );
    }

    const fileName =
      epubValue.name.toLowerCase();

    if (!fileName.endsWith(".epub")) {
      return NextResponse.json(
        {
          error:
            "Only EPUB files are allowed.",
        },
        { status: 400 }
      );
    }

    /*
     * Verify that the book exists.
     */
    const { data: book, error: bookError } =
      await supabase
        .from("books")
        .select(
          "id,slug,title"
        )
        .eq("id", bookId)
        .maybeSingle();

    if (bookError) {
      console.error(
        "Book lookup error:",
        bookError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the book.",
        },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        {
          error: "Book not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Check whether this exact version
     * already exists for the book.
     */
    const { data: duplicateVersion } =
      await supabase
        .from("book_versions")
        .select("id")
        .eq("book_id", bookId)
        .eq("version", version)
        .maybeSingle();

    if (duplicateVersion) {
      return NextResponse.json(
        {
          error:
            `Version "${version}" already exists for this book.`,
        },
        { status: 409 }
      );
    }

    const safeSlug = cleanPart(
      book.slug || book.id
    );

    const safeVersion =
      cleanPart(version);

    const path =
      `${safeSlug}/v${safeVersion}/epub.epub`;

    /*
     * Upload using the server-side
     * Supabase client returned by requireAdmin.
     */
    const fileBuffer = Buffer.from(
      await epubValue.arrayBuffer()
    );

    const {
      error: uploadError,
    } = await supabase.storage
      .from(
        PRIVATE_EBOOK_BUCKET
      )
      .upload(
        path,
        fileBuffer,
        {
          contentType:
            "application/epub+zip",
          upsert: false,
        }
      );

    if (uploadError) {
      console.error(
        "EPUB upload error:",
        uploadError
      );

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
     * Determine the next numeric version
     * for version_number.
     */
    const {
      data: existingVersions,
      error:
        existingVersionsError,
    } = await supabase
      .from("book_versions")
      .select(
        "version_number,created_at"
      )
      .eq("book_id", bookId)
      .order("created_at", {
        ascending: false,
      })
      .limit(100);

    if (existingVersionsError) {
      console.error(
        "Existing version lookup error:",
        existingVersionsError
      );

      await supabase.storage
        .from(
          PRIVATE_EBOOK_BUCKET
        )
        .remove([path]);

      return NextResponse.json(
        {
          error:
            "Unable to determine the book version number.",
        },
        { status: 500 }
      );
    }

    let nextVersion = 1;

    for (
      const item of
        existingVersions ?? []
    ) {
      const number =
        Number(
          item.version_number
        );

      if (
        Number.isFinite(number)
      ) {
        nextVersion =
          Math.max(
            nextVersion,
            Math.floor(number) +
              1
          );
      }
    }

    const humanVersion =
      `${nextVersion}.0`;

    /*
     * IMPORTANT:
     *
     * The new version starts inactive.
     *
     * The administrator must explicitly
     * click "Make Active".
     */
    const {
      data: newVersion,
      error: insertError,
    } = await supabase
      .from("book_versions")
      .insert({
        book_id: bookId,
        version,
        version_number:
          humanVersion,
        file_path: path,
        epub_path: path,
        file_type:
          "application/epub+zip",
        file_size:
          epubValue.size,
        is_current: false,
        active: false,
        uploaded_at:
          new Date().toISOString(),
      })
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
          created_at,
          uploaded_at
        `
      )
      .single();

    if (insertError) {
      console.error(
        "Version database insert error:",
        insertError
      );

      await supabase.storage
        .from(
          PRIVATE_EBOOK_BUCKET
        )
        .remove([path]);

      return NextResponse.json(
        {
          error:
            insertError.message ||
            "Unable to save the book version.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,

        book: {
          id: book.id,
          title: book.title,
        },

        version: newVersion,

        message:
          `Version ${version} uploaded successfully. It is not active yet.`,
      },
      { status: 201 }
    );
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
