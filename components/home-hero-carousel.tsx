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
  const slides = useMemo(() => books.filter((book) => book.cover_path || book.cover_url).slice(0, 8), [books]);
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
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 p-6 text-white shadow-xl sm:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-white/80">Welcome to Booknook Kids</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">Discover Amazing Stories! 📚✨</h1>
          <p className="mt-4 text-base leading-7 text-white/85 sm:text-lg">Read, explore and enjoy wonderful e-books for young readers.</p>
          <Link href="/books" className="mt-7 inline-flex rounded-full bg-white px-6 py-3 font-black text-indigo-700 shadow-lg">Start Reading</Link>
        </div>
      </section>
    );
  }

  const book = slides[active];

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl">
      <div className="relative min-h-[390px] sm:min-h-[470px]">
        {slides.map((item, index) => {
          const itemCover =
            item.cover_url ||
            (item.cover_path
              ? \`\\${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/\\${item.cover_path}\`
              : null);

          return itemCover ? (
            <div
              key={item.id}
              className={\`absolute inset-0 transition-opacity duration-1000 \${index === active ? "opacity-100" : "opacity-0"}\`}
              aria-hidden={index !== active}
            >
              <Image src={itemCover} alt="" fill sizes="100vw" className="object-cover object-center" priority={index === 0} />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            </div>
          ) : null;
        })}

        <div className="relative z-10 flex min-h-[390px] items-end p-6 sm:min-h-[470px] sm:p-10">
          <div className="max-w-xl text-white">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/75">Featured on Booknook Kids</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">{book.title}</h1>
            {book.author && <p className="mt-2 text-sm font-bold text-white/80 sm:text-base">By {book.author}</p>}
            {book.description && <p className="mt-4 line-clamp-2 max-w-lg text-sm leading-6 text-white/85 sm:text-base">{book.description}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={\`/books/\\${book.slug}\`} className="rounded-full bg-white px-6 py-3 font-black text-indigo-700 shadow-lg">
                {book.is_free ? "Read Free" : "Explore Book"}
              </Link>
              <Link href="/books" className="rounded-full border border-white/40 bg-white/10 px-6 py-3 font-black text-white backdrop-blur">
                Browse Books
              </Link>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 sm:bottom-7 sm:right-8">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={\`Show \\${item.title}\`}
                onClick={() => setActive(index)}
                className={\`h-2.5 rounded-full transition-all \${index === active ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"}\`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeHeroCarousel;
