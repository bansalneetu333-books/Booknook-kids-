import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBookVersion } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const bookId = new URL(request.url).searchParams.get(
      "bookId"
    );

    if (!bookId) {
      return NextResponse.json(
        { error: "bookId is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const { data: ownership } = await supabase
      .from("order_items")
      .select(
        "order_id,orders!inner(user_id,payment_status)"
      )
      .eq("book_id", bookId)
      .eq("orders.user_id", user.id)
      .eq("orders.payment_status", "paid")
      .limit(1)
      .maybeSingle();

    if (!ownership) {
      return NextResponse.json(
        { error: "Purchase required." },
        { status: 403 }
      );
    }

    const version = await getActiveBookVersion(bookId);

    if (!version) {
      return NextResponse.json(
        { error: "Book file unavailable." },
        { status: 404 }
      );
    }

    const pdfPath = version.epub_path.replace(
      /book\.epub$/i,
      "book.pdf"
    );

    if (pdfPath === version.epub_path) {
      return NextResponse.json(
        {
          error:
            "PDF is not available for this book."
        },
        { status: 404 }
      );
    }

    const { data: book } = await supabase
      .from("books")
      .select("title")
      .eq("id", bookId)
      .maybeSingle();

    const filename =
      `${(book?.title ?? "book")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "book"}.pdf`;

    const admin = createAdminClient();

    const {
      data: signed,
      error
    } = await admin.storage
      .from("ebooks-private")
      .createSignedUrl(
        pdfPath,
        3600,
        { download: filename }
      );

    if (error || !signed?.signedUrl) {
      return NextResponse.json(
        {
          error:
            "PDF is not available for this book."
        },
        { status: 404 }
      );
    }

    return NextResponse.redirect(
      signed.signedUrl
    );
  } catch (error) {
    console.error(
      "pdf download error",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to prepare download."
      },
      { status: 500 }
    );
  }
}
