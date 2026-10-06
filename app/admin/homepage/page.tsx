"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Book = {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  published: boolean;
  featured: boolean;
  sort_order: number | null;
};

export default function AdminHomepagePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/books/list",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load books."
        );
      }

      const list = Array.isArray(data?.books)
        ? data.books
        : Array.isArray(data)
        ? data
        : [];

      setBooks(list);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load books."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  async function toggleFeatured(
    book: Book
  ) {
    try {
      setSavingId(book.id);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/books/featured",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookId: book.id,
            featured: !book.featured,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update featured status."
        );
      }

      setBooks((current) =>
        current.map((item) =>
          item.id === book.id
            ? {
                ...item,
                featured: !book.featured,
              }
            : item
        )
      );

      setMessage(
        !book.featured
          ? `"${book.title}" is now featured on the homepage.`
          : `"${book.title}" was removed from featured books.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update featured status."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function togglePublished(
    book: Book
  ) {
    try {
      setSavingId(book.id);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/books/publish",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookId: book.id,
            published: !book.published,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update publishing status."
        );
      }

      setBooks((current) =>
        current.map((item) =>
          item.id === book.id
            ? {
                ...item,
                published: !book.published,
              }
            : item
        )
      );

      setMessage(
        !book.published
          ? `"${book.title}" is now published.`
          : `"${book.title}" was unpublished.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update publishing status."
      );
    } finally {
      setSavingId(null);
    }
  }

  const featuredBooks = books.filter(
    (book) => book.featured
  );

  const publishedBooks = books.filter(
    (book) => book.published
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--booknook-primary)]">
            Admin
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-[var(--booknook-ink)]">
            Homepage
          </h1>

          <p className="mt-2 max-w-2xl text-[var(--booknook-muted)]">
            Control which books are published and highlighted
            on the Booknook Kids homepage.
          </p>
        </div>

        <Link
          href="/admin/books/new"
          className="rounded-xl bg-[var(--booknook-primary)] px-5 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
        >
          + Add New Book
        </Link>
      </div>

      {error && (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[var(--booknook-muted)]">
            Total Books
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[var(--booknook-ink)]">
            {books.length}
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[var(--booknook-muted)]">
            Published
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[var(--booknook-ink)]">
            {publishedBooks.length}
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[var(--booknook-muted)]">
            Featured
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[var(--booknook-ink)]">
            {featuredBooks.length}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--booknook-border)] bg-white shadow-sm">
        <div className="border-b border-[var(--booknook-border)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
            Homepage Books
          </h2>

          <p className="mt-1 text-sm text-[var(--booknook-muted)]">
            Featured books can be highlighted in your homepage
            book section.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--booknook-muted)]">
            Loading books...
          </div>
        ) : books.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">📚</div>

            <h3 className="mt-3 font-extrabold text-[var(--booknook-ink)]">
              No books yet
            </h3>

            <p className="mt-1 text-sm text-[var(--booknook-muted)]">
              Add your first book from the admin books section.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {books.map((book) => (
              <div
                key={book.id}
                className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-[var(--booknook-ink)]">
                      {book.title}
                    </h3>

                    {book.featured && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                        ⭐ Featured
                      </span>
                    )}

                    {book.published ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#f1f2f7] px-3 py-1 text-xs font-bold text-[var(--booknook-muted)]">
                        Draft
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-[var(--booknook-muted)]">
                    {book.author || "Unknown author"}
                  </p>

                  <p className="mt-1 text-xs text-[#8a90a0]">
                    Sort order: {book.sort_order ?? 0}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/books/${book.id}`}
                    className="rounded-[1.25rem] border border-[#ddd9e8] bg-white px-4 py-2.5 text-sm font-bold text-[var(--booknook-ink)] transition hover:bg-[#f7f8fc]"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    disabled={savingId === book.id}
                    onClick={() =>
                      togglePublished(book)
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      book.published
                        ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {savingId === book.id
                      ? "Saving..."
                      : book.published
                      ? "Unpublish"
                      : "Publish"}
                  </button>

                  <button
                    type="button"
                    disabled={savingId === book.id}
                    onClick={() =>
                      toggleFeatured(book)
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      book.featured
                        ? "border border-[#ddd9e8] bg-white text-[var(--booknook-ink)] hover:bg-[#f7f8fc]"
                        : "bg-[var(--booknook-primary)] text-white hover:opacity-90"
                    }`}
                  >
                    {savingId === book.id
                      ? "Saving..."
                      : book.featured
                      ? "Remove Featured"
                      : "Make Featured"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
