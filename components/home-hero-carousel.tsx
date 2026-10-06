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

type HeroProps = { books: SlideBook[] };

const messages = [
  {
    eyebrow: "WELCOME TO BOOKNOOK KIDS",
    title: "Every Comic. A New World. 🌈",
    text: "Adventure, science, money, friendship, history, superheroes and more — discover a new world every time you open a comic.",
    accent: "from-violet-700 via-fuchsia-600 to-orange-400",
  },
  {
    eyebrow: "READ • DISCOVER • GROW",
    title: "Big Ideas. Fun Stories. 📚",
    text: "Comics made to entertain curious kids while opening the door to new ideas, skills and possibilities.",
    accent: "from-sky-700 via-cyan-600 to-emerald-500",
  },
  {
    eyebrow: "YOUR NEXT ADVENTURE IS HERE",
    title: "Pick a World. Start Reading. 🚀",
    text: "Explore the collection and find the comic that matches today's curiosity.",
    accent: "from-pink-700 via-rose-600 to-orange-500",
  },
];

export function HomeHeroCarousel({ books }: HeroProps) {
  const slides = useMemo(() => {
    const covers = books
      .filter((book) => book.cover_path || book.cover_url)
      .slice(0, 4);
    return covers.length ? covers : [];
  }, [books]);

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
      <div className="mx-auto grid min-h-[520px] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-14">
        <div className="relative z-10 text-white">
          <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] backdrop-blur">
            {message.eyebrow}
          </span>

          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            {message.title}
          </h1>

          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/90 sm:text-lg">
            {message.text}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/books"
              className="rounded-full bg-white px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5"
            >
              Explore Comics →
            </Link>
            <Link
              href="/free-reading"
              className="rounded-full border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
            >
              Read Free
            </Link>
          </div>

          <div className="mt-8 flex gap-2">
            {messages.map((item, index) => (
              <button
                key={item.eyebrow}
                type="button"
                aria-label={"Show hero " + (index + 1)}
                onClick={() => setActive(index)}
                className={
                  "h-2.5 rounded-full transition-all " +
                  (active === index ? "w-9 bg-white" : "w-2.5 bg-white/45")
                }
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[560px]">
          <div className="absolute inset-4 rounded-[3rem] bg-white/15 blur-2xl" />
          {slides.length ? (
            <div className="relative flex h-[390px] items-center justify-center sm:h-[430px]">
              {slides.map((book, index) => {
                const cover =
                  book.cover_url ||
                  (book.cover_path
                    ? "/api/books/cover?path=" + encodeURIComponent(book.cover_path)
                    : null);
                if (!cover) return null;

                const positions = [
                  "left-[4%] top-[9%] -rotate-[10deg]",
                  "left-[25%] top-[1%] rotate-[3deg]",
                  "right-[7%] top-[12%] rotate-[10deg]",
                  "right-[23%] bottom-[2%] -rotate-[4deg]",
                ];

                return (
                  <div
                    key={book.id}
                    className={
                      "absolute h-[285px] w-[190px] overflow-hidden rounded-2xl border-4 border-white/90 bg-white shadow-2xl transition-transform duration-500 sm:h-[330px] sm:w-[220px] " +
                      positions[index]
                    }
                    style={{ zIndex: slides.length - index }}
                  >
                    <Image
                      src={cover}
                      alt={book.title}
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative flex h-[390px] items-center justify-center sm:h-[430px]">
              <div className="rounded-[2rem] border border-white/25 bg-white/15 p-12 text-center text-white backdrop-blur">
                <div className="text-7xl">📚</div>
                <p className="mt-4 text-xl font-black">Your next comic is waiting.</p>
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
