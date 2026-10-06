import Link from "next/link";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { getPublishedBooks } from "@/lib/books";
import { BOOK_CATEGORIES } from "@/lib/categories";

type SearchParams = Promise<{
  q?: string;
  genre?: string;
  age?: string;
  sort?: "newest" | "price-low" | "price-high" | "title";
}>;

export default async function BooksPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const books = await getPublishedBooks({
    q: params.q,
    genre: params.genre,
    age: params.age,
    sort: params.sort,
  });
  const selectedGenre = params.genre?.trim().toLowerCase();

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-pink-500 px-5 py-4 text-white shadow-md">
            <p className="text-xs font-black uppercase tracking-widest text-white/75">Explore</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Find your next read 📚</h1>
          </div>

          <form action="/books" className="mt-5 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto]">
            <input name="q" defaultValue={params.q ?? ""} placeholder="Search by title, author or topic…" className="min-w-0 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500" aria-label="Search books" />
            <select name="age" defaultValue={params.age ?? ""} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="">All ages</option><option value="4">4–6</option><option value="6">6–9</option><option value="9">9–12</option><option value="12">12–16</option>
            </select>
            <select name="sort" defaultValue={params.sort ?? "newest"} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="newest">Newest</option><option value="title">Title A–Z</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option>
            </select>
            {params.genre ? <input type="hidden" name="genre" value={params.genre} /> : null}
            <button className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white sm:col-span-3 sm:w-fit">Search Books</button>
          </form>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <Link href="/books" className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-black ${!params.genre ? "bg-indigo-600 text-white" : "border bg-white text-slate-700"}`}>🌈 All</Link>
            {BOOK_CATEGORIES.map((c) => {
              const active = selectedGenre === c.name.toLowerCase() || selectedGenre === c.slug.toLowerCase();
              const query = new URLSearchParams();
              if (params.q) query.set("q", params.q);
              query.set("genre", c.name);
              if (params.age) query.set("age", params.age);
              if (params.sort) query.set("sort", params.sort);
              return <Link key={c.slug} href={`/books?${query.toString()}`} className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black ${active ? "bg-indigo-600 text-white" : "border bg-white text-slate-700"}`}><span>{c.icon}</span>{c.name}</Link>;
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">{books.length} {books.length === 1 ? "book" : "books"} found</p>
            {(params.q || params.genre || params.age) && <Link href="/books" className="text-sm font-black text-indigo-600">Clear filters</Link>}
          </div>

          {books.length === 0 ? (
            <div className="mt-8 rounded-[2rem] bg-white p-12 text-center shadow-sm"><div className="text-6xl">🔎</div><h2 className="mt-4 text-2xl font-black">Nothing here yet</h2><p className="mt-2 text-slate-500">Try another category or search.</p></div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{books.map((book) => <BookCard key={book.id} book={book} />)}</div>
          )}
        </div>
      </main>
    </>
  );
}
