import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCard } from "@/components/book-card";
import { WishlistButton } from "@/components/wishlist-button";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { BookReviews } from "@/components/book-reviews";
import { getBookBySlug, getPublishedBooks } from "@/lib/books";

type BookPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BookDetailsPage({
  params,
}: BookPageProps) {
  const { slug } = await params;

  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const allBooks = await getPublishedBooks();

  const relatedBooks = allBooks
    .filter(
      (item) =>
        item.id !== book.id &&
        item.genre === book.genre
    )
    .slice(0, 4);

  const coverUrl = book.cover_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${book.cover_path}`
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-pink-50">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/books"
          className="text-sm font-semibold text-slate-600 transition hover:text-violet-700"
        >
          ← Back to Books
        </Link>
      </div>

      {/* Book details */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <div className="grid gap-0 lg:grid-cols-2">
            {/* Cover */}
            <div className="flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-100 to-sky-100 p-8 sm:p-12">
              <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="relative aspect-[3/4]">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={book.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 90vw, 500px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                      <div className="mb-5 text-7xl">
                        📚
                      </div>

                      <h2 className="text-xl font-extrabold text-slate-800">
                        {book.title}
                      </h2>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Information */}
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
              <div className="flex flex-wrap gap-2">
                {book.is_free && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
                    📖 Free Reading
                  </span>
                )}
                {book.genre && (
                  <span className="w-fit rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-700">
                    {book.genre}
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {book.title}
              </h1>

              {book.author && (
                <p className="mt-3 text-base text-slate-500">
                  By{" "}
                  <span className="font-semibold text-slate-700">
                    {book.author}
                  </span>
                </p>
              )}

              {book.age_category && (
                <p className="mt-2 text-sm text-slate-500">
                  Recommended age:{" "}
                  <span className="font-semibold text-slate-700">
                    {book.age_category}
                  </span>
                </p>
              )}

              {book.description && (
                <div className="mt-7">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    About this book
                  </h2>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                    {book.description}
                  </p>
                </div>
              )}

              <div className="my-8 border-t border-slate-200" />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Digital ebook
                  </p>

                  <p className="mt-1 text-3xl font-extrabold text-slate-900">
                    {book.is_free
                      ? "Free"
                      : Number(book.price) > 0
                      ? `₹${Number(book.price).toFixed(2)}`
                      : "Free"}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  Instant Access
                </span>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {book.is_free ? (
                  <Link
                    href={`/reader/${book.id}`}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3.5 font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    📖 Read Free
                  </Link>
                ) : (
                  <>
                    <Link
                      href={`/checkout?bookId=${book.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-violet-600 px-6 py-3.5 font-bold text-white shadow-sm transition hover:bg-violet-700"
                    >
                      🛒 Buy Now
                    </Link>
                    <AddToCartButton
                      book={{
                        id: book.id,
                        title: book.title,
                        slug: book.slug,
                        price: Number(book.price),
                        cover_path: book.cover_path,
                      }}
                    />
                  </>
                )}

                <WishlistButton bookId={book.id} />
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <h3 className="font-extrabold text-slate-900">
                  What you get
                </h3>

                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>✓ Personal digital library</li>
                  <li>✓ Online reading access</li>
                  <li>✓ Reading progress saved</li>
                  <li>✓ Secure book access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8"><BookReviews bookId={book.id} /></div>

      {/* Related books */}
      {relatedBooks.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
                More to explore
              </p>

              <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                You may also like
              </h2>
            </div>

            <Link
              href="/books"
              className="text-sm font-bold text-violet-700 hover:text-violet-800"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedBooks.map((relatedBook) => (
              <BookCard
                key={relatedBook.id}
                book={relatedBook}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
