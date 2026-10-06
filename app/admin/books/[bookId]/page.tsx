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
        is_free,
        cover_path,
        book_categories (
          categories (
            name
          )
        )
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
    is_free:
      Boolean(book.is_free),
    categories:
      (book.book_categories ?? [])
        .map((item: any) => Array.isArray(item.categories) ? item.categories[0]?.name : item.categories?.name)
        .filter(Boolean),
    cover_path:
      book.cover_path ?? null,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/books"
          className="text-sm font-semibold text-[var(--booknook-muted)] hover:text-[var(--booknook-primary)]"
        >
          ← Back to Books
        </Link>

        <Link
          href={`/admin/books/${book.id}/preview`}
          className="ml-4 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          📖 Preview Reader
        </Link>

        <p className="mt-5 text-sm font-bold uppercase tracking-wider text-violet-600">
          Admin
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-[var(--booknook-ink)]">
          Edit Book
        </h1>

        <p className="mt-2 max-w-2xl text-[var(--booknook-muted)]">
          Update the book information, pricing,
          cover, publishing settings, and ebook
          files.
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-5 shadow-sm sm:p-8">
        <BookForm book={formBook} />
      </div>
    </div>
  );
}
