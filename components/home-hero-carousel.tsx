"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SlideBook = {
  id: string;
  title: string;
  slug: string;
  cover_path?: string | null;
  cover_url?: string | null;
};

type HeroProps = { books: SlideBook[] };

const messages = [
  {
    eyebrow: "EVERY COMIC. A NEW WORLD.",
    title: "Discover amazing comics.",
    text: "Adventures, ideas and skills for curious young readers.",
    accent: "from-violet-700 via-fuchsia-600 to-orange-400",
  },
  {
    eyebrow: "READ • DISCOVER • GROW",
    title: "Big ideas. Fun stories.",
    text: "Open a comic and discover a new world.",
    accent: "from-sky-700 via-cyan-600 to-emerald-500",
  },
  {
    eyebrow: "YOUR NEXT ADVENTURE",
    title: "Pick a world. Start reading.",
    text: "Science, money, friendship, history, superheroes and more.",
    accent: "from-pink-700 via-rose-600 to-orange-500",
  },
];

export function HomeHeroCarousel({ books }: HeroProps) {
  const slides = useMemo(
    () => books.filter((book) => book.cover_path || book.cover_url),
    [books]
  );
  const [activeBook, setActiveBook] = useState(0);
  const [activeMessage, setActiveMessage] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveBook((current) => (current + 1) % slides.length);
      setActiveMessage((current) => (current + 1) % messages.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const message = messages[activeMessage];
  const book = slides[activeBook % Math.max(slides.length, 1)];

  const cover =
    book?.cover_url ||
    (book?.cover_path
      ? "/api/books/cover?path=" + encodeURIComponent(book.cover_path)
      : null);

  return (
    <section className="bg-[#fffdf9] px-4 py-3 sm:px-6 sm:py-5 lg:px-8">
      <div
        className={
          "relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] bg-gradient-to-br " +
          message.accent +
          " shadow-[0_16px_38px_rgba(23,32,51,0.12)]"
        }
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex min-h-[300px] items-center px-5 py-5 sm:min-h-[330px] sm:px-8 sm:py-6 lg:min-h-[350px] lg:px-10">
          <div className="relative z-20 w-[58%] max-w-xl text-white sm:w-[56%]">
            <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] backdrop-blur sm:px-4 sm:py-2 sm:text-[10px]">
              {message.eyebrow}
            </span>

            <h1 className="mt-3 max-w-md text-[2rem] font-black leading-[0.98] tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
              {message.title}
            </h1>

            <p className="mt-3 max-w-sm text-xs font-semibold leading-5 text-white/90 sm:text-sm sm:leading-6">
              {message.text}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/books"
                className="rounded-full bg-white px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg sm:px-6 sm:py-3 sm:text-sm"
              >
                Explore Comics →
              </Link>
              <Link
                href="/free-reading"
                className="rounded-full border border-white/40 bg-white/10 px-4 py-2.5 text-xs font-black text-white backdrop-blur sm:px-5 sm:py-3 sm:text-sm"
              >
                Read Free
              </Link>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {messages.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  aria-label={"Show hero message " + (index + 1)}
                  onClick={() => setActiveMessage(index)}
                  className={
                    "h-1.5 rounded-full transition-all " +
                    (activeMessage === index ? "w-8 bg-white" : "w-1.5 bg-white/45")
                  }
                />
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 w-[52%] overflow-hidden">
            <div className="absolute right-[-6%] top-1/2 h-[230px] w-[180px] -translate-y-1/2 rotate-6 rounded-[2rem] bg-white/15 blur-xl sm:h-[280px] sm:w-[220px]" />

            {cover && book ? (
              <Link
                href={"/books/" + book.slug}
                aria-label={"View " + book.title}
                className="pointer-events-auto absolute right-[8%] top-1/2 h-[230px] w-[154px] -translate-y-1/2 rotate-[6deg] overflow-hidden rounded-[1.1rem] border-4 border-white/90 bg-white shadow-2xl transition duration-500 hover:scale-[1.03] sm:right-[10%] sm:h-[280px] sm:w-[187px] lg:h-[300px] lg:w-[200px]"
              >
                <Image
                  src={cover}
                  alt={book.title}
                  fill
                  sizes="200px"
                  className="object-cover"
                  priority
                />
              </Link>
            ) : (
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-6xl">📚</div>
            )}

            <span className="absolute right-[48%] top-[15%] text-3xl sm:text-4xl">✨</span>
            <span className="absolute right-[5%] bottom-[12%] text-3xl sm:text-4xl">📚</span>
            <span className="absolute right-[44%] bottom-[8%] text-2xl sm:text-3xl">🌈</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHeroCarousel;
