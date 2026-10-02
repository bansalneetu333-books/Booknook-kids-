import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", requestUrl.origin)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.message)}`,
        requestUrl.origin
      )
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=session_not_found", requestUrl.origin)
    );
  }

  const adminEmail = "bansalneetu333@gmail.com";

  const isAdmin =
    user.email?.trim().toLowerCase() === adminEmail.toLowerCase();

  if (isAdmin) {
    return NextResponse.redirect(
      new URL("/admin", requestUrl.origin)
    );
  }

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/library";

  return NextResponse.redirect(
    new URL(safeNext, requestUrl.origin)
  );
}
