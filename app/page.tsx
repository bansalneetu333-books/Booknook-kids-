import Link from "next/link";
import { getFeaturedBooks, getPublishedBooks, getFreeBooks } from "@/lib/books";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { HomeHeroCarousel } from "@/components/home-hero-carousel";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const featured = await getFeaturedBooks();
  const latest = await getPublishedBooks();
  const freeBooks = await getFreeBooks();
  const supabase = await createClient();
  const { data: content } = await supabase.from("site_content").select("key,value");
  const map = Object.fromEntries((content ?? []).map((item) => [item.key, item.value]));
  const heroBooks = featured.length ? featured : latest;

  return <>
    <SiteHeader />
    <main className="comic-home min-h-screen overflow-x-hidden bg-[#fffdf8]">
      {map.announcement && <div className="bg-violet-600 px-4 py-2 text-center text-sm font-bold text-white">{map.announcement}</div>}
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7">
        <HomeHeroCarousel books={heroBooks.slice(0,8)} />
        <section className="mt-8 sm:mt-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[.28em] text-violet-600">Explore</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Explore by Category</h2></div>
            <Link href="/books" className="shrink-0 text-sm font-black text-violet-700">See all →</Link>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
            {BOOK_CATEGORIES.slice(0,10).map((category,index)=><Link key={category.slug} href={"/books?category="+encodeURIComponent(category.slug)} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <span className={`flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-white text-3xl shadow-sm ring-1 ring-slate-100 sm:h-[92px] sm:w-[92px] sm:text-4xl ${["bg-sky-100","bg-lime-100","bg-amber-100","bg-pink-100","bg-orange-100","bg-fuchsia-100","bg-violet-100","bg-blue-100","bg-cyan-100","bg-emerald-100"][index]}`}>{category.icon}</span>
              <span className="text-xs font-extrabold text-slate-700 sm:text-sm">{category.name}</span>
            </Link>)}
          </div>
        </section>
        <section className="mt-9 sm:mt-12">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.28em] text-violet-600">Hand-picked</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Featured Comics</h2></div><Link href="/books" className="shrink-0 text-sm font-black text-violet-700">See all →</Link></div>
          {(featured.length ? featured : latest).length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{(featured.length ? featured : latest).slice(0,10).map(book=><BookCard key={book.id} book={book}/>)}</div> : <div className="rounded-3xl border border-violet-100 bg-white p-6 text-sm font-semibold text-slate-600">New comics and e-books will appear here when published.</div>}
        </section>
        {freeBooks.length>0 && <section className="mt-10 pb-10"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.28em] text-emerald-600">Read without buying</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Free Reading</h2></div><Link href="/free-reading" className="shrink-0 text-sm font-black text-emerald-700">See all →</Link></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{freeBooks.slice(0,5).map(book=><BookCard key={book.id} book={book}/>)}</div></section>}
      </div>
    </main>
  </>;
}
