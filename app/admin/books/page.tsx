import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { publicCoverUrl } from "@/lib/storage";

export default async function AdminBooksPage() {
  const { supabase } = await requireAdmin();

  const { data: books, error } = await supabase
    .from("books")
    .select(
      "id,title,slug,author,price,genre,published,featured,cover_path,created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load books.");
  }

  return (
    <main className="p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black text-indigo-600">
            Your shelf
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Books
          </h1>

          <p className="mt-1 text-slate-500">
            Add as many titles as your storage allows.
          </p>
        </div>

        <Link
          href="/admin/books/new"
          className="rounded-full bg-indigo-600 px-5 py-3 font-black text-white shadow-lg shadow-indigo-200"
        >
          ＋ Add
        </Link>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {books?.map((book) => {
          const cover = publicCoverUrl(book.cover_path);

          return (
            <article
              key={book.id}
              className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-indigo-50">
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-2xl">
                    📚
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 font-black">
                    {book.title}
                  </h2>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                      book.published
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {book.published ? "Live" : "Draft"}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {book.author} · {book.genre}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="font-black">
                    ₹{book.price}
                  </span>

                  <Link
                    href={`/admin/books/${book.id}`}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
