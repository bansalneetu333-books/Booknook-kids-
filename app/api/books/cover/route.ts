import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";

function isImage(name: string) {
  return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(name);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedPath = params.get("path")?.trim() || "";
  const slug = params.get("slug")?.trim() || "";

  if (!requestedPath && !slug) return new NextResponse("Missing cover path.", { status: 400 });
  if (requestedPath && (requestedPath.includes("..") || requestedPath.startsWith("/"))) {
    return new NextResponse("Invalid cover path.", { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // First try the exact storage path supplied by the book record.
    if (requestedPath) {
      const { data } = await supabase.storage.from("book-covers").createSignedUrl(requestedPath, 3600);
      if (data?.signedUrl) return NextResponse.redirect(data.signedUrl, 302);
    }

    if (slug) {
      // Resolve the current record first so covers stored outside a slug folder work too.
      const { data: book } = await supabase.from("books")
        .select("cover_url,cover_path")
        .eq("slug", slug)
        .maybeSingle();

      if (book?.cover_path) {
        const { data } = await supabase.storage.from("book-covers").createSignedUrl(book.cover_path, 3600);
        if (data?.signedUrl) return NextResponse.redirect(data.signedUrl, 302);
      }

      if (book?.cover_url && /^https?:\/\//i.test(book.cover_url)) {
        return NextResponse.redirect(book.cover_url, 302);
      }

      // Legacy uploads may be stored inside a folder named after the book slug.
      const { data: files } = await supabase.storage.from("book-covers").list(slug, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
      const cover = (files ?? []).find((file) => isImage(String(file.name || "")));
      if (cover) {
        const { data } = await supabase.storage.from("book-covers")
          .createSignedUrl(slug + "/" + cover.name, 3600);
        if (data?.signedUrl) return NextResponse.redirect(data.signedUrl, 302);
      }
    }

    return new NextResponse("Cover not found.", { status: 404 });
  } catch (error) {
    console.error("Cover route error:", error);
    return new NextResponse("Unable to load cover.", { status: 500 });
  }
}
