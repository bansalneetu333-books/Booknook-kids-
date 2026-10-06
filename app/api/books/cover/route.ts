import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path")?.trim();

  if (!path) {
    return new NextResponse("Missing cover path.", { status: 400 });
  }

  if (path.includes("..") || path.startsWith("/")) {
    return new NextResponse("Invalid cover path.", { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from("book-covers")
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) {
      console.error("Cover signed URL error:", error);
      return new NextResponse("Cover not found.", { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl, 302);
  } catch (error) {
    console.error("Cover route error:", error);
    return new NextResponse("Unable to load cover.", { status: 500 });
  }
}
