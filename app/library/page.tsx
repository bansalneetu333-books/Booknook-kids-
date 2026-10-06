import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyLibrary } from "@/lib/library";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { LibraryBookActions } from "@/components/library-book-actions";

export default async function LibraryPage() {
  const books = await getMyLibrary();

  if (books === null) {
    redirect("/login?next=/library");
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] bg-gradient-to-r from-indigo-600 to-violet-600 p-7 text-white shadow-xl">
            <p className="text-sm font-black uppercase tracking-widest text-white/70">
              Your shelf
            </p>

            <h1 className="mt-2 text-4xl font-black">
              My Library 📚
            </h1>

            <p className="mt-2 text-white/80">
              Your purchased books are waiting for you.
            </p>
          </div>

          {books.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">📖</div>

              <h2 className="mt-4 text-2xl font-black">
                Your shelf is empty
              </h2>

              <p className="mt-2 text-slate-500">
                Discover a story and add your first book.
              </p>

              <Link
                href="/books"
                className="mt-6 inline-flex rounded-full bg-indigo-600 px-6 py-3 font-black text-white"
              >
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {books.map((book) => (
                <div key={book.id} className="min-w-0">
                  <BookCard book={book} />
                  <div className="mt-2">
                    <LibraryBookActions bookId={book.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
