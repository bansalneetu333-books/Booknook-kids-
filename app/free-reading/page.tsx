import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BookCard } from "@/components/book-card";
import { getFreeBooks } from "@/lib/books";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { HomeHeroCarousel } from "@/components/home-hero-carousel";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string }>;

export default async function FreeReadingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = params.category?.trim().toLowerCase();
  const books = await getFreeBooks(category);

  return (
    <>
      <SiteHeader />
      <main className="bn-page px-4 py-3 sm:px-6 lg:py-5">
        <div className="mx-auto max-w-7xl">
          <HomeHeroCarousel books={books.slice(0, 8)} />

          <section className="mt-4 rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-[var(--booknook-border)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">BOOKNOOK KIDS • FREE READING</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Read. Explore. No purchase needed. 📖✨</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Discover selected comics and stories you can read online for free — with new worlds, ideas and adventures to explore.</p>
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
