import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createEpubSignedUrl } from "@/lib/storage";

export const runtime = "nodejs";

const SIGNED_URL_EXPIRES_IN = 300;

type DownloadPayload = {
  bookId?: string;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    /*
     * Require a logged-in customer.
     */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to download this book." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as DownloadPayload;
    const bookId = cleanString(body.bookId);

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    /*
     * Verify the book exists and is published.
     */
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,title,published")
      .eq("id", bookId)
      .maybeSingle();

    if (bookError) {
      console.error("Download book lookup error:", bookError);

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

    if (!book.published) {
      return NextResponse.json(
        { error: "This book is not currently available." },
        { status: 404 }
      );
    }

    /*
     * Verify that the customer has purchased the book.
     */
    const { data: purchase, error: purchaseError } =
      await supabase
        .from("order_items")
        .select(
          "id,orders!inner(user_id,status)"
        )
        .eq("book_id", bookId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "paid")
        .limit(1)
        .maybeSingle();

    if (purchaseError) {
      console.error(
        "Download ownership lookup error:",
        purchaseError
      );

      return NextResponse.json(
        {
          error: "Unable to verify your book access.",
        },
        { status: 500 }
      );
    }

    if (!purchase) {
      return NextResponse.json(
        {
          error:
            "You do not own this book. Please purchase it first.",
        },
        { status: 403 }
      );
    }

    /*
     * Find the currently active EPUB version.
     */
    const { data: activeVersion, error: versionError } =
      await supabase
        .from("book_versions")
        .select(
          "id,version_number,epub_path,file_path,file_size,file_type,active"
        )
        .eq("book_id", bookId)
        .eq("active", true)
        .maybeSingle();

    if (versionError) {
      console.error(
        "Download version lookup error:",
        versionError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find the current book version.",
        },
        { status: 500 }
      );
    }

    if (!activeVersion) {
      return NextResponse.json(
        {
          error:
            "This book does not have an active version yet.",
        },
        { status: 404 }
      );
    }

    /*
     * Prefer epub_path, then fall back to file_path
     * for compatibility with older book versions.
     */
    const filePath =
      activeVersion.epub_path ||
      activeVersion.file_path ||
      null;

    if (!filePath) {
      return NextResponse.json(
        {
          error:
            "The current book version does not have a downloadable file.",
        },
        { status: 404 }
      );
    }

    /*
     * Generate a short-lived private signed URL.
     */
    const downloadUrl = await createEpubSignedUrl(
      filePath,
      SIGNED_URL_EXPIRES_IN
    );

    return NextResponse.json({
      ok: true,
      downloadUrl,
      expiresIn: SIGNED_URL_EXPIRES_IN,
      fileName: `${book.title
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "book"}${activeVersion.file_type === "application/pdf" ? ".pdf" : ".epub"}`,
      version: activeVersion.version_number,
      fileSize: activeVersion.file_size,
    });
  } catch (error) {
    console.error(
      "Book download API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to prepare the book download.",
      },
      { status: 500 }
    );
  }
}
