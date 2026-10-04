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
          <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
            Admin
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            Homepage
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Control which books are published and highlighted
            on the Booknook Kids homepage.
          </p>
        </div>

        <Link
          href="/admin/books/new"
          className="rounded-xl bg-violet-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-violet-700"
        >
          + Add New Book
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total Books
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {books.length}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Published
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {publishedBooks.length}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Featured
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {featuredBooks.length}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-extrabold text-slate-900">
            Homepage Books
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Featured books can be highlighted in your homepage
            book section.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading books...
          </div>
        ) : books.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">📚</div>

            <h3 className="mt-3 font-extrabold text-slate-900">
              No books yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
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
                    <h3 className="font-extrabold text-slate-900">
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
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Draft
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {book.author || "Unknown author"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Sort order: {book.sort_order ?? 0}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/books/${book.id}`}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
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
                        ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        : "bg-violet-600 text-white hover:bg-violet-700"
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
