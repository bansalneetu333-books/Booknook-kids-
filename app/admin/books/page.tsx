"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Book = {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  price: number | null;
  genre: string | null;
  age_category: string | null;
  cover_path: string | null;
  published: boolean;
  featured: boolean;
  isFree?: boolean;
  epubAvailable?: boolean;
  pdfAvailable?: boolean;
  categories?: { name: string; slug: string; icon?: string | null }[];
  created_at: string;
  version?: {
    id?: string;
    version_number?: string | null;
    file_type?: string | null;
    file_size?: number | null;
    active?: boolean;
  } | null;
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/admin/books/list?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load books."
        );
      }

      setBooks(data.books || data || []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load books."
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  async function updateBook(
    bookId: string,
    action: "publish" | "featured" | "free",
    value: boolean
  ) {
    setBusyId(bookId);
    setMessage("");

    try {
      const endpoint =
        action === "publish"
          ? "/api/admin/books/publish"
          : action === "featured"
          ? "/api/admin/books/featured"
          : "/api/admin/books/free";

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId,
          [action === "publish"
            ? "published"
            : action === "featured"
            ? "featured"
            : "isFree"]: value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to update book."
        );
      }

      setBooks((current) =>
        current.map((book) =>
          book.id === bookId
            ? {
                ...book,
                ...(action === "publish"
                  ? { published: value }
                  : action === "featured"
                  ? { featured: value }
                  : { isFree: value }),
              }
            : book
        )
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update book."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteBook(bookId: string) {
    const confirmed = window.confirm(
      "Delete this book? This action cannot be undone."
    );

    if (!confirmed) return;

    setBusyId(bookId);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/books/delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to delete book."
        );
      }

      setBooks((current) =>
        current.filter((book) => book.id !== bookId)
      );

      setMessage("Book deleted successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete book."
      );
    } finally {
      setBusyId(null);
    }
  }

  function coverUrl(path: string | null) {
    if (!path) return null;

    const base =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!base) return null;

    return `${base}/storage/v1/object/public/book-covers/${path}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
            Admin
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            Books
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your ebook catalog, publishing status and
            featured books.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/books/new"
            className="inline-flex items-center justify-center rounded-full bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700"
          >
            + Add New Book
          </Link>

          <button
            type="button"
            onClick={async () => {
              setMessage("Making existing uploaded books available…");
              try {
                const response = await fetch("/api/admin/books/repair-availability", { method: "POST" });
                const data = await response.json();
                if (!response.ok) throw new Error(data?.error || "Unable to repair book availability.");
                const count = Array.isArray(data?.repaired) ? data.repaired.length : 0;
                const freeCount = Array.isArray(data?.freeMarked) ? data.freeMarked.length : 0;
                setMessage(`Made ${count} uploaded book(s) available${freeCount ? ` and marked ${freeCount} free` : ""}. Refreshing the catalogue…`);
                await loadBooks();
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Unable to repair book availability.");
              }
            }}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 font-bold text-white"
          >
            📚 Make Uploaded Books Available
          </button>

          <button
            type="button"
            onClick={async () => {
              setMessage("Checking Supabase for existing cover files…");
              try {
                const response = await fetch("/api/admin/books/repair-covers", {
                  method: "POST",
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data?.error || "Unable to repair covers.");
                setMessage(data?.message || "Cover check complete.");
                await loadBooks();
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Unable to repair covers.");
              }
            }}
            className="inline-flex items-center justify-center rounded-full border border-violet-200 bg-white px-6 py-3 font-bold text-violet-700"
          >
            🔧 Fix Missing Covers
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                loadBooks();
              }
            }}
            placeholder="Search books..."
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />

          <button
            type="button"
            onClick={loadBooks}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Search
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
          {message}
        </div>
      )}

      {/* Books */}
      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="text-4xl">📚</div>
          <p className="mt-3 font-semibold text-slate-600">
            Loading books...
          </p>
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="text-5xl">📚</div>

          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            No books found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Add your first ebook to the Booknook Kids store.
          </p>

          <Link
            href="/admin/books/new"
            className="mt-6 inline-flex rounded-full bg-violet-600 px-6 py-3 font-bold text-white"
          >
            Add New Book
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => {
            const cover = coverUrl(book.cover_path);
            const busy = busyId === book.id;

            return (
              <article
                key={book.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex gap-4 p-5">
                  <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={book.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">
                        📚
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 font-extrabold text-slate-900">
                      {book.title}
                    </h2>

                    {book.author && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        By {book.author}
                      </p>
                    )}

                    <p className="mt-2 font-extrabold text-slate-900">
                      ₹{Number(book.price || 0).toFixed(2)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                          book.published
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {book.published
                          ? "Published"
                          : "Draft"}
                      </span>

                      {book.featured && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">
                          Featured
                        </span>
                      )}
                      {book.isFree && (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                          Free Reading
                        </span>
                      )}

                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${book.epubAvailable ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        {book.epubAvailable ? "EPUB ✓" : "EPUB —"}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${book.pdfAvailable ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>
                        {book.pdfAvailable ? "PDF ✓" : "PDF —"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/admin/books/${book.id}`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>

                    <Link
                      href={`/books/${book.slug}`}
                      target="_blank"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </Link>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateBook(
                          book.id,
                          "publish",
                          !book.published
                        )
                      }
                      className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                    >
                      {book.published
                        ? "Unpublish"
                        : "Publish"}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateBook(
                          book.id,
                          "free",
                          !book.isFree
                        )
                      }
                      className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      {book.isFree ? "Remove Free" : "Make Free"}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateBook(
                          book.id,
                          "featured",
                          !book.featured
                        )
                      }
                      className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                    >
                      {book.featured
                        ? "Unfeature"
                        : "Feature"}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deleteBook(book.id)}
                    className="mt-2 w-full rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {busy ? "Processing..." : "Delete Book"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
