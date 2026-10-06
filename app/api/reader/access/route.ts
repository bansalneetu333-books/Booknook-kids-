import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReadableBookFile, createEpubSignedUrl } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    if (!bookId) return NextResponse.json({ error: "Book ID is required." }, { status: 400 });

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,title,published,is_free")
      .eq("id", bookId)
      .eq("published", true)
      .maybeSingle();

    if (bookError) return NextResponse.json({ error: "Unable to verify book." }, { status: 500 });
    if (!book) return NextResponse.json({ error: "Book is not available." }, { status: 404 });

    if (!book.is_free) {
      const { data: purchase, error: purchaseError } = await supabase
        .from("order_items")
        .select("id,orders!inner(id,user_id,status)")
        .eq("book_id", bookId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "paid")
        .limit(1)
        .maybeSingle();

      if (purchaseError) {
        console.error("Reader ownership check failed:", purchaseError);
        return NextResponse.json({ error: "Unable to verify book ownership." }, { status: 500 });
      }
      if (!purchase) return NextResponse.json({ error: "You need to purchase this book before reading it." }, { status: 403 });
    }

    const file = await getReadableBookFile(bookId);
    if (!file) return NextResponse.json({ error: "No EPUB file is attached to this book." }, { status: 404 });

    const url = await createEpubSignedUrl(file.path, 60 * 60);
    return NextResponse.json({
      url,
      fileType: file.fileType,
      expiresIn: 60 * 60,
      version: file.version,
    });
  } catch (error) {
    console.error("Reader access error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open this book." }, { status: 500 });
  }
}
