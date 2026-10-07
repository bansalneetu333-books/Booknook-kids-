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
    title: "Discover amazing comics for curious minds.",
    text: "Illustrated adventures, ideas and skills made for young readers.",
    accent: "from-violet-700 via-fuchsia-600 to-orange-400",
  },
  {
    eyebrow: "READ • DISCOVER • GROW",
    title: "Big ideas. Fun stories.",
    text: "Open a comic and step into a world built to entertain, inspire and teach.",
    accent: "from-sky-700 via-cyan-600 to-emerald-500",
  },
  {
    eyebrow: "YOUR NEXT ADVENTURE IS HERE",
    title: "Pick a world. Start reading.",
    text: "Explore science, money, friendship, history, superheroes and more.",
    accent: "from-pink-700 via-rose-600 to-orange-500",
  },
];

const positions = [
  "left-[1%] top-[13%] -rotate-[9deg]",
  "left-[25%] top-[1%] rotate-[2deg]",
  "right-[1%] top-[12%] rotate-[9deg]",
];

export function HomeHeroCarousel({ books }: HeroProps) {
  const slides = useMemo(
    () => books.filter((book) => book.cover_path || book.cover_url),
    [books]
  );
  const [activeBook, setActiveBook] = useState(0);
  const [activeMessage, setActiveMessage] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;

    const timer = window.setInterval(() => {
      setActiveBook((current) => (current + 1) % slides.length);
      setActiveMessage((current) => (current + 1) % messages.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const message = messages[activeMessage];

  const visibleBooks = useMemo(() => {
    if (!slides.length) return [];

    const count = Math.min(3, slides.length);
    return Array.from({ length: count }, (_, position) => ({
      book: slides[(activeBook + position) % slides.length],
      position,
    }));
  }, [activeBook, slides]);

  return (
    <section className="bg-[#fffdf9] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div
        className={
          "relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br " +
          message.accent +
          " shadow-[0_18px_45px_rgba(23,32,51,0.14)]"
        }
      >
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative grid min-h-[370px] items-center gap-3 px-5 py-6 sm:min-h-[420px] sm:px-8 sm:py-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
          <div className="relative z-10 max-w-xl text-white">
            <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur sm:text-[11px]">
              {message.eyebrow}
            </span>

            <h1 className="mt-4 max-w-lg text-[2.35rem] font-black leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">
              {message.title}
            </h1>

            <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-white/90 sm:text-base">
              {message.text}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/books"
                className="rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5"
              >
                Explore Comics →
              </Link>
              <Link
                href="/free-reading"
                className="rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                Read Free
              </Link>
            </div>

            <div className="mt-5 flex gap-2">
              {messages.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  aria-label={"Show hero message " + (index + 1)}
                  onClick={() => setActiveMessage(index)}
                  className={
                    "h-2 rounded-full transition-all " +
                    (activeMessage === index ? "w-9 bg-white" : "w-2 bg-white/45")
                  }
                />
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-[185px] w-full max-w-[390px] sm:h-[245px] lg:h-[305px]">
            {visibleBooks.length ? (
              visibleBooks.map(({ book, position }) => {
                const cover =
                  book.cover_url ||
                  (book.cover_path
                    ? "/api/books/cover?path=" + encodeURIComponent(book.cover_path)
                    : null);

                if (!cover) return null;

                return (
                  <Link
                    key={book.id}
                    href={"/books/" + book.slug}
                    aria-label={"View " + book.title}
                    className={
                      "absolute h-[174px] w-[116px] overflow-hidden rounded-xl border-[3px] border-white/90 bg-white shadow-2xl transition-all duration-700 hover:scale-[1.03] sm:h-[220px] sm:w-[147px] lg:h-[270px] lg:w-[180px] " +
                      positions[position]
                    }
                    style={{ zIndex: visibleBooks.length - position }}
                  >
                    <Image
                      src={cover}
                      alt={book.title}
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  </Link>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-6xl">📚</div>
                  <p className="mt-3 text-lg font-black">Your next comic is waiting.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHeroCarousel;
