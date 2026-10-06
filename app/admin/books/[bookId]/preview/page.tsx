import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { EpubReader } from "@/components/reader";

export default async function AdminBookPreviewPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const { supabase, user, isAdmin } = await requireAdmin();

  if (!user || !isAdmin) redirect("/admin-login");

  const { data: book } = await supabase
    .from("books")
    .select("id,title,published,is_published")
    .eq("id", bookId)
    .maybeSingle();

  if (!book) notFound();

  return (
    <main className="min-h-screen bg-[#f1f2f7]">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3 p-4">
          <Link href={`/admin/books/${book.id}`} className="text-sm font-bold text-[var(--booknook-primary)]">
            ← Back to Edit Book
          </Link>
          <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-700">
            Admin Preview
          </span>
        </div>
        <EpubReader bookId={book.id} title={book.title} preview />
      </div>
    </main>
  );
}
