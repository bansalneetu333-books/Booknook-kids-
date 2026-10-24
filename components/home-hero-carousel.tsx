"use client";

import { useEffect, useState } from "react";

type HeroCarouselProps = { books?: unknown[] };

const HERO_SLIDES = [
  { src: "/hero-slides/slide-1.webp", alt: "BookNook Kids digital story library and reading categories" },
  { src: "/hero-slides/slide-2.webp", alt: "BookNook Kids e-book features and reading experience" },
  { src: "/hero-slides/slide-3.webp", alt: "Children discovering illustrated digital stories" },
  { src: "/hero-slides/slide-4.webp", alt: "BookNook Kids e-books including science, friendship, money skills and adventure" },
  { src: "/hero-slides/slide-5.webp", alt: "BookNook Kids benefits: illustrations, curiosity, life skills and reading on devices" },
];

export function HomeHeroCarousel(_props: HeroCarouselProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="w-full bg-transparent py-2 sm:py-3" aria-label="BookNook Kids highlights">
      <div className="relative mx-auto w-full max-w-6xl">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            className={`transition-opacity duration-700 ease-in-out ${index === active ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}
            aria-hidden={index !== active}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.src}
              alt={slide.alt}
              className="block h-auto max-h-[460px] w-full object-contain"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}
        <div className="mt-3 flex items-center justify-center gap-2" aria-label="Choose slideshow image">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
              className={`h-2.5 rounded-full transition-all ${index === active ? "w-7 bg-orange-600" : "w-2.5 bg-slate-300 hover:bg-slate-500"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomeHeroCarousel;
