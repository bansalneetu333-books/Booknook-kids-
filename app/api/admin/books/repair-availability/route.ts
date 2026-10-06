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
    const freeMarked: string[] = [];
    const missingFiles: string[] = [];

    for (const book of books ?? []) {
      const normalizedTitle = normalize(book.title);
      const shouldBeFree =
        normalizedTitle === "door 2050" ||
        normalizedTitle === "rani laxmi bai" ||
        normalizedTitle === "rani lakshmi bai" ||
        normalizedTitle === "rani laxmi bai" ||
        normalizedTitle === "rani lakshmi bai";

      const file = await getReadableBookFile(book.id);

      if (!file && !shouldBeFree) {
        missingFiles.push(book.title);
        continue;
      }
      const update: Record<string, unknown> = {
        published: true,
        is_published: true,
      };

      if (shouldBeFree) {
        update.is_free = true;
        freeMarked.push(book.title);
      }

      if (!book.published || !book.is_published || shouldBeFree) {
        const { error: updateError } = await supabase
          .from("books")
          .update(update)
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
      freeMarked,
      missingFiles,
      message: repaired.length
        ? "Existing uploaded books with files are now available on the website."
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
