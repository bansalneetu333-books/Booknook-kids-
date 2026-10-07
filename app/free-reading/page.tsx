import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BookCard } from "@/components/book-card";
import { getFreeBooks } from "@/lib/books";
import { BOOK_CATEGORIES } from "@/lib/book-categories";

export const dynamic = "force-dynamic";

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
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#6d5dfc] via-[#d92fe9] to-[#55c7f4] p-7 text-white shadow-[0_16px_40px_rgba(23,32,51,0.12)] sm:p-10">
            <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/15" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-[#ffd45c]/20" />
            <div className="relative max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/80">BOOKNOOK KIDS • FREE READING</p>
              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Read. Explore. No purchase needed. 📖✨</h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-white/90 sm:text-lg">
                Discover selected comics and stories you can read online for free — with new worlds, ideas and adventures to explore.
              </p>
            </div>
          </section>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            <Link href="/free-reading" className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-black ${!category ? "bg-[#6d5dfc] text-white shadow-md" : "border border-[#ece8f5] bg-white text-slate-700"}`}>🌈 All Free Books</Link>
            {BOOK_CATEGORIES.map((item) => (
              <Link key={item.slug} href={`/free-reading?category=${encodeURIComponent(item.slug)}`}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black ${category === item.slug ? "bg-[#6d5dfc] text-white shadow-md" : "border border-[#ece8f5] bg-white text-slate-700"}`}>
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
                <p className="text-sm font-black text-[#6d5dfc]">{books.length} {books.length === 1 ? "comic" : "comics"} available</p>
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
