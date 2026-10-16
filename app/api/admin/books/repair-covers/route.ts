import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";
const BUCKET = "book-covers";
const isImage = (name: string) => /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(name);
const safePart = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function objectExists(supabase: any, path: string) {
  if (!path || path.includes("..")) return false;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  return !error && Boolean(data?.signedUrl);
}

export async function POST() {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();
    if (!user || !isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const { data: books, error: booksError } = await supabase.from("books").select("id,slug,title,cover_path,cover_url");
    if (booksError) throw booksError;
    const { data: rootFiles, error: rootError } = await supabase.storage.from(BUCKET).list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    if (rootError) throw rootError;

    let repaired = 0;
    let unchanged = 0;
    const repairedTitles: string[] = [];
    const unresolvedTitles: string[] = [];

    for (const book of books ?? []) {
      const slug = String(book.slug || "").trim();
      const titleKey = safePart(String(book.title || ""));
      if (book.cover_path && await objectExists(supabase, book.cover_path)) { unchanged += 1; continue; }

      let candidatePath = "";
      if (slug) {
        const { data: folderFiles, error: folderError } = await supabase.storage.from(BUCKET).list(slug, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
        if (!folderError) {
          const candidate = (folderFiles ?? []).find((file: any) => isImage(String(file.name || "")));
          if (candidate) candidatePath = slug + "/" + candidate.name;
        }
      }

      if (!candidatePath) {
        const expected = [safePart(slug), titleKey].filter((value) => value.length >= 5);
        const candidate = (rootFiles ?? []).find((file: any) => {
          const name = String(file.name || "");
          const normalized = safePart(name);
          return isImage(name) && expected.some((key) => normalized.includes(key));
        });
        if (candidate) candidatePath = String(candidate.name);
      }

      if (!candidatePath || !(await objectExists(supabase, candidatePath))) {
        unresolvedTitles.push(String(book.title || slug || book.id));
        continue;
      }

      const { error: updateError } = await supabase.from("books").update({
        cover_path: candidatePath,
        cover_url: "/api/books/cover?path=" + encodeURIComponent(candidatePath) + (slug ? "&slug=" + encodeURIComponent(slug) : ""),
      }).eq("id", book.id);
      if (updateError) { console.error("Cover repair update error:", book.id, updateError); unresolvedTitles.push(String(book.title || slug || book.id)); continue; }
      repaired += 1;
      repairedTitles.push(String(book.title || slug || book.id));
    }

    return NextResponse.json({
      ok: true, repaired, unchanged, repairedBooks: repairedTitles, unresolvedBooks: unresolvedTitles,
      message: repaired ? `Repaired ${repaired} cover(s). ${unresolvedTitles.length} book(s) still need a manual file match.` : `No safe cover matches were found. ${unchanged} cover(s) were already valid; ${unresolvedTitles.length} book(s) need a manual file match.`,
    });
  } catch (error) {
    console.error("Repair covers error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to repair covers." }, { status: 500 });
  }
}