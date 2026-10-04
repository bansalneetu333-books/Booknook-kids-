import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import BookForm from "@/components/admin/book-form";
import { requireAdmin } from "@/lib/admin";

type Props = {
  params: Promise<{
    bookId: string;
  }>;
};

export default async function EditBookPage({
  params,
}: Props) {
  const { bookId } = await params;

  const {
    supabase,
    isAdmin,
  } = await requireAdmin();

  if (!isAdmin) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/admin/books/${bookId}`
      )}`
    );
  }

  const {
    data: book,
    error,
  } = await supabase
    .from("books")
    .select(
      `
        id,
        title,
        slug,
        author,
        description,
        price,
        genre,
        age_category,
        published,
        featured,
        cover_path
      `
    )
    .eq("id", bookId)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load admin book:",
      error
    );

    notFound();
  }

  if (!book) {
    notFound();
  }

  const formBook = {
    id: book.id,
    title: book.title ?? "",
    slug: book.slug ?? "",
    author: book.author ?? "",
    description: book.description ?? "",
    price: Number(book.price ?? 0),
    genre: book.genre ?? "",
    age_category:
      book.age_category ?? "",
    published:
      Boolean(book.published),
    featured:
      Boolean(book.featured),
    cover_path:
      book.cover_path ?? null,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/books"
          className="text-sm font-semibold text-slate-600 hover:text-violet-700"
        >
          ← Back to Books
        </Link>

        <p className="mt-5 text-sm font-bold uppercase tracking-wider text-violet-600">
          Admin
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
          Edit Book
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          Update the book information, pricing,
          cover, publishing settings, and ebook
          files.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <BookForm book={formBook} />
      </div>
    </div>
  );
}
