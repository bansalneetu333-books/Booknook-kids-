import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("id,slug,title,cover_path");

    if (booksError) throw booksError;

    let repaired = 0;
    const checked: string[] = [];

    for (const book of books ?? []) {
      if (book.cover_path) continue;

      const slug = String(book.slug || "").trim();
      if (!slug) continue;

      const { data: files, error: listError } = await supabase.storage
        .from("book-covers")
        .list(slug, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (listError) {
        console.error("Cover repair list error:", slug, listError);
        continue;
      }

      const cover = (files ?? []).find((file) => /^cover-/i.test(file.name));
      if (!cover) continue;

      const coverPath = slug + "/" + cover.name;

      const { error: updateError } = await supabase
        .from("books")
        .update({ cover_path: coverPath })
        .eq("id", book.id);

      if (updateError) {
        console.error("Cover repair update error:", book.id, updateError);
        continue;
      }

      repaired += 1;
      checked.push(book.title);
    }

    return NextResponse.json({
      ok: true,
      repaired,
      books: checked,
      message:
        repaired > 0
          ? "Repaired " + repaired + " book cover(s)."
          : "No missing cover files were found in Supabase Storage.",
    });
  } catch (error) {
    console.error("Repair covers error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to repair covers.",
      },
      { status: 500 }
    );
  }
}
