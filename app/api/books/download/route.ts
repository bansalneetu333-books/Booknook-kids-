import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createEpubSignedUrl, getReadableBookFile } from "@/lib/storage";

export const runtime = "nodejs";
const SIGNED_URL_EXPIRES_IN = 300;

type DownloadPayload = { bookId?: string };
function cleanString(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in to download this book." }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as DownloadPayload;
    const bookId = cleanString(body.bookId);
    if (!bookId) return NextResponse.json({ error: "Book ID is required." }, { status: 400 });

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,title,published,is_published,is_free")
      .eq("id", bookId)
      .maybeSingle();

    if (bookError) return NextResponse.json({ error: "Unable to verify the book." }, { status: 500 });
    if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
    if (!book.published && !book.is_published) return NextResponse.json({ error: "This book is not currently available." }, { status: 404 });

    if (!book.is_free) {
      const { data: purchase, error: purchaseError } = await supabase
        .from("order_items")
        .select("id,orders!inner(user_id,status)")
        .eq("book_id", bookId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "paid")
        .limit(1)
        .maybeSingle();

      if (purchaseError) return NextResponse.json({ error: "Unable to verify your book access." }, { status: 500 });
      if (!purchase) return NextResponse.json({ error: "You do not own this book. Please purchase it first." }, { status: 403 });
    }

    const file = await getReadableBookFile(bookId);
    if (!file) return NextResponse.json({ error: "This book does not have a downloadable file yet." }, { status: 404 });

    const downloadUrl = await createEpubSignedUrl(file.path, SIGNED_URL_EXPIRES_IN);
    const safeTitle = book.title.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "book";
    const extension = file.fileType === "application/pdf" ? ".pdf" : ".epub";

    return NextResponse.json({
      ok: true,
      downloadUrl,
      expiresIn: SIGNED_URL_EXPIRES_IN,
      fileName: `${safeTitle}${extension}`,
      version: file.version,
      fileSize: file.fileSize,
    });
  } catch (error) {
    console.error("Book download API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to prepare the book download." }, { status: 500 });
  }
}
