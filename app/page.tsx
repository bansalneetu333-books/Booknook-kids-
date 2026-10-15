import Link from "next/link";
import { getPublishedBooks, getFreeBooks } from "@/lib/books";
import { BookCard } from "@/components/book-card";
import { SiteHeader } from "@/components/site-header";
import { HomeHeroCarousel } from "@/components/home-hero-carousel";
import { BOOK_CATEGORIES } from "@/lib/book-categories";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CATEGORY_TONES = ["tone-blue","tone-cyan","tone-gold","tone-rose","tone-orange","tone-pink","tone-purple","tone-lilac","tone-sky","tone-green"];

export default async function HomePage() {
  const [catalogue, freeBooks] = await Promise.all([getPublishedBooks(), getFreeBooks()]);
  const latest = [...catalogue].sort((a,b) => (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0));
  const featured = catalogue.filter((book) => book.featured);
  const featuredBooks = (featured.length ? featured : latest).slice(0,6);
  const newPicks = latest.slice(0,6);
  const freePicks = freeBooks.slice(0,4);
  const supabase = await createClient();
  const { data: content } = await supabase.from("site_content").select("key,value");
  const contentMap = Object.fromEntries((content ?? []).map((item) => [item.key,item.value]));

  return <>
    <SiteHeader />
    <main className="home-page">
      {contentMap.announcement && <div className="home-announcement">{contentMap.announcement}</div>}
      <HomeHeroCarousel books={latest.slice(0,8)} />
      <div className="home-content">
        <section className="home-section">
          <div className="section-heading"><div><h2>Explore by Category</h2><p>A growing library for every kind of curious mind.</p></div><Link href="/books" className="section-link">View all categories →</Link></div>
          <div className="category-grid">{BOOK_CATEGORIES.slice(0,10).map((category,index)=><Link key={category.slug} href={"/books?category="+encodeURIComponent(category.slug)} className={"category-card "+CATEGORY_TONES[index%CATEGORY_TONES.length]}><span className="category-icon">{category.icon}</span><span className="category-name">{category.name}</span></Link>)}</div>
        </section>
        <section className="home-section">
          <div className="section-heading"><div><h2>New Arrivals</h2><p>Fresh stories just added to our library.</p></div><Link href="/books" className="section-link">View all →</Link></div>
          {newPicks.length ? <div className="book-grid">{newPicks.map(book=><BookCard key={book.id} book={book}/>)}</div> : <div className="empty-shelf">New arrivals will appear here when you publish an e-book.</div>}
        </section>
        <section className="home-section">
          <div className="section-heading"><div><h2>Featured E-books</h2><p>Popular picks loved by our readers.</p></div><Link href="/books" className="section-link">View all →</Link></div>
          {featuredBooks.length ? <div className="book-grid">{featuredBooks.map(book=><BookCard key={book.id} book={book}/>)}</div> : <div className="empty-shelf">Mark books as featured in Admin to show them here.</div>}
        </section>
        <section className="benefit-strip">
          <div className="benefit-item"><span>📘</span><div><strong>Beautifully illustrated</strong><small>Engaging stories and artwork</small></div></div>
          <div className="benefit-item"><span>▣</span><div><strong>Read on any device</strong><small>Phone · Tablet · Computer</small></div></div>
          <div className="benefit-item"><span>⚡</span><div><strong>Instant access</strong><small>Start reading after purchase</small></div></div>
          <div className="benefit-item"><span>♢</span><div><strong>Secure payments</strong><small>Protected payments with Razorpay</small></div></div>
        </section>
        <section className="free-banner"><div className="free-art" aria-hidden="true"><span>📚</span><span>✨</span><span>🌿</span></div><div className="free-copy"><p className="eyebrow">FREE READS</p><h2>Discover free e-books</h2><p>A special collection of stories for every young reader.</p><Link href="/free-reading" className="free-button">Explore Free Reads →</Link></div></section>
        {freePicks.length>0 && <section className="home-section"><div className="section-heading"><div><h2>Free reads to get started</h2><p>Read online and discover something new.</p></div><Link href="/free-reading" className="section-link">All free reads →</Link></div><div className="book-grid">{freePicks.map(book=><BookCard key={book.id} book={book}/>)}</div></section>}
      </div>
    </main>
  </>;
}
