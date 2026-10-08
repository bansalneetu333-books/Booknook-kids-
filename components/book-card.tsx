"use client";

import Image from "next/image";
import Link from "next/link";

type BookCardProps = {
  book: {
    id: string; title: string; slug: string; author?: string | null; description?: string | null;
    price?: number | null; genre?: string | null; age_category?: string | null;
    cover_path?: string | null; cover_url?: string | null; is_free?: boolean;
  };
};

export function BookCard({ book }: BookCardProps) {
  const cover = "/api/books/cover?slug=" + encodeURIComponent(book.slug);

  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-[#ece8f5] bg-white shadow-[0_8px_24px_rgba(23,32,51,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(23,32,51,0.1)]">
      <Link href={`/books/${book.slug}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-violet-100 via-pink-100 to-sky-100">
          {cover ? (
            <Image src={cover} alt={book.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px" className="object-contain object-center transition duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center"><div><div className="mb-3 text-5xl">📚</div><p className="font-bold text-slate-700">{book.title}</p></div></div>
          )}
        </div>
        <div className="p-3.5 sm:p-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {book.is_free && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">📖 Free</span>}
            {book.genre && <span className="max-w-full truncate rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">{book.genre}</span>}
          </div>
          <h3 className="line-clamp-2 text-sm font-extrabold text-slate-900 sm:text-base">{book.title}</h3>
          {book.author && <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">By {book.author}</p>}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-base font-black text-slate-900 sm:text-lg">{book.is_free ? "Free" : typeof book.price === "number" ? `₹${book.price.toFixed(2)}` : "Free"}</span>
            <span className="rounded-full bg-[#6d5dfc] px-3 py-2 text-[11px] font-black text-white sm:text-xs">{book.is_free ? "Read Free" : "View Book"}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
export default BookCard;