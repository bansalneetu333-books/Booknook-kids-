"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  title: string;
  coverUrl: string;
  description?: string | null;
  genre?: string | null;
};

const slides = [
  { label: "Cover", eyebrow: "YOUR NEXT ADVENTURE", title: "Meet your next read", icon: "📚" },
  { label: "Inside", eyebrow: "INSIDE THE BOOK", title: "A story worth exploring", icon: "✨" },
  { label: "Experience", eyebrow: "WHAT YOU'LL EXPERIENCE", title: "Discover, imagine, and grow", icon: "🚀" },
  { label: "Takeaways", eyebrow: "IDEAS TO TAKE WITH YOU", title: "More than a story", icon: "💡" },
];

export function BookDetailShowcase({ title, coverUrl, description, genre }: Props) {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-white p-3 shadow-xl sm:p-4">
        {active === 0 ? (
          <div className="relative aspect-[3/4]">
            <Image src={coverUrl} alt={title + " cover"} fill priority sizes="(max-width: 1024px) 90vw, 500px" className="object-contain" />
          </div>
        ) : (
          <div className="flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-500 p-6 text-white sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]">{slide.eyebrow}</span>
              <span className="text-2xl" aria-hidden="true">{slide.icon}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white/80">{title}</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{slide.title}</h2>
              <p className="mt-4 text-sm leading-6 text-white/90">
                {active === 1
                  ? (description || "Open the book and step into a world of stories, ideas, and discovery.")
                  : active === 2
                  ? "Enjoy an engaging digital reading experience, explore new perspectives, and follow the story at your own pace."
                  : "Keep curious ideas, memorable moments, and inspiration with you long after you finish reading."}
              </p>
              {genre && <span className="mt-5 inline-flex rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold">{genre}</span>}
            </div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/75">BOOKNOOK KIDS · DIGITAL EDITION</p>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setActive((active + slides.length - 1) % slides.length)} aria-label="Previous book preview" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-white text-lg font-black text-violet-700 shadow-sm hover:bg-violet-50">‹</button>
        <div className="flex flex-1 items-center justify-center gap-2">
          {slides.map((item, index) => (
            <button key={item.label} type="button" onClick={() => setActive(index)} aria-label={"Show " + item.label + " slide"} aria-current={active === index ? "step" : undefined} className={"h-2.5 rounded-full transition-all " + (active === index ? "w-7 bg-violet-600" : "w-2.5 bg-violet-200 hover:bg-violet-400")} />
          ))}
        </div>
        <button type="button" onClick={() => setActive((active + 1) % slides.length)} aria-label="Next book preview" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-white text-lg font-black text-violet-700 shadow-sm hover:bg-violet-50">›</button>
      </div>
      <p className="mt-2 text-center text-xs font-bold text-violet-700">{slide.label} · {active + 1} of {slides.length}</p>
    </div>
  );
}
