import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyLibrary } from "@/lib/library";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { LibraryBookActions } from "@/components/library-book-actions";

export default async function LibraryPage() {
  const books = await getMyLibrary();
  if (books === null) redirect("/login?next=/library");

  return (
    <>
      <SiteHeader />
      <main className="bn-page px-4 py-6 sm:px-6 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <section className="bn-gradient rounded-[2rem] p-7 text-white shadow-xl sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Your shelf</p>
            <h1 className="mt-2 text-4xl font-black">My Library 📚</h1>
            <p className="mt-2 text-white/80">Your comics are waiting for you.</p>
          </section>
          {books.length === 0 ? (
            <div className="bn-surface mt-8 p-10 text-center">
              <div className="text-5xl">📖</div>
              <h2 className="mt-4 text-2xl font-black">Your shelf is empty</h2>
              <p className="mt-2 text-slate-500">Discover a new world and add your first comic.</p>
              <Link href="/books" className="bn-button mt-6">Browse Comics</Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {books.map((book) => (
                <div key={book.id}>
                  <BookCard book={book} />
                  <LibraryBookActions bookId={book.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}