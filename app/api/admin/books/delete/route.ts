import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

type DeletePayload = {
  bookId?: string;
};

export async function DELETE(request: Request) {
  try {
    const { user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as DeletePayload;
    const bookId =
      typeof body.bookId === "string" ? body.bookId.trim() : "";

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    /*
     * requireAdmin() returns the service-role client for admins.
     * This allows the API to perform the protected cleanup server-side.
     */
    const { supabase } = await requireAdmin();

    // Load the book.
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,title,slug,cover_path,epub_path")
      .eq("id", bookId)
      .maybeSingle();

    if (bookError) {
      console.error("Delete book lookup error:", bookError);

      return NextResponse.json(
        { error: "Unable to find the book." },
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
     * Do not delete a book that has already been purchased.
     * This protects the purchase history and existing customer access.
     */
    const { data: purchasedItems, error: purchaseError } =
      await supabase
        .from("order_items")
        .select(
          `
          id,
          orders!inner(
            id,
            payment_status
          )
        `
        )
        .eq("book_id", bookId)
        .eq("orders.payment_status", "paid")
        .limit(1);

    if (purchaseError) {
      console.error(
        "Delete book purchase check error:",
        purchaseError
      );

      return NextResponse.json(
        { error: "Unable to verify the book's purchase history." },
        { status: 500 }
      );
    }

    if (purchasedItems && purchasedItems.length > 0) {
      return NextResponse.json(
        {
          error:
            "This book cannot be deleted because it has already been purchased. Unpublish it instead.",
        },
        { status: 409 }
      );
    }

    /*
     * Collect version file paths before deleting database rows.
     */
    const { data: versions, error: versionsError } = await supabase
      .from("book_versions")
      .select("file_path,epub_path")
      .eq("book_id", bookId);

    if (versionsError) {
      console.error(
        "Delete book versions lookup error:",
        versionsError
      );

      return NextResponse.json(
        { error: "Unable to load book files." },
        { status: 500 }
      );
    }

    const ebookPaths = new Set<string>();

    for (const version of versions ?? []) {
      if (version.file_path) {
        ebookPaths.add(version.file_path);
      }

      if (version.epub_path) {
        ebookPaths.add(version.epub_path);
      }
    }

    if (book.epub_path) {
      ebookPaths.add(book.epub_path);
    }

    /*
     * Remove public cover from storage.
     */
    if (book.cover_path) {
      const { error: coverStorageError } = await supabase.storage
        .from("book-covers")
        .remove([book.cover_path]);

      if (coverStorageError) {
        console.warn(
          "Could not remove book cover:",
          coverStorageError
        );
      }
    }

    /*
     * Remove EPUB/PDF files from private storage.
     */
    if (ebookPaths.size > 0) {
      const { error: ebookStorageError } = await supabase.storage
        .from("ebooks-private")
        .remove(Array.from(ebookPaths));

      if (ebookStorageError) {
        console.warn(
          "Could not remove ebook files:",
          ebookStorageError
        );
      }
    }

    /*
     * Remove related records that do not represent purchases.
     */
    const { error: progressError } = await supabase
      .from("reading_progress")
      .delete()
      .eq("book_id", bookId);

    if (progressError) {
      console.warn(
        "Could not remove reading progress:",
        progressError
      );
    }

    const { error: wishlistError } = await supabase
      .from("wishlists")
      .delete()
      .eq("book_id", bookId);

    if (wishlistError) {
      console.warn(
        "Could not remove wishlist records:",
        wishlistError
      );
    }

    /*
     * Delete book versions.
     */
    const { error: versionDeleteError } = await supabase
      .from("book_versions")
      .delete()
      .eq("book_id", bookId);

    if (versionDeleteError) {
      console.error(
        "Delete book versions error:",
        versionDeleteError
      );

      return NextResponse.json(
        { error: "Unable to delete book versions." },
        { status: 500 }
      );
    }

    /*
     * Finally delete the book itself.
     */
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .eq("id", bookId);

    if (deleteError) {
      console.error("Delete book error:", deleteError);

      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `"${book.title}" was deleted successfully.`,
      bookId,
    });
  } catch (error) {
    console.error("Admin delete book API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete the book.",
      },
      { status: 500 }
    );
  }
}
