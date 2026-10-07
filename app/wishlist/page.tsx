import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { BookCard } from "@/components/book-card";

type WishlistBook = {
  id: string;
  title: string;
  slug: string;
  author: string;
  price: number;
  genre: string;
  age_category: string;
  cover_path: string | null;
  published: boolean;
  featured: boolean;
};

export default async function WishlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/wishlist");
  }

  const { data: rows, error } = await supabase
    .from("wishlists")
    .select(
      "created_at, book:books(id,title,slug,author,price,genre,age_category,cover_path,published,featured)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const books = (rows ?? [])
    .flatMap((row) => row.book ?? [])
    .filter((book): book is WishlistBook => Boolean(book))
    .filter((book) => book.published);

  return (
    <main className="bn-page min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="bn-gradient overflow-hidden rounded-[2rem] p-6 text-white shadow-[0_18px_45px_rgba(109,93,252,0.18)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-white/75">
            Your saved comics
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            My Wishlist 💜
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-white/85 sm:text-base">
            Keep the comics you want to read next all in one place.
          </p>
        </section>

        {error ? (
          <section className="bn-surface mt-8 p-8 text-center">
            <div className="text-4xl">📚</div>
            <h2 className="mt-3 text-xl font-black text-[var(--booknook-ink)]">
              We couldn’t load your wishlist
            </h2>
            <p className="mt-2 text-sm font-medium text-[var(--booknook-muted)]">
              Please try again in a moment.
            </p>
          </section>
        ) : books.length === 0 ? (
          <section className="bn-surface mt-8 p-8 text-center sm:p-12">
            <div className="text-5xl">♡</div>
            <h2 className="mt-4 text-2xl font-black text-[var(--booknook-ink)]">
              Your wishlist is empty
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[var(--booknook-muted)]">
              Save a comic you love and it will appear here.
            </p>
            <Link href="/books" className="bn-button mt-6">
              Explore Comics →
            </Link>
          </section>
        ) : (
          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-[var(--booknook-ink)]">
                  Saved for later
                </h2>
                <p className="mt-1 text-sm font-semibold text-[var(--booknook-muted)]">
                  {books.length} {books.length === 1 ? "comic" : "comics"} saved
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
