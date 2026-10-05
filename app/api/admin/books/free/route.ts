import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const { user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const bookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    const isFree = Boolean(body.isFree);

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required." }, { status: 400 });
    }

    const { createAdminClient } = await import("@/lib/admin");
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("books")
      .update({ is_free: isFree, updated_at: new Date().toISOString() })
      .eq("id", bookId)
      .select("id,is_free")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, book: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update free-reading status." },
      { status: 500 }
    );
  }
}
