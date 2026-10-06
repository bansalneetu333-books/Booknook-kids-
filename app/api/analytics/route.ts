import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "book_view",
  "free_reading_open",
  "reader_open",
  "wishlist_add",
  "wishlist_remove",
]);

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const eventType =
      typeof body?.eventType === "string"
        ? body.eventType.trim()
        : "";

    if (!ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json({ error: "Unsupported analytics event." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const bookId =
      typeof body?.bookId === "string" && body.bookId.trim()
        ? body.bookId.trim()
        : null;

    if (bookId) {
      const { data: book, error: bookError } = await supabase
        .from("books")
        .select("id")
        .eq("id", bookId)
        .eq("published", true)
        .maybeSingle();

      if (bookError) {
        return NextResponse.json({ error: "Unable to validate book." }, { status: 500 });
      }

      if (!book) {
        return NextResponse.json({ error: "Book not found." }, { status: 404 });
      }
    }

    const rawMetadata =
      body?.metadata && typeof body.metadata === "object"
        ? body.metadata
        : {};

    const metadata: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(rawMetadata)) {
      if (
        typeof key === "string" &&
        key.length <= 50 &&
        (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
      ) {
        metadata[key] = value;
      }
    }

    const { error } = await supabase.from("analytics_events").insert({
      event_type: eventType,
      user_id: user?.id ?? null,
      book_id: bookId,
      metadata,
    });

    if (error) {
      console.error("Analytics event insert error:", error);
      return NextResponse.json({ error: "Unable to record analytics event." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Unable to record analytics event." }, { status: 500 });
  }
}
