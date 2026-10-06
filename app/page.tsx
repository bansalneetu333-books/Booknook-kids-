import Link from "next/link";
import { getFeaturedBooks, getPublishedBooks, getFreeBooks } from "@/lib/books";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { HomeHeroCarousel } from "@/components/home-hero-carousel";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const [featured, latest, freeBooks] = await Promise.all([
    getFeaturedBooks(),
    getPublishedBooks(),
    getFreeBooks(),
  ]);

  const featuredBooks = Array.from(
    new Map([...featured, ...latest].map((book) => [book.id, book])).values()
  ).slice(0, 6);

  const newPicks = latest.slice(0, 6);

  const supabase = await createClient();
  const { data: content } = await supabase
    .from("site_content")
    .select("key,value");
  const map = Object.fromEntries(
    (content ?? []).map((item) => [item.key, item.value])
  );

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen overflow-x-hidden bg-[#fffdf9]">
        {map.announcement && (
          <div className="bg-[var(--booknook-ink)] px-4 py-2 text-center text-xs font-extrabold text-white sm:text-sm">
            {map.announcement}
          </div>
        )}

        <HomeHeroCarousel books={featured.length ? featured : latest.slice(0, 8)} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="py-8 sm:py-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--booknook-primary)]">
                  Find your next world
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Explore by category
                </h2>
              </div>
              <Link
                href="/books"
                className="shrink-0 text-sm font-black text-violet-700 hover:text-violet-900"
              >
                All comics →
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
              {BOOK_CATEGORIES.map((category, index) => (
                <Link
                  key={category.slug}
                  href={"/books?category=" + encodeURIComponent(category.slug)}
                  className="group flex min-h-[104px] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-3 text-center shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
                >
                  <span className="text-3xl transition group-hover:scale-110">
                    {category.icon}
                  </span>
                  <span className="mt-2 text-xs font-extrabold text-slate-700">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="pb-10">
            <div className="rounded-[2rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 p-5 text-white shadow-lg sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
                    BookNook Kids
                  </p>
                  <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                    Comics kids want to open. Ideas worth remembering.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/90">
                    Explore adventures, science, money, friendship, history,
                    superheroes and whatever new world comes next.
                  </p>
                </div>
                <Link
                  href="/books"
                  className="shrink-0 rounded-full bg-white px-6 py-3 text-center text-sm font-black text-slate-950 shadow-md transition hover:scale-[1.02]"
                >
                  Browse all comics
                </Link>
              </div>
            </div>
          </section>

          <section className="pb-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--booknook-primary)]">
                  Hand-picked
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Featured comics
                </h2>
              </div>
              <Link
                href="/books"
                className="shrink-0 text-sm font-black text-violet-700"
              >
                See all →
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>

          <section className="pb-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                  Start without buying
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Free reading
                </h2>
              </div>
              <Link
                href="/free-reading"
                className="shrink-0 text-sm font-black text-emerald-700"
              >
                See all free →
              </Link>
            </div>

            {freeBooks.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {freeBooks.slice(0, 6).map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-sm font-bold text-emerald-800">
                Free comics will appear here soon.
              </div>
            )}
          </section>

          <section className="pb-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                  Just added
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  New arrivals
                </h2>
              </div>
              <Link
                href="/books"
                className="shrink-0 text-sm font-black text-violet-700"
              >
                Browse all →
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {newPicks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>

          <section className="mb-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <div className="text-3xl">📱</div>
                <h3 className="mt-3 font-black text-slate-950">Read anywhere</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Enjoy your comics on phones, tablets and desktops.
                </p>
              </div>
              <div>
                <div className="text-3xl">🌈</div>
                <h3 className="mt-3 font-black text-slate-950">Every topic can fit</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  The homepage stays flexible as your collection grows.
                </p>
              </div>
              <div>
                <div className="text-3xl">🔒</div>
                <h3 className="mt-3 font-black text-slate-950">Your library, your way</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Keep purchased books together and continue reading later.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
