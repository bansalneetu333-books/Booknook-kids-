"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SlideBook = {
  id: string;
  title: string;
  slug: string;
  author?: string | null;
  description?: string | null;
  genre?: string | null;
  age_category?: string | null;
  price?: number | null;
  is_free?: boolean;
  cover_path?: string | null;
};

type HeroProps = { books: SlideBook[] };
type HeroSlide = { key: string; book?: SlideBook; eyebrow: string; title: string; body: string };

const fallbackMessages = [
  { eyebrow: "A little wonder, every day", title: "Big stories for curious minds.", body: "Explore illustrated adventures, smart ideas and stories that stay with you." },
  { eyebrow: "Read. Imagine. Grow.", title: "Their next favourite world is waiting.", body: "Discover digital books for brave thinkers, big dreamers and lifelong readers." },
  { eyebrow: "Made for little screen, big imagination", title: "A whole library, wherever you are.", body: "Open a story on your phone, tablet or computer and make reading your own." },
];

export function HomeHeroCarousel({ books }: HeroProps) {
  const slides = useMemo(() => {
    const sorted = [...books].sort((a, b) => Number(Boolean(b.is_free)) - Number(Boolean(a.is_free)));
    const bookSlides: HeroSlide[] = sorted.slice(0, 5).map((book, index) => ({
      key: book.id,
      book,
      ...fallbackMessages[index % fallbackMessages.length],
    }));
    return bookSlides.length ? bookSlides : fallbackMessages.map((message, index): HeroSlide => ({ key: `welcome-${index}`, book: undefined, ...message }));
  }, [books]);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [active, slides.length]);

  const slide = slides[active] ?? slides[0];
  const book = slide?.book;

  return (
    <section className="px-3 pb-3 pt-3 sm:px-6 sm:pb-5 sm:pt-4 lg:px-8">
      <div
        className="home-hero relative mx-auto max-w-7xl overflow-hidden rounded-[1.5rem] bg-[#102b50] text-white shadow-[0_24px_70px_rgba(16,43,80,.18)] sm:rounded-[2rem]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}
        aria-roledescription="carousel"
        aria-label="BookNook Kids featured stories"
      >
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#55c7b5]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-[28%] h-80 w-80 rounded-full bg-[#ffb98a]/15 blur-3xl" />

        <div className="hero-layout relative grid min-h-[360px] grid-cols-1 items-center gap-2 px-5 py-6 sm:min-h-[400px] sm:px-8 sm:py-8 lg:min-h-[360px] lg:grid-cols-[1.03fr_.97fr] lg:px-12">
          <div key={slide.key + "-copy"} className="relative z-10 max-w-xl animate-[heroFadeIn_.5s_ease_both]">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#bcefe7] sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6ee7d2]" />
              {book ? (book.is_free ? "A free read to begin" : "Discover your next read") : "Welcome to BookNook Kids"}
            </p>
            <p className="mt-3 text-sm font-bold text-white/70 sm:text-base">{slide.eyebrow}</p>
            <h1 className="mt-2 max-w-xl text-3xl font-black leading-[1.02] tracking-[-.04em] sm:text-4xl lg:text-5xl">
              {book ? <>Meet your next <span className="text-[#8fe3d6]">favourite</span> story.</> : slide.title}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-5 text-white/75 sm:text-base sm:leading-6">
              {book?.description?.trim() || (book ? `Open ${book.title} and step into a new adventure. Digital stories made to be enjoyed on your own screen, at your own pace.` : slide.body)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href={book ? `/books/${book.slug}` : "/books"} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f9d77e] px-6 py-3 text-sm font-black text-[#172b45] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ffe6a0]">
                {book ? "Explore this e-book" : "Explore all books"} <span className="ml-2">↗</span>
              </Link>
              <Link href="/books" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                Browse collection
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-white/65">
              <span>✦ Instant digital access</span><span>✦ Read on your device</span>
            </div>
          </div>

          <div key={slide.key + "-art"} className="relative mx-auto flex h-[190px] w-full max-w-[470px] items-center justify-center animate-[heroArtIn_.65s_ease_both] sm:h-[250px] lg:h-[300px]">
            <div className="absolute h-[220px] w-[220px] rounded-full border border-white/15 bg-white/[.04] sm:h-[290px] sm:w-[290px] lg:h-[350px] lg:w-[350px]" />
            <div className="absolute h-[180px] w-[180px] rounded-full border border-dashed border-[#8fe3d6]/40 sm:h-[245px] sm:w-[245px] lg:h-[295px] lg:w-[295px]" />
            {book ? (
              <>
                {slides.filter((item) => item.book && item.book.id !== book.id).slice(0, 2).map((item, index) => (
                  <div key={item.key} className={`absolute top-[22%] hidden w-[28%] overflow-hidden rounded-xl border border-white/20 bg-white/10 p-1.5 opacity-65 shadow-2xl sm:block ${index === 0 ? "left-[4%] -rotate-[13deg]" : "right-[3%] rotate-[13deg]"}`}>
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-white/10">
                      <Image src={`/api/books/cover?slug=${encodeURIComponent(item.book!.slug)}`} alt={item.book!.title} fill sizes="130px" className="object-contain" />
                    </div>
                  </div>
                ))}
                <Link href={`/books/${book.slug}`} aria-label={`View ${book.title}`} className="relative z-10 block h-[180px] w-[120px] -rotate-2 overflow-hidden rounded-xl border border-white/40 bg-white p-2 shadow-[0_24px_60px_rgba(0,0,0,.38)] transition duration-500 hover:rotate-0 hover:scale-[1.03] sm:h-[230px] sm:w-[155px] lg:h-[280px] lg:w-[190px]">
                  <div className="relative h-full w-full overflow-hidden rounded-lg bg-[#f8f5ef]">
                    <Image src={`/api/books/cover?slug=${encodeURIComponent(book.slug)}`} alt={book.title} fill priority sizes="(max-width: 640px) 145px, 235px" className="object-contain" />
                  </div>
                </Link>
                <div className="absolute bottom-[3%] right-[1%] z-20 max-w-[150px] rounded-2xl border border-white/25 bg-[#fffdf7] px-3 py-2.5 text-[#172b45] shadow-xl sm:bottom-[6%] sm:right-[1%] sm:max-w-[170px]">
                  <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#176e70]">{book.is_free ? "Ready to read" : book.genre || "Featured e-book"}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-black leading-4 sm:text-sm">{book.title}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">{book.is_free ? "Free digital read" : typeof book.price === "number" && book.price > 0 ? `₹${book.price.toFixed(0)} · Digital e-book` : "Explore the book"}</p>
                </div>
              </>
            ) : (
              <div className="relative z-10 flex h-[210px] w-[210px] items-center justify-center rounded-[2rem] border border-white/20 bg-white/10 text-7xl shadow-2xl sm:h-[270px] sm:w-[270px]">📚</div>
            )}
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/10 bg-black/10 px-5 py-2 sm:px-10">
          <p className="text-[10px] font-bold tracking-wide text-white/60 sm:text-xs">STORIES TO OPEN. WORLDS TO DISCOVER.</p>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous slide" onClick={() => setActive((value) => (value - 1 + slides.length) % slides.length)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-sm transition hover:bg-white/10">←</button>
            {slides.map((item, index) => <button key={item.key} type="button" aria-label={`Show slide ${index + 1}`} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)} className={`h-2 rounded-full transition-all ${index === active ? "w-7 bg-[#f9d77e]" : "w-2 bg-white/35 hover:bg-white/70"}`} />)}
            <button type="button" aria-label="Next slide" onClick={() => setActive((value) => (value + 1) % slides.length)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-sm transition hover:bg-white/10">→</button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes heroFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes heroArtIn { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (prefers-reduced-motion: reduce) { :global(*) { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
      `}</style>
    </section>
  );
}

export default HomeHeroCarousel;
