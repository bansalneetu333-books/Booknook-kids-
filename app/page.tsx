import Link from "next/link";
import { getFeaturedBooks, getPublishedBooks, getFreeBooks } from "@/lib/books";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { HomeHeroCarousel } from "@/components/home-hero-carousel";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { createClient } from "@/lib/supabase/server";

const AGE_GROUPS = [
  { label: "6–8 Years", value: "6-8", icon: "🧒" },
  { label: "9–12 Years", value: "9-12", icon: "🧑" },
  { label: "13–16 Years", value: "13-16", icon: "🧑‍🎓" },
  { label: "16+ Years", value: "16", icon: "🎓" },
];

const CATEGORY_STYLES = [
  "bg-sky-100/90",
  "bg-lime-100/90",
  "bg-amber-100/90",
  "bg-pink-100/90",
  "bg-violet-100/90",
  "bg-emerald-100/90",
  "bg-purple-100/90",
  "bg-orange-100/90",
  "bg-blue-100/90",
  "bg-yellow-100/90",
];

export default async function HomePage() {
  const [featured, latest, freeBooks] = await Promise.all([
    getFeaturedBooks(),
    getPublishedBooks(),
    getFreeBooks(),
  ]);

  const featuredBooks = Array.from(
    new Map([...featured, ...latest].map((book) => [book.id, book])).values()
  ).slice(0, 6);
  const newPicks = latest.slice(0, 8);

  const supabase = await createClient();
  const { data: content } = await supabase.from("site_content").select("key,value");
  const map = Object.fromEntries((content ?? []).map((item) => [item.key, item.value]));

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
          <section className="py-6 sm:py-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--booknook-primary)]">
                  Explore
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Explore by Category
                </h2>
              </div>
              <Link href="/books" className="shrink-0 text-sm font-black text-violet-700">
                See all →
              </Link>
            </div>

            <div className="mt-4 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {BOOK_CATEGORIES.map((category, index) => (
                <Link
                  key={category.slug}
                  href={"/books?category=" + encodeURIComponent(category.slug)}
                  className="group flex w-[78px] shrink-0 flex-col items-center text-center sm:w-[88px]"
                >
                  <span
                    className={
                      "flex h-[68px] w-[68px] items-center justify-center rounded-full border border-white shadow-[0_5px_16px_rgba(23,32,51,0.08)] transition duration-200 group-hover:-translate-y-1 group-hover:scale-105 sm:h-[76px] sm:w-[76px] " +
                      CATEGORY_STYLES[index % CATEGORY_STYLES.length]
                    }
                  >
                    <span className="text-[1.85rem] leading-none sm:text-[2rem]">{category.icon}</span>
                  </span>
                  <span className="mt-2 text-[11px] font-extrabold leading-4 text-slate-700 sm:text-xs">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="pb-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--booknook-primary)]">
                  Hand-picked
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Featured Comics
                </h2>
              </div>
              <Link href="/books" className="shrink-0 text-sm font-black text-violet-700">
                See all →
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>

          <section className="pb-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                  Just added
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  New Arrivals
                </h2>
              </div>
              <Link href="/books" className="shrink-0 text-sm font-black text-violet-700">
                See all →
              </Link>
            </div>

            <div className="mt-4 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              {newPicks.map((book) => (
                <div key={book.id} className="w-[175px] shrink-0 sm:w-[205px]">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </section>

          <section className="pb-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--booknook-primary)]">
                  Find the right fit
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Find Comics by Age
                </h2>
              </div>
              <Link href="/books" className="shrink-0 text-sm font-black text-violet-700">
                Browse all →
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AGE_GROUPS.map((age) => (
                <Link
                  key={age.value}
                  href={"/books?age=" + encodeURIComponent(age.value)}
                  className="bn-surface flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span className="text-3xl">{age.icon}</span>
                  <span className="text-sm font-black text-slate-800 sm:text-base">{age.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="pb-10">
            <div className="rounded-[2rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 p-6 text-white shadow-lg sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
                BOOKNOOK KIDS
              </p>
              <h2 className="mt-2 max-w-2xl text-2xl font-black sm:text-3xl">
                Comics kids want to open. Ideas worth remembering.
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/90 sm:text-base">
                Adventures, science, money, friendship, history and new worlds — all in one growing collection.
              </p>
              <Link
                href="/books"
                className="mt-5 inline-flex rounded-full bg-white px-7 py-3 text-sm font-black text-slate-950 shadow-md transition hover:scale-[1.02]"
              >
                Browse all comics
              </Link>
            </div>
          </section>

          {freeBooks.length > 0 && (
            <section className="pb-10">
              <Link
                href="/free-reading"
                className="bn-surface flex flex-col gap-2 p-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Read without buying</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Free Reading 📖</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Enjoy selected comics online for free.</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-5 py-3 text-sm font-black text-emerald-700">
                  Read Free →
                </span>
              </Link>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
