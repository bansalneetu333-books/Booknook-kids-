"use client";

import Image from "next/image";
import Link from "next/link";

type BookCardProps = {
  book: {
    id: string;
    title: string;
    slug: string;
    author?: string | null;
    description?: string | null;
    price?: number | null;
    genre?: string | null;
    cover_path?: string | null;
    cover_url?: string | null;
  };
};

export function BookCard({ book }: BookCardProps) {
  const cover = "/api/books/cover?slug=" + encodeURIComponent(book.slug);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[#ece8f5] bg-white shadow-[0_8px_24px_rgba(23,32,51,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(23,32,51,0.1)]">
      <Link href={`/books/${book.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[2/3] w-full shrink-0 overflow-hidden bg-gradient-to-br from-violet-100 via-pink-100 to-sky-100">
          <Image
            src={cover}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
            className="object-contain object-center transition duration-300 group-hover:scale-[1.02]"
          />
        </div>
        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <div className="mb-2 min-h-5">
            {book.genre && (
              <span className="inline-block max-w-full truncate rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                {book.genre}
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-extrabold text-slate-900 sm:text-base">{book.title}</h3>
          {book.author && <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">By {book.author}</p>}
          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            <span className="min-w-0 whitespace-nowrap text-sm font-black text-slate-900 sm:text-lg">
              {typeof book.price === "number" && book.price > 0 ? `₹${book.price.toFixed(2)}` : "View details"}
            </span>
            <span className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#6d5dfc] px-2.5 py-2 text-[11px] font-black leading-none text-white transition-colors group-hover:bg-[#5848ed] sm:px-3 sm:text-xs">
              <span className="sm:hidden">View</span>
              <span className="hidden sm:inline">View Book</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default BookCard;
