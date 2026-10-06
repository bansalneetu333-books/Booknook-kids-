"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SlideBook = {
  id: string; title: string; slug: string; author?: string | null;
  description?: string | null; cover_path?: string | null;
  cover_url?: string | null; is_free?: boolean;
};

type FeatureSlide = {
  kind: "feature"; id: string; eyebrow: string; title: string;
  text: string; visual: string; button: string; href: string; accent: string;
};
type BookSlide = { kind: "book"; book: SlideBook };
type HeroSlide = FeatureSlide | BookSlide;
type HeroCarouselProps = { books: SlideBook[] };

const featureSlides: FeatureSlide[] = [
  { kind:"feature", id:"discover", eyebrow:"WELCOME TO BOOKNOOK KIDS", title:"Read. Discover. Grow. 📚✨", text:"Exciting stories that help children discover new ideas, knowledge and life skills.", visual:"📚  💡  🚀  ⭐", button:"Explore Books →", href:"/books", accent:"from-violet-700 via-indigo-700 to-sky-600" },
  { kind:"feature", id:"learn", eyebrow:"EVERY STORY CAN TEACH SOMETHING", title:"Discover Something New! 💡", text:"Explore science, money, friendship, history, creativity, adventure and more through fun stories.", visual:"🔬  💰  🤝  🌍", button:"Start Exploring →", href:"/books", accent:"from-sky-600 via-cyan-600 to-emerald-500" },
  { kind:"feature", id:"skills", eyebrow:"BIG LESSONS • FUN STORIES", title:"Stories They'll Enjoy. Lessons They'll Remember. ❤️", text:"Build confidence, communication, money skills and everyday life skills while enjoying an adventure.", visual:"🧠  💰  🤝  🌟", button:"Explore Life Skills →", href:"/books", accent:"from-pink-600 via-rose-600 to-orange-500" },
  { kind:"feature", id:"free", eyebrow:"START READING TODAY", title:"Great Stories. Free to Read. 🎁", text:"Discover selected books in our Free Reading collection and start a new reading adventure.", visual:"🎁  📖  ⭐  🚀", button:"Explore Free Books →", href:"/free-reading", accent:"from-emerald-600 via-teal-600 to-cyan-600" },
];

export function HomeHeroCarousel({ books }: HeroCarouselProps) {
  const slides = useMemo<HeroSlide[]>(() => {
    const bookSlides: BookSlide[] = books.filter((book) => book.cover_path || book.cover_url).slice(0, 5).map((book) => ({ kind:"book", book }));
    return [...featureSlides, ...bookSlides];
  }, [books]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 4500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;
  const slide = slides[active];

  return (
    <section className="relative overflow-hidden rounded-[2rem] shadow-xl">
      <div className="relative min-h-[400px] sm:min-h-[480px]">
        {slides.map((item, index) => {
          if (item.kind === "feature") {
            return (
              <div key={item.id} className={"absolute inset-0 bg-gradient-to-br " + item.accent + " transition-opacity duration-1000 " + (index === active ? "opacity-100" : "opacity-0")} aria-hidden={index !== active}>
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute right-6 top-8 hidden text-5xl opacity-20 sm:block">✦</div>
                <div className="absolute bottom-8 right-8 hidden text-7xl opacity-20 sm:block">📚</div>
              </div>
            );
          }

          const itemCover = item.book.cover_url || (item.book.cover_path ? process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/book-covers/" + item.book.cover_path : null);
          return itemCover ? (
            <div key={item.book.id} className={"absolute inset-0 transition-opacity duration-1000 " + (index === active ? "opacity-100" : "opacity-0")} aria-hidden={index !== active}>
              <Image src={itemCover} alt="" fill sizes="100vw" className="object-cover object-center" priority={index === 0} />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
            </div>
          ) : null;
        })}

        <div className="relative z-10 flex min-h-[400px] items-center p-6 sm:min-h-[480px] sm:p-10">
          {slide.kind === "feature" ? (
            <div className="max-w-2xl text-white">
              <div className="mb-5 inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-black tracking-[0.16em] backdrop-blur">{slide.eyebrow}</div>
              <div className="mb-4 text-3xl tracking-wider drop-shadow-lg sm:text-5xl">{slide.visual}</div>
              <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">{slide.title}</h1>
              <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/90 sm:text-lg">{slide.text}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={slide.href} className="rounded-full bg-white px-7 py-3.5 font-black text-slate-900 shadow-xl transition hover:scale-105">{slide.button}</Link>
                <Link href="/free-reading" className="rounded-full border border-white/40 bg-white/10 px-6 py-3.5 font-black text-white backdrop-blur transition hover:bg-white/20">Read Free</Link>
              </div>
            </div>
          ) : (
            <div className="max-w-xl text-white">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white/75">Featured on Booknook Kids</p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">{slide.book.title}</h1>
              {slide.book.author && <p className="mt-2 text-sm font-bold text-white/80 sm:text-base">By {slide.book.author}</p>}
              {slide.book.description && <p className="mt-4 line-clamp-2 max-w-lg text-sm leading-6 text-white/85 sm:text-base">{slide.book.description}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={"/books/" + slide.book.slug} className="rounded-full bg-white px-6 py-3 font-black text-indigo-700 shadow-lg">{slide.book.is_free ? "Read Free" : "Explore Book"}</Link>
                <Link href="/books" className="rounded-full border border-white/40 bg-white/10 px-6 py-3 font-black text-white backdrop-blur">Browse Books</Link>
              </div>
            </div>
          )}
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-5 right-5 z-20 flex max-w-[70%] items-center gap-1.5 overflow-hidden rounded-full bg-black/20 px-2 py-1.5 backdrop-blur sm:bottom-7 sm:right-8 sm:gap-2">
            {slides.map((item, index) => (
              <button key={item.kind === "feature" ? item.id : item.book.id} type="button" aria-label={item.kind === "feature" ? item.title : "Show " + item.book.title} onClick={() => setActive(index)} className={"h-2.5 rounded-full transition-all " + (index === active ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80")} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeHeroCarousel;
