import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutButton } from "@/components/checkout-button";
import { getCheckoutBook, getPurchasedBookIds } from "@/lib/checkout";
import { createClient } from "@/lib/supabase/server";

type CheckoutPageProps = {
  searchParams: Promise<{
    bookId?: string;
    bookIds?: string;
  }>;
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;
  const bookIds = params.bookIds?.split(",").filter(Boolean) || (params.bookId ? [params.bookId] : []);

  if (bookIds.length === 0) {
    redirect("/books");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/checkout?bookIds=${bookIds.join(",")}`
      )}`
    );
  }

  const books = await Promise.all(bookIds.map((id) => getCheckoutBook(id)));
  const validBooks = books.filter((book): book is NonNullable<typeof book> => Boolean(book));

  if (validBooks.length !== bookIds.length) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">📚</div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            Book not found
          </h1>

          <p className="mt-2 text-slate-600">
            This book is no longer available for purchase.
          </p>

          <Link
            href="/books"
            className="mt-6 inline-flex rounded-full bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700"
          >
            Browse Books
          </Link>
        </div>
      </main>
    );
  }

  const purchasedIds = await getPurchasedBookIds(validBooks.map((book) => book.id));
  const availableBooks = validBooks.filter((book) => !purchasedIds.has(book.id));

  if (availableBooks.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">🎉</div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            You already own this book
          </h1>

          <p className="mt-2 text-slate-600">
            All selected books are already in your
            Booknook Kids library.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/library"
              className="rounded-full bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700"
            >
              Go to My Library
            </Link>

            <Link
              href="/books"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Books
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const total = availableBooks.reduce((sum, book) => sum + Number(book.price), 0);
  const book = availableBooks[0];
  const coverUrl = book.cover_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${book.cover_path}`
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-pink-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/books/${book.slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-700"
        >
          ← Back to Book
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <div className="grid gap-0 md:grid-cols-2">
            {/* Book preview */}
            <div className="flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-100 to-sky-100 p-8 sm:p-12">
              <div className="w-full max-w-sm">
                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-white shadow-2xl">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                      <div className="mb-4 text-7xl">
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

            {/* Checkout details */}
            <div className="p-7 sm:p-10">
              <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                DIGITAL EBOOK
              </span>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
                {book.title}
              </h1>

              {availableBooks.length === 1 && book.author && (
                <p className="mt-2 text-slate-500">
                  By {book.author}
                </p>
              )}

              <div className="my-7 border-t border-slate-200" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">
                  Price
                </span>

                <span className="text-3xl font-extrabold text-slate-900">
                  ₹{total.toFixed(2)}
                </span>
              </div>

              <div className="mt-7 rounded-2xl bg-slate-50 p-5">
                <h2 className="font-extrabold text-slate-900">
                  What you&apos;ll get
                </h2>

                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>✓ Your ebook in your personal library</li>
                  <li>✓ Online reading access</li>
                  <li>✓ Reading progress saved automatically</li>
                  <li>✓ Secure access to your purchased book</li>
                </ul>
              </div>

              <div className="mt-7">
                <CheckoutButton
                  bookIds={availableBooks.map((item) => item.id)}
                  price={total}
                  title={availableBooks.length > 1 ? `${availableBooks.length} Book Cart` : book.title}
                />
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Payments are processed securely through Razorpay.
                Your ebook becomes available after successful
                payment verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
