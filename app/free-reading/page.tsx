import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BookCard } from "@/components/book-card";
import { getFreeBooks } from "@/lib/books";
import { BOOK_CATEGORIES } from "@/lib/book-categories";

type SearchParams = Promise<{ category?: string }>;

export default async function FreeReadingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = params.category?.trim().toLowerCase();
  const books = await getFreeBooks(category);

  return (
    <>
      <SiteHeader />
      <main className="bn-page px-4 py-6 sm:px-6 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-teal-500 to-[#6d5dfc] p-7 text-white shadow-xl sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">BookNook Kids</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">Free Reading 📖✨</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/85">Enjoy selected comics online for free. No purchase is needed.</p>
          </section>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            <Link href="/free-reading" className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-black ${!category ? "bg-emerald-600 text-white" : "border border-[#ece8f5] bg-white text-slate-700"}`}>🌈 All Free Books</Link>
            {BOOK_CATEGORIES.map((item) => (
              <Link key={item.slug} href={`/free-reading?category=${encodeURIComponent(item.slug)}`}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black ${category === item.slug ? "bg-emerald-600 text-white" : "border border-[#ece8f5] bg-white text-slate-700"}`}>
                <span>{item.icon}</span>{item.name}
              </Link>
            ))}
          </div>

          {books.length === 0 ? (
            <div className="bn-surface mt-8 p-10 text-center sm:p-14">
              <div className="text-6xl">📚</div>
              <h2 className="mt-4 text-2xl font-black">No free comics in this category yet</h2>
              <p className="mt-2 text-slate-500">Please check another category.</p>
            </div>
          ) : (
            <section className="mt-8">
              <div className="mb-5">
                <p className="text-sm font-black text-emerald-600">{books.length} {books.length === 1 ? "comic" : "comics"} available</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">Read for free</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6">
                {books.map((book) => <BookCard key={book.id} book={book} />)}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
