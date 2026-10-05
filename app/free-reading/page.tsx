import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BookCard } from "@/components/book-card";
import { getFreeBooks } from "@/lib/books";
import { BOOK_CATEGORIES } from "@/lib/book-categories";

type SearchParams = Promise<{ category?: string }>;

export default async function FreeReadingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const category = params.category?.trim().toLowerCase();
  const books = await getFreeBooks(category);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#dcfce7,transparent_28%),radial-gradient(circle_at_95%_10%,#fce7f3,transparent_30%),#f8fafc] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-[2rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-600 p-7 text-white shadow-xl sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/75">
              Booknook Kids
            </p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              Free Reading 📖✨
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/85">
              Enjoy selected Booknook Kids stories online for free. No purchase is needed.
            </p>
          </section>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            <Link
              href="/free-reading"
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-black ${
                !category ? "bg-emerald-600 text-white" : "border bg-white text-slate-700"
              }`}
            >
              🌈 All Free Books
            </Link>
            {BOOK_CATEGORIES.map((item) => (
              <Link
                key={item.slug}
                href={`/free-reading?category=${encodeURIComponent(item.slug)}`}
                className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black ${
                  category === item.slug ? "bg-emerald-600 text-white" : "border bg-white text-slate-700"
                }`}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>

          {books.length === 0 ? (
            <div className="mt-8 rounded-[2rem] bg-white p-12 text-center shadow-sm">
              <div className="text-6xl">📚</div>
              <h2 className="mt-4 text-2xl font-black text-slate-900">
                No free books in this category yet
              </h2>
              <p className="mt-2 text-slate-500">
                Please check another category.
              </p>
            </div>
          ) : (
            <section className="mt-8">
              <div className="mb-5">
                <p className="text-sm font-black text-emerald-600">
                  {books.length} {books.length === 1 ? "book" : "books"} available
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  Read for free
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
