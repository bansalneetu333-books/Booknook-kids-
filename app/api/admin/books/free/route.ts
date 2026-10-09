import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function PATCH() {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  return NextResponse.json({ error: "Free-reading mode has been retired. All books use purchase access and online reading." }, { status: 410 });
}
