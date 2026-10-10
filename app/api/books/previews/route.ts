import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";

const IMAGE_FILE = /\.(jpg|jpeg|png|webp|avif)$/i;

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim() || "";
  if (!slug || slug.includes("..") || slug.startsWith("/")) {
    return NextResponse.json({ previews: [] }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("book-covers")
      .list(slug + "/previews", { limit: 10, sortBy: { column: "name", order: "asc" } });

    if (error) {
      if (/not found|does not exist/i.test(error.message)) return NextResponse.json({ previews: [] });
      console.error("Preview listing error:", error);
      return NextResponse.json({ error: "Could not load sample pages." }, { status: 500 });
    }

    const previews = await Promise.all((data ?? [])
      .filter(file => IMAGE_FILE.test(file.name || ""))
      .slice(0, 5)
      .map(async file => {
        const path = slug + "/previews/" + file.name;
        const { data: signed } = await supabase.storage.from("book-covers").createSignedUrl(path, 3600);
        return signed?.signedUrl ? { name: file.name, url: signed.signedUrl } : null;
      }));

    return NextResponse.json({ previews: previews.filter(Boolean) }, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" }
    });
  } catch (error) {
    console.error("Preview route error:", error);
    return NextResponse.json({ error: "Could not load sample pages." }, { status: 500 });
  }
}
