import Link from "next/link";
import { getFeaturedBooks, getNewPickBooks, getPublishedBooks, getFreeBooks } from "@/lib/books";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { CategoryMenu } from "@/components/category-menu";
import { HomeHeroCarousel } from "@/components/home-hero-carousel";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const featured = await getFeaturedBooks();
  const latest = await getPublishedBooks();
  const selectedNewPicks = await getNewPickBooks();
  const freeBooks = await getFreeBooks();
  const featuredHome = Array.from(
    new Map([...featured, ...latest].map((book) => [book.id, book])).values()
  ).slice(0, 5);
  const newPicks = (selectedNewPicks.length ? selectedNewPicks : latest).slice(0, 5);
  const supabase = await createClient();
  const { data: content } = await supabase.from("site_content").select("key,value");
  const map = Object.fromEntries((content ?? []).map((item) => [item.key, item.value]));

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_20%_0%,#dbeafe,transparent_30%),radial-gradient(circle_at_100%_10%,#fce7f3,transparent_30%),#f8fafc]">
        {map.announcement && (
          <div className="bg-indigo-600 px-4 py-2 text-center text-sm font-bold text-white">
            {map.announcement}
          </div>
        )}

        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <CategoryMenu />
          </div>

          <div className="min-w-0">
            <HomeHeroCarousel books={featured.length ? featured : latest.slice(0, 8)} />

            <section className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-black text-indigo-600">
                    ✨ Fresh picks
                  </p>
                  <h2 className="mt-1 text-3xl font-black">Featured</h2>
                </div>

                <Link href="/books" className="shrink-0 text-sm font-black text-indigo-600">
                  See all →
                </Link>
              </div>

              <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {featuredHome.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>

            <section className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-black text-emerald-600">📖 Read without buying</p>
                  <h2 className="mt-1 text-3xl font-black">Free Reading</h2>
                </div>
                <Link href="/free-reading" className="shrink-0 text-sm font-black text-emerald-600">
                  See all free →
                </Link>
              </div>

              {freeBooks.length > 0 ? (
                <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {freeBooks.slice(0, 5).map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-sm font-semibold text-emerald-800">
                  Free books will appear here soon.
                </div>
              )}
            </section>

            <section className="mt-10 pb-12">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-black text-pink-600">
                    🌟 Fresh picks
                  </p>
                  <h2 className="mt-1 text-3xl font-black">New Picks</h2>
                </div>

                <Link href="/books" className="shrink-0 text-sm font-black text-indigo-600">
                  See all books →
                </Link>
              </div>

              <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {newPicks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
