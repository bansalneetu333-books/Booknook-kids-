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
  cover_path?: string | null;
  cover_url?: string | null;
  is_free?: boolean;
};

type HeroCarouselProps = {
  books: SlideBook[];
};

export function HomeHeroCarousel({ books }: HeroCarouselProps) {
  const slides = useMemo(
    () => books.filter((book) => book.slug && (book.cover_path || book.cover_url)).slice(0, 8),
    [books],
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <section className="overflow-hidden rounded-3xl border border-orange-100 bg-[#fff4e8] px-5 py-6 sm:px-8 sm:py-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-700">Welcome to Booknook Kids</p>
        <h1 className="mt-2 max-w-2xl text-2xl font-black leading-tight text-slate-900 sm:text-4xl">
          Little readers. Big adventures. <span aria-hidden="true">📚</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          Discover stories, comics and brilliant ideas for curious young minds.
        </p>
        <Link href="/books" className="mt-4 inline-flex rounded-full bg-orange-600 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-orange-700">
          Browse books
        </Link>
      </section>
    );
  }

  const book = slides[active];

  return (
    <section className="overflow-hidden rounded-3xl border border-orange-100 bg-[#fff4e8] shadow-sm">
      <div className="grid min-h-[350px] grid-cols-1 sm:min-h-[285px] sm:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col items-start justify-center px-5 pb-3 pt-6 sm:px-8 sm:py-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-700">Featured story</p>
          <h1 className="mt-2 line-clamp-2 max-w-xl text-2xl font-black leading-tight text-slate-950 sm:text-4xl">
            {book.title}
          </h1>
          {book.author && <p className="mt-1.5 text-sm font-semibold text-slate-600">By {book.author}</p>}
          {book.description && (
            <p className="mt-2 line-clamp-2 max-w-lg text-sm leading-5 text-slate-600">
              {book.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/books/${book.slug}`}
              className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-orange-700"
            >
              {book.is_free ? "Read free" : "Explore book"}
            </Link>
            <Link
              href="/books"
              className="rounded-full border border-slate-300 bg-white/80 px-5 py-2.5 text-sm font-extrabold text-slate-800 transition hover:bg-white"
            >
              Browse all
            </Link>
          </div>
        </div>

        <div className="relative min-h-[185px] overflow-hidden bg-[#ffead5] sm:min-h-[285px]">
          {slides.map((item, index) => {
            const cover = "/api/books/cover?slug=" + encodeURIComponent(item.slug);
            return (
              <div
                key={item.id}
                className={`absolute inset-0 flex items-center justify-center p-3 transition-opacity duration-700 sm:p-5 ${index === active ? "opacity-100" : "pointer-events-none opacity-0"}`}
                aria-hidden={index !== active}
              >
                <Image
                  src={cover}
                  alt={item.title + " book cover"}
                  fill
                  sizes="(max-width: 640px) 100vw, 40vw"
                  className="object-contain p-3 sm:p-5"
                  priority={index === 0}
                  unoptimized
                />
              </div>
            );
          })}
          {slides.length > 1 && (
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-2 shadow-sm" aria-label="Featured books">
              {slides.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show ${item.title}`}
                  aria-pressed={index === active}
                  onClick={() => setActive(index)}
                  className={`h-2 rounded-full transition-all ${index === active ? "w-6 bg-orange-600" : "w-2 bg-slate-300 hover:bg-slate-500"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default HomeHeroCarousel;
