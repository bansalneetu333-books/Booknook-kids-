import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";

function isImage(name: string) {
  return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(name);
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const requestedPath = searchParams.get("path")?.trim() || "";
  const slug = searchParams.get("slug")?.trim() || "";

  if (!requestedPath && !slug) {
    return new NextResponse("Missing cover path.", { status: 400 });
  }

  if (requestedPath && (requestedPath.includes("..") || requestedPath.startsWith("/"))) {
    return new NextResponse("Invalid cover path.", { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    let path = requestedPath;

    if (path) {
      const { data, error } = await supabase.storage
        .from("book-covers")
        .createSignedUrl(path, 3600);

      if (!error && data?.signedUrl) {
        return NextResponse.redirect(data.signedUrl, 302);
      }
    }

    // Older uploads sometimes have a missing/incorrect cover_path.
    // Resolve the cover from the book slug as a reliable fallback.
    if (slug) {
      const { data: files } = await supabase.storage
        .from("book-covers")
        .list(slug, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      const cover = (files ?? []).find((file) => isImage(String(file.name || "")));

      if (cover) {
        const resolvedPath = slug + "/" + cover.name;
        const { data, error } = await supabase.storage
          .from("book-covers")
          .createSignedUrl(resolvedPath, 3600);

        if (!error && data?.signedUrl) {
          return NextResponse.redirect(data.signedUrl, 302);
        }
      }

      const { data: book } = await supabase
        .from("books")
        .select("cover_url,cover_path")
        .eq("slug", slug)
        .maybeSingle();

      const coverUrl = book?.cover_url || "";
      if (coverUrl) {
        return NextResponse.redirect(coverUrl, 302);
      }

      if (!path && book?.cover_path) {
        const { data, error } = await supabase.storage
          .from("book-covers")
          .createSignedUrl(book.cover_path, 3600);

        if (!error && data?.signedUrl) {
          return NextResponse.redirect(data.signedUrl, 302);
        }
      }
    }

    return new NextResponse("Cover not found.", { status: 404 });
  } catch (error) {
    console.error("Cover route error:", error);
    return new NextResponse("Unable to load cover.", { status: 500 });
  }
}
