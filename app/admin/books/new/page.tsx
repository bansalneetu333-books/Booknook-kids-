import Link from "next/link";

import BookForm from "@/components/admin/book-form";

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/books"
          className="text-sm font-semibold text-[var(--booknook-muted)] hover:text-[var(--booknook-primary)]"
        >
          ← Back to Books
        </Link>

        <p className="mt-5 text-sm font-bold uppercase tracking-wider text-violet-600">
          Admin
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-[var(--booknook-ink)]">
          Add New Book
        </h1>

        <p className="mt-2 max-w-2xl text-[var(--booknook-muted)]">
          Add your ebook, cover, description, price and publishing
          settings. EPUB and PDF files up to 150 MB are supported.
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-5 shadow-sm sm:p-8">
        <BookForm />
      </div>
    </div>
  );
}
