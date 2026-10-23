import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, requireAdmin } from "@/lib/admin";
import { getReadableBookFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bookId = (url.searchParams.get("bookId") || "").trim();
    const preview = url.searchParams.get("preview") === "true";

    if (!bookId) return jsonError("Book ID is required.", 400);

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return jsonError("Authentication required.", 401);

    const adminCheck = preview ? await requireAdmin() : null;
    if (preview && (!adminCheck?.user || !adminCheck.isAdmin)) {
      return jsonError("Admin preview access required.", 403);
    }

    const bookClient = preview ? createAdminClient() : supabase;
    const { data: book, error: bookError } = await bookClient
      .from("books")
      .select("id,title,slug,published,is_published,is_free")
      .eq("id", bookId)
      .maybeSingle();

    if (bookError) {
      console.error("Reader file book lookup failed:", bookError);
      return jsonError("Unable to verify book access.", 500);
    }
    if (!book) return jsonError("Book is not available.", 404);

    const isPublished = book.published === true || book.is_published === true;
    if (!preview && !isPublished) return jsonError("Book is not available.", 404);

    if (!preview && book.is_free !== true) {
      const { data: purchase, error: purchaseError } = await supabase
        .from("order_items")
        .select("id,orders!inner(id,user_id,status)")
        .eq("book_id", bookId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "paid")
        .limit(1)
        .maybeSingle();

      if (purchaseError) {
        console.error("Reader file ownership check failed:", purchaseError);
        return jsonError("Unable to verify book ownership.", 500);
      }
      if (!purchase) {
        return jsonError("You need to purchase this book before reading it.", 403);
      }
    }

    const file = await getReadableBookFile(bookId);
    if (!file) return jsonError("No EPUB file is attached to this book.", 404);

    const admin = createAdminClient();
    const { data: blob, error: downloadError } = await admin.storage
      .from(file.bucket)
      .download(file.path);

    if (downloadError || !blob) {
      console.error("Private ebook download failed:", {
        bookId,
        bucket: file.bucket,
        path: file.path,
        message: downloadError?.message,
      });
      return jsonError("The book file could not be downloaded from storage.", 502);
    }

    const safeFileName = (file.path.split("/").pop() || "book.epub").replace(/[\r\n"]/g, "");
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": file.fileType || "application/epub+zip",
        "Content-Length": String(blob.size),
        "Content-Disposition": `inline; filename="${safeFileName}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Reader file route error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Unable to load the book file.",
      500
    );
  }
}
