import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getBookBySlug } from "@/lib/books";
import { getCurrentUser, ownsBook } from "@/lib/library";
import { DownloadButton } from "@/components/download-button";
import WishlistButton from "@/components/wishlist-button";
import { publicCoverUrl } from "@/lib/storage";

export default async function BookDetailsPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const book = await getBookBySlug(slug);

  if (!book) notFound();

  const user = await getCurrentUser();
  const owned = user ? await ownsBook(book.id) : false;
  const coverUrl = publicCoverUrl(book.cover_path);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[280px_1fr]">
          <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-100 via-sky-100 to-amber-100 shadow-sm">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={`Cover of ${book.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center">
                <span
                  className="text-7xl"
                  aria-hidden="true"
                >
                  📚
                </span>
              </div>
            )}
          </div>

          <section>
            <p className="font-semibold text-indigo-600">
              {book.genre}
            </p>

            <h1 className="mt-2 text-4xl font-black md:text-5xl">
              {book.title}
            </h1>

            <p className="mt-3 text-lg text-slate-500">
              By {book.author}
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                Ages {book.age_category}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1">
                Digital EPUB
              </span>
            </div>

            <p className="mt-8 max-w-3xl whitespace-pre-line text-lg leading-8 text-slate-700">
              {book.description}
            </p>

            <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
              {owned ? (
                <>
                  <p className="font-bold text-emerald-600">
                    🎉 You already own this book!
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/reader/${book.id}`}
                      className="rounded-full bg-indigo-600 px-6 py-3 font-bold text-white"
                    >
                      📖 Read Now
                    </Link>

                    <Link
                      href="/library"
                      className="rounded-full border px-6 py-3 font-bold"
                    >
                      📚 My Library
                    </Link>

                    <DownloadButton bookId={book.id} />

                    <WishlistButton bookId={book.id} />
                  </div>
                </>
              ) : user ? (
                <>
                  <div className="text-3xl font-black">
                    ₹{book.price}
                  </div>

                  <Link
                    href={`/checkout?book=${book.id}`}
                    className="mt-4 inline-block rounded-full bg-indigo-600 px-7 py-3 font-bold text-white"
                  >
                    Buy Now
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-3xl font-black">
                    ₹{book.price}
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Create an account or login before purchasing.
                  </p>

                  <Link
                    href={`/login?next=/books/${book.slug}`}
                    className="mt-4 inline-block rounded-full bg-indigo-600 px-7 py-3 font-bold text-white"
                  >
                    Login to Buy
                  </Link>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
