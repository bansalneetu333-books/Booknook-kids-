import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EpubReader } from "@/components/reader";

export default async function ReaderPage({
  params
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/reader/${bookId}`);

  const { data: book } = await supabase
    .from("books")
    .select("id,title,published")
    .eq("id", bookId)
    .or("published.eq.true,is_published.eq.true")
    .maybeSingle();

  if (!book) notFound();

  const { data: ownership } = await supabase
    .from("order_items")
    .select("id,orders!inner(user_id,status)")
    .eq("book_id", bookId)
    .eq("orders.user_id", user.id)
    .eq("orders.status", "paid")
    .limit(1)
    .maybeSingle();

  if (!ownership) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0f172a] p-6">
        <div className="max-w-md bn-surface p-8 text-center">
          <div className="text-5xl">🔒</div>

          <h1 className="mt-4 text-2xl font-black">
            You don&apos;t have access to this book.
          </h1>

          <p className="mt-2 text-slate-400">
            Purchase the book to open the complete reader.
          </p>

          <a
            href={`/books/${book.id}`}
            className="mt-6 inline-block rounded-full bg-[var(--booknook-primary)] px-6 py-3 font-bold text-white"
          >
            Back to Book
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <a
            href="/library"
            className="text-sm font-bold text-indigo-600"
          >
            ← Back to Library
          </a>

        </div>

        <EpubReader
          bookId={book.id}
          title={book.title}
        />
      </div>
    </main>
  );
}
