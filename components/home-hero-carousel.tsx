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
    title: "Stories that spark curiosity. 🌈",
    text: "Discover illustrated adventures, ideas and skills made for curious young readers.",
    accent: "from-violet-700 via-fuchsia-600 to-orange-400",
  },
  {
    eyebrow: "READ • DISCOVER • GROW",
    title: "Big ideas. Fun stories. 📚",
    text: "Open a comic and step into a world built to entertain, inspire and teach.",
    accent: "from-sky-700 via-cyan-600 to-emerald-500",
  },
  {
    eyebrow: "YOUR NEXT ADVENTURE IS HERE",
    title: "Pick a world. Start reading. 🚀",
    text: "Explore science, money, friendship, history, superheroes and more.",
    accent: "from-pink-700 via-rose-600 to-orange-500",
  },
];

export function HomeHeroCarousel({ books }: HeroProps) {
  const slides = useMemo(
    () => books.filter((book) => book.cover_path || book.cover_url).slice(0, 4),
    [books]
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % messages.length),
      5000
    );
    return () => window.clearInterval(timer);
  }, []);

  const message = messages[active];

  return (
    <section className={"relative overflow-hidden bg-gradient-to-br " + message.accent}>
      <div className="mx-auto grid min-h-[430px] max-w-7xl items-center gap-5 px-4 py-7 sm:min-h-[470px] sm:px-6 sm:py-9 lg:grid-cols-[1fr_.9fr] lg:px-8">
        <div className="relative z-10 text-white">
          <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur sm:text-[11px]">
            {message.eyebrow}
          </span>

          <h1 className="mt-4 max-w-xl text-[2.55rem] font-black leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">
            {message.title}
          </h1>

          <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-white/90 sm:text-base sm:leading-7">
            {message.text}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/books"
              className="rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5"
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
                aria-label={"Show hero " + (index + 1)}
                onClick={() => setActive(index)}
                className={
                  "h-2 rounded-full transition-all " +
                  (active === index ? "w-9 bg-white" : "w-2 bg-white/45")
                }
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[480px]">
          <div className="absolute inset-8 rounded-[3rem] bg-white/15 blur-2xl" />
          {slides.length ? (
            <div className="relative h-[270px] sm:h-[330px]">
              {slides.map((book, index) => {
                const cover =
                  book.cover_url ||
                  (book.cover_path
                    ? "/api/books/cover?path=" + encodeURIComponent(book.cover_path)
                    : null);
                if (!cover) return null;

                const positions = [
                  "left-[2%] top-[8%] -rotate-[9deg]",
                  "left-[24%] top-[0%] rotate-[2deg]",
                  "right-[3%] top-[10%] rotate-[9deg]",
                  "right-[20%] bottom-[0%] -rotate-[3deg]",
                ];

                return (
                  <div
                    key={book.id}
                    className={
                      "absolute h-[220px] w-[147px] overflow-hidden rounded-2xl border-4 border-white/90 bg-white shadow-2xl transition-transform duration-500 sm:h-[285px] sm:w-[190px] " +
                      positions[index]
                    }
                    style={{ zIndex: slides.length - index }}
                  >
                    <Image
                      src={cover}
                      alt={book.title}
                      fill
                      sizes="190px"
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative flex h-[270px] items-center justify-center sm:h-[330px]">
              <div className="rounded-[2rem] border border-white/25 bg-white/15 p-10 text-center text-white backdrop-blur">
                <div className="text-6xl">📚</div>
                <p className="mt-3 text-lg font-black">Your next comic is waiting.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute -left-20 top-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
    </section>
  );
}

export default HomeHeroCarousel;
