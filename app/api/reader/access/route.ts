import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveBookVersion,
  createEpubSignedUrl
} from "@/lib/storage";

const schema = z.object({
  bookId: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const supabase = await createClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: book } = await supabase
      .from("books")
      .select("id,title,slug,published")
      .eq("id", body.bookId)
      .eq("published", true)
      .maybeSingle();

    if (!book) {
      return NextResponse.json(
        { error: "Book unavailable" },
        { status: 404 }
      );
    }

    const { data: ownership } = await supabase
      .from("order_items")
      .select("id,orders!inner(user_id,payment_status)")
      .eq("book_id", body.bookId)
      .eq("orders.user_id", user.id)
      .eq("orders.payment_status", "paid")
      .limit(1)
      .maybeSingle();

    if (!ownership) {
      return NextResponse.json(
        { error: "You don't have access to this book." },
        { status: 403 }
      );
    }

    const version = await getActiveBookVersion(body.bookId);

    if (!version) {
      return NextResponse.json(
        { error: "This book is temporarily unavailable." },
        { status: 503 }
      );
    }

    const signedUrl = await createEpubSignedUrl(
      version.epub_path,
      3600
    );

    const { data: progress } = await supabase
      .from("reading_progress")
      .select(
        "location,progress_percentage,last_read_at"
      )
      .eq("user_id", user.id)
      .eq("book_id", body.bookId)
      .maybeSingle();

    return NextResponse.json({
      book: {
        id: book.id,
        title: book.title,
        slug: book.slug
      },
      version: {
        id: version.id,
        versionNumber: version.version_number
      },
      epubUrl: signedUrl,
      expiresIn: 3600,
      progress: progress ?? null
    });
  } catch (error) {
    console.error("reader access error", error);

    return NextResponse.json(
      { error: "Unable to open this book." },
      { status: 500 }
    );
  }
}
