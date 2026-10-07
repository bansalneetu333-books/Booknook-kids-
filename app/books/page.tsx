import Link from "next/link";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { getPublishedBooks } from "@/lib/books";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { HomeHeroCarousel } from "@/components/home-hero-carousel";

type SearchParams = Promise<{ q?: string; genre?: string; category?: string; age?: string }>;

export default async function BooksPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const allBooks = await getPublishedBooks();
  const search = params.q?.trim().toLowerCase();
  const genre = params.genre?.trim().toLowerCase();
  const category = params.category?.trim().toLowerCase();
  const age = params.age?.trim().toLowerCase();

  const books = allBooks.filter((book) => {
    const matchesSearch = !search || book.title.toLowerCase().includes(search) || book.author.toLowerCase().includes(search);
    const matchesGenre = !genre || (book.genre ?? "").split("/").map((v) => v.trim().toLowerCase()).includes(genre);
    const matchesCategory = !category || (book.categories ?? []).some((item) => item.slug === category) ||
      (book.genre ?? "").split("/").map((v) => v.trim().toLowerCase()).includes(
        BOOK_CATEGORIES.find((item) => item.slug === category)?.name.toLowerCase() ?? category
      );
    const matchesAge = !age || book.age_category?.toLowerCase().includes(age);
    return matchesSearch && matchesGenre && matchesCategory && matchesAge;
  });

  return (
    <>
      <SiteHeader />
      <main className="bn-page px-4 py-3 sm:px-6 lg:py-5">
        <div className="mx-auto max-w-7xl">
          <HomeHeroCarousel books={allBooks.slice(0, 8)} />

          <section className="mt-4 rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-[var(--booknook-border)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--booknook-primary)]">Explore BookNook Kids</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Find your next comic ✨</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Adventures, mysteries, science, heroes and more — discover your next world.</p>
          </section>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <Link href="/books" className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-black ${!params.genre && !params.category ? "bg-[#6d5dfc] text-white" : "border border-[#ece8f5] bg-white text-slate-700"}`}>🌈 All</Link>
            {BOOK_CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/books?category=${encodeURIComponent(c.slug)}`}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black ${params.category === c.slug ? "bg-[#6d5dfc] text-white" : "border border-[#ece8f5] bg-white text-slate-700"}`}>
                <span>{c.icon}</span>{c.name}
              </Link>
            ))}
          </div>

          {books.length === 0 ? (
            <div className="bn-surface mt-8 p-10 text-center sm:p-14">
              <div className="text-6xl">🔎</div>
              <h2 className="mt-4 text-2xl font-black">Nothing here yet</h2>
              <p className="mt-2 text-slate-500">Try another category or search.</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6">
              {books.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
