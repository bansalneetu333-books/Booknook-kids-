"use client";

import Link from "next/link";

type SlideBook = {
  id: string;
  title: string;
  slug: string;
  cover_path?: string | null;
  cover_url?: string | null;
};

type HeroProps = { books: SlideBook[] };

export function HomeHeroCarousel(_props: HeroProps) {
  return (
    <section className="bg-[#fffdf9] px-4 py-3 sm:px-6 sm:py-5 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] shadow-[0_14px_36px_rgba(23,32,51,0.12)]">
        <div
          className="aspect-[1180/695] w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/booknook-hero-universal.svg')" }}
          role="img"
          aria-label="BookNook Kids illustrated world with children exploring comics"
        />

        <h1 className="sr-only">
          Discover amazing comics for curious minds
        </h1>

        <div className="absolute inset-0">
          <Link
            href="/books"
            aria-label="Explore all comics"
            className="absolute left-[6.5%] top-[68%] h-[13%] w-[35%] rounded-full focus:outline-none focus:ring-4 focus:ring-white/80"
          />
          <Link
            href="/free-reading"
            aria-label="Read free comics"
            className="absolute left-[40%] top-[68%] h-[13%] w-[18%] rounded-full focus:outline-none focus:ring-4 focus:ring-white/80"
          />
        </div>
      </div>
    </section>
  );
}

export default HomeHeroCarousel;
