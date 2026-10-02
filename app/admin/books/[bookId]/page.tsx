import Link from "next/link";
import BookForm from "@/components/admin/book-form";

type Props = {
  params: Promise<{
    bookId: string;
  }>;
};

export default async function EditBookPage({ params }: Props) {
  const { bookId } = await params;

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
          Update the book information, pricing, cover, publishing settings,
          and ebook files.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <BookForm bookId={bookId} />
      </div>
    </div>
  );
}
