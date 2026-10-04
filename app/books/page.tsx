import Link from "next/link";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { getPublishedBooks } from "@/lib/books";
import { BOOK_CATEGORIES } from "@/lib/categories";

type SearchParams = Promise<{ q?: string; genre?: string; age?: string }>;

export default async function BooksPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const allBooks = await getPublishedBooks();

  const search = params.q?.trim().toLowerCase();
  const genre = params.genre?.trim().toLowerCase();
  const age = params.age?.trim().toLowerCase();

  const books = allBooks.filter((book) => {
    const matchesSearch =
      !search ||
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search);

    const matchesGenre =
      !genre || book.genre?.toLowerCase() === genre;

    const matchesAge =
      !age || book.age_category?.toLowerCase().includes(age);

    return matchesSearch && matchesGenre && matchesAge;
  });

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] bg-gradient-to-br from-indigo-600 to-pink-500 p-7 text-white shadow-xl sm:p-9">
            <p className="text-sm font-black uppercase tracking-widest text-white/75">
              Explore
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Find your next read 📚
            </h1>

            <p className="mt-2 max-w-2xl text-white/85">
              Pick a world, search a title, and open a story made
              for young readers.
            </p>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <Link
              href="/books"
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-black ${
                !params.genre
                  ? "bg-indigo-600 text-white"
                  : "border bg-white text-slate-700"
              }`}
            >
              🌈 All
            </Link>

            {BOOK_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/books?genre=${encodeURIComponent(c.name)}`}
                className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black ${
                  params.genre === c.name
                    ? "bg-indigo-600 text-white"
                    : "border bg-white text-slate-700"
                }`}
              >
                <span>{c.icon}</span>
                {c.name}
              </Link>
            ))}
          </div>

          <form className="mt-5 grid gap-3 rounded-3xl border bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto]">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search books…"
              className="rounded-2xl border p-3.5 outline-none focus:border-indigo-500"
            />

            {params.genre && (
              <input
                type="hidden"
                name="genre"
                value={params.genre}
              />
            )}

            <input
              name="age"
              defaultValue={params.age}
              placeholder="Age e.g. 6–16"
              className="rounded-2xl border p-3.5"
            />

            <button className="rounded-2xl bg-slate-900 px-5 py-3.5 font-black text-white">
              Find
            </button>
          </form>

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
