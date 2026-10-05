import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { getFeaturedBooks, getPublishedBooks, getFreeBooks } from "@/lib/books";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { CategoryMenu } from "@/components/category-menu";
import { BOOK_CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const featured = await getFeaturedBooks();
  const latest = await getPublishedBooks();
  const freeBooks = await getFreeBooks();
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
            <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 p-6 text-white shadow-xl sm:p-10">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/80">
                  Welcome to {siteConfig.name}
                </p>

                <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">
                  {map.hero_title || "Discover Amazing Stories! 📚✨"}
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
                  {map.hero_text ||
                    "Read, explore and enjoy wonderful e-books for young readers."}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/books"
                    className="rounded-full bg-white px-6 py-3 font-black text-indigo-700 shadow-lg"
                  >
                    Start Reading
                  </Link>

                  <Link
                    href="/library"
                    className="rounded-full border border-white/40 bg-white/10 px-6 py-3 font-black text-white backdrop-blur"
                  >
                    My Shelf
                  </Link>
                </div>
              </div>
            </section>

            <section className="mt-6 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-5">
              {BOOK_CATEGORIES.slice(0, 10).map((category) => (
                <Link
                  key={category.slug}
                  href={`/books?genre=${encodeURIComponent(category.name)}`}
                  className="min-w-0 rounded-3xl border border-white bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="text-3xl">{category.icon}</span>
                  <p className="mt-2 truncate text-sm font-black text-slate-800">
                    {category.name}
                  </p>
                </Link>
              ))}
            </section>

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
                {(featured.length ? featured : latest.slice(0, 5)).map((book) => (
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
                    🌟 More to explore
                  </p>
                  <h2 className="mt-1 text-3xl font-black">New Shelf</h2>
                </div>

                <Link href="/books" className="shrink-0 text-sm font-black text-indigo-600">
                  Browse →
                </Link>
              </div>

              <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {latest.slice(0, 10).map((book) => (
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
