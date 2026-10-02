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
    age_category?: string | null;
    cover_path?: string | null;
    cover_url?: string | null;
  };
};

export default function BookCard({ book }: BookCardProps) {
  const cover =
    book.cover_url ||
    (book.cover_path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${book.cover_path}`
      : null);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/books/${book.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-violet-100 via-pink-100 to-sky-100">
          {cover ? (
            <Image
              src={cover}
              alt={book.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <div className="mb-3 text-5xl">📚</div>
                <p className="font-bold text-slate-700">
                  {book.title}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          {book.genre && (
            <span className="mb-2 inline-block rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
              {book.genre}
            </span>
          )}

          <h3 className="line-clamp-2 text-base font-extrabold text-slate-900">
            {book.title}
          </h3>

          {book.author && (
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
              By {book.author}
            </p>
          )}

          {book.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
              {book.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-lg font-extrabold text-slate-900">
              {typeof book.price === "number"
                ? `₹${book.price.toFixed(2)}`
                : "Free"}
            </span>

            <span className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white transition group-hover:bg-violet-700">
              View Book
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
