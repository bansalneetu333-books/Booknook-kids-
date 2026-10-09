import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getReadableBookFile } from "@/lib/storage";

export const runtime = "nodejs";

function normalize(value: string | null | undefined) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function POST() {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { data: books, error } = await supabase
      .from("books")
      .select("id,title,slug,published,is_published,is_free");

    if (error) {
      return NextResponse.json({ error: "Unable to load books." }, { status: 500 });
    }

    const repaired: string[] = [];
    const missingFiles: string[] = [];

    for (const book of books ?? []) {
      const file = await getReadableBookFile(book.id);
      if (!file || !file.path.toLowerCase().endsWith(".epub")) {
        missingFiles.push(book.title);
        continue;
      }

      if (!book.published || !book.is_published) {
        const { error: updateError } = await supabase
          .from("books")
          .update({ published: true, is_published: true, is_free: false })
          .eq("id", book.id);

        if (updateError) {
          console.error("Book availability repair error:", book.id, updateError);
          continue;
        }
      }

      repaired.push(book.title);
    }

    return NextResponse.json({
      ok: true,
      repaired,
      missingFiles,
      message: repaired.length
        ? "Books with EPUB files are published. All books remain paid and use the online reader."
        : "No uploaded book files were found to repair.",
    });
  } catch (error) {
    console.error("Repair book availability error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to repair book availability." },
      { status: 500 }
    );
  }
}
