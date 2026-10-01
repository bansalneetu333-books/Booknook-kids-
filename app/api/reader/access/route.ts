import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  createEpubSignedUrl,
  getActiveBookVersion,
} from "@/lib/storage";

export const runtime = "nodejs";

const SIGNED_URL_EXPIRES_IN = 300;

type AccessPayload = {
  bookId?: string;
};

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
        { error: "Please log in to read this book." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as AccessPayload;

    const bookId =
      typeof body.bookId === "string"
        ? body.bookId.trim()
        : "";

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    /*
     * Verify that the book exists and is published.
     */
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,title,published")
      .eq("id", bookId)
      .maybeSingle();

    if (bookError) {
      console.error("Reader book lookup error:", bookError);

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
     * Verify that the customer has paid for this book.
     *
     * This follows the same ownership relationship already
     * used by the existing library code:
     * order_items -> orders -> user.
     */
    const { data: purchase, error: purchaseError } =
      await supabase
        .from("order_items")
        .select(
          "id,orders!inner(user_id,payment_status)"
        )
        .eq("book_id", bookId)
        .eq("orders.user_id", user.id)
        .eq("orders.payment_status", "paid")
        .limit(1)
        .maybeSingle();

    if (purchaseError) {
      console.error(
        "Reader ownership lookup error:",
        purchaseError
      );

      return NextResponse.json(
        { error: "Unable to verify your book access." },
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
     * Get the currently active EPUB version.
     */
    const activeVersion =
      await getActiveBookVersion(bookId);

    if (!activeVersion) {
      return NextResponse.json(
        {
          error:
            "This book does not have an active EPUB version yet.",
        },
        { status: 404 }
      );
    }

    const epubPath =
      activeVersion.epub_path;

    if (!epubPath) {
      return NextResponse.json(
        {
          error:
            "The active book version does not have an EPUB file.",
        },
        { status: 404 }
      );
    }

    /*
     * Create a short-lived signed URL.
     *
     * The EPUB bucket remains private.
     * Customers never receive the permanent storage path
     * as a public file URL.
     */
    const epubUrl = await createEpubSignedUrl(
      epubPath,
      SIGNED_URL_EXPIRES_IN
    );

    /*
     * Load the customer's saved reading position.
     */
    const { data: progress, error: progressError } =
      await supabase
        .from("reading_progress")
        .select(
          "location,progress_percentage,last_read_at"
        )
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();

    if (progressError) {
      /*
       * Do not prevent the reader from opening if the
       * progress record cannot be read.
       */
      console.error(
        "Reader progress lookup error:",
        progressError
      );
    }

    return NextResponse.json({
      ok: true,
      epubUrl,
      expiresIn: SIGNED_URL_EXPIRES_IN,
      book: {
        id: book.id,
        title: book.title,
      },
      version: {
        id: activeVersion.id,
        versionNumber: activeVersion.version_number,
      },
      progress: progress
        ? {
            location: progress.location ?? null,
            progress_percentage:
              Number(progress.progress_percentage ?? 0),
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Reader access error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to open the book.",
      },
      { status: 500 }
    );
  }
}
