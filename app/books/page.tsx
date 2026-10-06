import Link from "next/link";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { getPublishedBooks } from "@/lib/books";
import { BOOK_CATEGORIES } from "@/lib/categories";

type SearchParams = Promise<{ q?: string; genre?: string; category?: string; age?: string }>;

export default async function BooksPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const allBooks = await getPublishedBooks();

  const search = params.q?.trim().toLowerCase();
  const genre = params.genre?.trim().toLowerCase();
  const category = params.category?.trim().toLowerCase();
  const age = params.age?.trim().toLowerCase();

  const books = allBooks.filter((book) => {
    const matchesSearch =
      !search ||
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search);

    const matchesGenre =
      !genre ||
      (book.genre ?? "")
        .split("/")
        .map((value) => value.trim().toLowerCase())
        .includes(genre);

    const matchesCategory =
      !category ||
      (book.categories ?? []).some((item) => item.slug === category) ||
      (book.genre ?? "")
        .split("/")
        .map((value) => value.trim().toLowerCase())
        .includes(
          BOOK_CATEGORIES.find((item) => item.slug === category)?.name.toLowerCase() ?? category
        );

    const matchesAge =
      !age || book.age_category?.toLowerCase().includes(age);

    return matchesSearch && matchesGenre && matchesCategory && matchesAge;
  });

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-pink-500 px-5 py-4 text-white shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/75">
                  Explore
                </p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                  Find your next read 📚
                </h1>
              </div>
              <span className="hidden text-3xl sm:block">✨</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <Link
              href="/books"
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-black ${
                !params.genre && !params.category
                  ? "bg-indigo-600 text-white"
                  : "border bg-white text-slate-700"
              }`}
            >
              🌈 All
            </Link>

            {BOOK_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/books?category=${encodeURIComponent(c.slug)}`}
                className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black ${
                  params.category === c.slug
                    ? "bg-indigo-600 text-white"
                    : "border bg-white text-slate-700"
                }`}
              >
                <span>{c.icon}</span>
                {c.name}
              </Link>
            ))}
          </div>

          {books.length === 0 ? (
            <div className="mt-8 rounded-[2rem] bg-white p-12 text-center shadow-sm">
              <div className="text-6xl">🔎</div>

              <h2 className="mt-4 text-2xl font-black">
                Nothing here yet
              </h2>

              <p className="mt-2 text-slate-500">
                Try another category or search.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
