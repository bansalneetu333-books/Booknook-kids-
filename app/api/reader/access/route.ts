import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/admin";

const EPUB_BUCKET = "ebooks-private";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const bookId =
      typeof body.bookId === "string"
        ? body.bookId.trim()
        : "";

    if (!bookId) {
      return NextResponse.json(
        {
          error: "Book ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Verify that the customer has actually
     * purchased this book.
     */
    const { data: purchase, error: purchaseError } =
      await supabase
        .from("order_items")
        .select(
          `
            id,
            orders!inner (
              id,
              user_id,
              status
            )
          `
        )
        .eq("book_id", bookId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "paid")
        .limit(1)
        .maybeSingle();

    if (purchaseError) {
      console.error(
        "Reader ownership check failed:",
        purchaseError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify book ownership.",
        },
        { status: 500 }
      );
    }

    if (!purchase) {
      return NextResponse.json(
        {
          error:
            "You need to purchase this book before reading it.",
        },
        { status: 403 }
      );
    }

    /*
     * Read the active book version using the
     * server-only Supabase service role.
     */
    const admin = createAdminClient();

    const { data: version, error: versionError } =
      await admin
        .from("book_versions")
        .select(
          `
            id,
            book_id,
            file_path,
            epub_path,
            file_type,
            is_current,
            active
          `
        )
        .eq("book_id", bookId)
        .eq("is_current", true)
        .eq("active", true)
        .maybeSingle();

    if (versionError) {
      console.error(
        "Unable to find active book version:",
        versionError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find the book file.",
        },
        { status: 500 }
      );
    }

    if (!version) {
      return NextResponse.json(
        {
          error:
            "No active version is available for this book.",
        },
        { status: 404 }
      );
    }

    /*
     * Prefer epub_path. Fall back to file_path
     * for versions created by the earlier upload
     * flow.
     */
    const filePath =
      version.epub_path ||
      version.file_path;

    if (!filePath) {
      return NextResponse.json(
        {
          error:
            "No EPUB file is attached to this book.",
        },
        { status: 404 }
      );
    }

    /*
     * Prevent accidental use of another storage
     * bucket through a stored path.
     */
    const normalizedPath =
      filePath.startsWith("/")
        ? filePath.slice(1)
        : filePath;

    const { data: signedUrl, error: signError } =
      await admin.storage
        .from(EPUB_BUCKET)
        .createSignedUrl(
          normalizedPath,
          60 * 60
        );

    if (signError || !signedUrl?.signedUrl) {
      console.error(
        "Unable to create EPUB signed URL:",
        signError
      );

      return NextResponse.json(
        {
          error:
            "Unable to open the book file.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signedUrl.signedUrl,
      fileType: version.file_type || "application/epub+zip",
      expiresIn: 60 * 60,
    });
  } catch (error) {
    console.error(
      "Reader access error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to open this book.",
      },
      { status: 500 }
    );
  }
}
