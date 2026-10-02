import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createEpubSignedUrl,
  getActiveBookVersion,
  publicCoverUrl,
} from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to read this book." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const bookId = url.searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    /*
     * Verify that the logged-in customer has actually
     * purchased this book.
     */
    const { data: ownership, error: ownershipError } =
      await supabase
        .from("order_items")
        .select(
          "id, book_id, orders!inner(user_id, status)"
        )
        .eq("book_id", bookId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "paid")
        .limit(1)
        .maybeSingle();

    if (ownershipError) {
      console.error(
        "Reader ownership lookup error:",
        ownershipError
      );

      return NextResponse.json(
        { error: "Unable to verify book ownership." },
        { status: 500 }
      );
    }

    if (!ownership) {
      return NextResponse.json(
        {
          error:
            "You do not own this book. Please purchase it first.",
        },
        { status: 403 }
      );
    }

    /*
     * Load the book.
     */
    const { data: book, error: bookError } =
      await supabase
        .from("books")
        .select(
          "id,title,slug,author,description,cover_path,published"
        )
        .eq("id", bookId)
        .eq("published", true)
        .maybeSingle();

    if (bookError) {
      console.error(
        "Reader book lookup error:",
        bookError
      );

      return NextResponse.json(
        { error: "Unable to load the book." },
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
     * Load the active EPUB version.
     */
    const version = await getActiveBookVersion(bookId);

    if (!version) {
      return NextResponse.json(
        {
          error:
            "This book does not currently have a readable version.",
        },
        { status: 404 }
      );
    }

    const epubPath =
      version.epub_path || version.file_path;

    if (!epubPath) {
      return NextResponse.json(
        {
          error:
            "The readable book file is not available.",
        },
        { status: 404 }
      );
    }

    /*
     * Create a short-lived signed URL.
     * The private ebook file itself is never made public.
     */
    const epubUrl =
      await createEpubSignedUrl(epubPath, 300);

    /*
     * Load saved reading progress.
     */
    const { data: progress, error: progressError } =
      await supabase
        .from("reading_progress")
        .select(
          "book_id,location,progress_percentage,last_read_at"
        )
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();

    if (progressError) {
      console.error(
        "Reader progress lookup error:",
        progressError
      );
    }

    return NextResponse.json({
      success: true,

      book: {
        id: book.id,
        title: book.title,
        slug: book.slug,
        author: book.author,
        description: book.description,
        coverUrl: publicCoverUrl(book.cover_path),
      },

      version: {
        id: version.id,
        versionNumber: version.version_number,
        fileType: version.file_type,
        fileSize: version.file_size,
      },

      epubUrl,

      progress: progress
        ? {
            location: progress.location,
            progressPercentage:
              progress.progress_percentage,
            lastReadAt: progress.last_read_at,
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
