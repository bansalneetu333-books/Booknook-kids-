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

const HERO_IMAGE =
  "https://dojmelznbqjuwyesvkpd.supabase.co/storage/v1/object/public/book-covers/booknook-hero-reference.jpg";

export function HomeHeroCarousel(_props: HeroProps) {
  return (
    <section className="bg-[#fffdf9] px-4 py-3 sm:px-6 sm:py-5 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] shadow-[0_14px_36px_rgba(23,32,51,0.12)]">
        <div
          className="aspect-[1171/689] w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
          role="img"
          aria-label="BookNook Kids — Every Comic. A New World."
        />

        <h1 className="sr-only">
          Discover amazing comics for curious minds
        </h1>

        <Link
          href="/books"
          aria-label="Explore all comics"
          className="absolute left-[6.5%] top-[72%] h-[11%] w-[34%] rounded-full focus:outline-none focus:ring-4 focus:ring-white/80"
        />
      </div>
    </section>
  );
}

export default HomeHeroCarousel;
