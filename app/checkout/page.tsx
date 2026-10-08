import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutButton } from "@/components/checkout-button";
import { SiteHeader } from "@/components/site-header";
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
      <main className="min-h-screen bg-[#fffdf9] px-4 py-12">
        <div className="mx-auto max-w-2xl bn-surface p-8 text-center">
          <div className="mb-4 text-5xl">📚</div>

          <h1 className="text-2xl font-extrabold text-[var(--booknook-ink)]">
            Book not found
          </h1>

          <p className="mt-2 text-[var(--booknook-muted)]">
            This book is no longer available for purchase.
          </p>

          <Link
            href="/books"
            className="mt-6 inline-flex rounded-full bg-[var(--booknook-primary)] px-6 py-3 font-bold text-white transition hover:opacity-90"
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
      <main className="min-h-screen bg-[#fffdf9] px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--booknook-border)] bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">🎉</div>

          <h1 className="text-2xl font-extrabold text-[var(--booknook-ink)]">
            You already own this book
          </h1>

          <p className="mt-2 text-[var(--booknook-muted)]">
            All selected books are already in your
            Booknook Kids library.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/library"
              className="rounded-full bg-[var(--booknook-primary)] px-6 py-3 font-bold text-white transition hover:opacity-90"
            >
              Go to My Library
            </Link>

            <Link
              href="/books"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 font-bold text-[var(--booknook-ink)] transition hover:bg-[#fffdf9]"
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

  return (
    <>
      <SiteHeader />
      <main className="bn-page px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/books/${book.slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--booknook-muted)] hover:text-violet-700"
        >
          ← Back to Book
        </Link>

        <div className="bn-surface overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            {/* Book previews */}
            <div className="bg-gradient-to-br from-violet-100 via-pink-100 to-sky-100 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3">
                {availableBooks.map((item) => (
                  <Link key={item.id} href={`/books/${item.slug}`} className="group">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-white shadow-md">
                      <Image
                        src={"/api/books/cover?slug=" + encodeURIComponent(item.slug)}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 45vw, 220px"
                        className="object-cover transition duration-200 group-hover:scale-[1.02]"
                        unoptimized
                      />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs font-black text-[var(--booknook-ink)]">{item.title}</p>
                    <p className="text-[11px] text-[var(--booknook-muted)]">₹{Number(item.price).toFixed(2)}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Checkout details */}
            <div className="p-7 sm:p-10">
              <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                DIGITAL EBOOK
              </span>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--booknook-ink)]">
                {book.title}
              </h1>

              {availableBooks.length === 1 && book.author && (
                <p className="mt-2 text-[var(--booknook-muted)]">
                  By {book.author}
                </p>
              )}

              <div className="my-7 border-t border-[var(--booknook-border)]" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--booknook-muted)]">
                  Price
                </span>

                <span className="text-3xl font-extrabold text-[var(--booknook-ink)]">
                  ₹{total.toFixed(2)}
                </span>
              </div>

              <div className="mt-7 rounded-2xl bg-[#fffdf9] p-5">
                <h2 className="font-extrabold text-[var(--booknook-ink)]">
                  What you&apos;ll get
                </h2>

                <ul className="mt-3 space-y-2 text-sm text-[var(--booknook-muted)]">
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

              <p className="mt-4 text-center text-xs leading-5 text-[var(--booknook-muted)]">
                Payments are processed securely through Razorpay.
                Your ebook becomes available after successful
                payment verification.
              </p>
            </div>
          </div>
        </div>
      </div>
      </main>
    </>
  );
}
