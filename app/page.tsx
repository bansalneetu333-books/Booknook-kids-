import Link from "next/link";
import { getPublishedBooks, getFreeBooks } from "@/lib/books";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { HomeHeroCarousel } from "@/components/home-hero-carousel";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CATEGORY_TONES = [
  "from-[#e5f5ef] to-[#f6fbf7]",
  "from-[#e5effc] to-[#f7faff]",
  "from-[#fff0df] to-[#fffaf2]",
  "from-[#fbe6e3] to-[#fff7f5]",
  "from-[#eee8fb] to-[#faf8ff]",
  "from-[#e1f3f2] to-[#f6fbfa]",
  "from-[#f8e6f0] to-[#fff8fb]",
  "from-[#fcebdc] to-[#fffaf5]",
  "from-[#e7eff9] to-[#f8fbff]",
  "from-[#f7f0d9] to-[#fffdf5]",
];

export default async function HomePage() {
  const [catalogue, freeBooks] = await Promise.all([
    getPublishedBooks(),
    getFreeBooks(),
  ]);
  const latest = [...catalogue].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime() || 0;
    const dateB = new Date(b.created_at).getTime() || 0;
    return dateB - dateA;
  });
  const featured = catalogue.filter((book) => book.featured);
  const featuredBooks = (featured.length ? featured : latest).slice(0, 5);
  const newPicks = latest.slice(0, 8);
  const freePicks = freeBooks.slice(0, 4);

  const supabase = await createClient();
  const { data: content } = await supabase.from("site_content").select("key,value");
  const contentMap = Object.fromEntries((content ?? []).map((item) => [item.key, item.value]));

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen overflow-x-clip bg-[var(--booknook-bg)]">
        {contentMap.announcement && (
          <div className="bg-[var(--booknook-ink)] px-4 py-2 text-center text-xs font-bold tracking-wide text-white sm:text-sm">
            {contentMap.announcement}
          </div>
        )}

        <HomeHeroCarousel books={latest.slice(0, 8)} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="pb-9 pt-2 sm:pb-12">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-[var(--booknook-primary)] sm:text-xs">Find your next world</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--booknook-ink)] sm:text-3xl">Explore by category</h2>
                <p className="mt-1 text-sm text-[var(--booknook-muted)]">A growing library for every kind of curious mind.</p>
              </div>
              <Link href="/books" className="mb-1 shrink-0 text-xs font-extrabold text-[var(--booknook-primary)] sm:text-sm">All books ↗</Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {BOOK_CATEGORIES.map((category, index) => (
                <Link key={category.slug} href={"/books?category=" + encodeURIComponent(category.slug)} className={`group flex min-h-[105px] items-center gap-3 rounded-2xl border border-white bg-gradient-to-br ${CATEGORY_TONES[index % CATEGORY_TONES.length]} p-3 shadow-[0_5px_18px_rgba(23,43,69,.045)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(23,43,69,.09)] sm:min-h-[120px] sm:rounded-3xl sm:p-4`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-2xl shadow-sm transition group-hover:scale-105 sm:h-14 sm:w-14 sm:text-3xl">{category.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black leading-5 text-[var(--booknook-ink)]">{category.name}</span>
                    <span className="mt-1 block text-[10px] font-semibold text-[var(--booknook-muted)] sm:text-xs">Explore stories ↗</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="pb-10 sm:pb-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-[var(--booknook-primary)] sm:text-xs">Selected for you</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--booknook-ink)] sm:text-3xl">Featured e-books</h2>
                <p className="mt-1 text-sm text-[var(--booknook-muted)]">Stories and ideas worth making time for.</p>
              </div>
              <Link href="/books" className="shrink-0 text-xs font-extrabold text-[var(--booknook-primary)] sm:text-sm">View collection ↗</Link>
            </div>
            {featuredBooks.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
                {featuredBooks.map((book) => <BookCard key={book.id} book={book} />)}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-[var(--booknook-border)] bg-white p-8 text-center">
                <p className="font-bold">Your next favourite read is on its way.</p>
                <p className="mt-1 text-sm text-[var(--booknook-muted)]">Newly published e-books will appear here automatically.</p>
              </div>
            )}
          </section>

          <section className="pb-10 sm:pb-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#b86d4e] sm:text-xs">Fresh off the shelf</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--booknook-ink)] sm:text-3xl">New arrivals</h2>
                <p className="mt-1 text-sm text-[var(--booknook-muted)]">Newly published titles, automatically added.</p>
              </div>
              <Link href="/books" className="shrink-0 text-xs font-extrabold text-[var(--booknook-primary)] sm:text-sm">See all ↗</Link>
            </div>
            {newPicks.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {newPicks.slice(0, 4).map((book) => <BookCard key={book.id} book={book} />)}
              </div>
            ) : (
              <p className="mt-5 rounded-3xl bg-white p-6 text-sm text-[var(--booknook-muted)]">New arrivals will appear here as soon as you publish your first e-book.</p>
            )}
          </section>

          <section className="pb-10 sm:pb-14">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#e5f3ef] p-6 sm:rounded-[2.5rem] sm:p-10 lg:p-12">
              <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#a6ded4]/60 blur-2xl" />
              <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
                <div className="max-w-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#176e70] sm:text-xs">A little gift for curious minds</p>
                  <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-[#172b45] sm:text-4xl">Good stories should be easy to discover.</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">Start with a free digital read, then explore more adventures, science, money skills, friendship and imagination.</p>
                  <Link href="/free-reading" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#176e70] px-6 py-3 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5">Explore free reads ↗</Link>
                </div>
                <div className="hidden h-32 w-32 items-center justify-center rounded-[2rem] border border-white/70 bg-white/70 text-6xl shadow-lg sm:flex lg:h-40 lg:w-40">📚</div>
              </div>
            </div>
            {freePicks.length > 0 && (
              <div className="mt-7">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-[var(--booknook-ink)] sm:text-2xl">Free reads to get started</h3>
                    <p className="mt-1 text-sm text-[var(--booknook-muted)]">Read online and discover something new.</p>
                  </div>
                  <Link href="/free-reading" className="shrink-0 text-xs font-extrabold text-[var(--booknook-primary)] sm:text-sm">All free reads ↗</Link>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                  {freePicks.map((book) => <BookCard key={book.id} book={book} />)}
                </div>
              </div>
            )}
          </section>

          <section className="pb-12 sm:pb-16">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[
                ["📱", "Read on your screen", "Designed for phones, tablets and computers."],
                ["⚡", "Instant access", "Your digital books, ready after access is granted."],
                ["🔐", "Secure library", "Your purchased titles stay connected to your account."],
                ["🌱", "A growing collection", "New published titles appear automatically."],
              ].map(([icon, heading, copy]) => (
                <div key={heading} className="rounded-2xl border border-[var(--booknook-border)] bg-white p-4 sm:rounded-3xl sm:p-5">
                  <span className="text-2xl">{icon}</span>
                  <h3 className="mt-3 text-sm font-black text-[var(--booknook-ink)] sm:text-base">{heading}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-[var(--booknook-muted)] sm:text-sm">{copy}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
