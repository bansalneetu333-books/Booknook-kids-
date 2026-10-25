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
    <main className="min-h-screen bg-[#0f172a]">
      <EpubReader
        bookId={book.id}
        title={book.title}
        preview
        backHref={`/admin/books/${book.id}`}
        backLabel="Edit book"
        badge="Admin preview"
        initialZoom={1.5}
      />
    </main>
  );
}
