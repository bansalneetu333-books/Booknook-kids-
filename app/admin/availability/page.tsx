"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  epubAvailable?: boolean;
  coverPath?: string | null;
};

function Status({ available, label }: { available: boolean; label: string }) {
  return (
    <span
      aria-label={`${label}: ${available ? "available" : "missing"}`}
      className={available
        ? "inline-flex min-w-16 justify-center rounded-xl bg-emerald-100 px-3 py-2 text-sm font-extrabold text-emerald-800"
        : "inline-flex min-w-16 justify-center rounded-xl bg-rose-100 px-3 py-2 text-sm font-extrabold text-rose-700"}
    >
      {available ? "YES" : "NO"}
    </span>
  );
}

export default function AdminAvailabilityPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/books/list", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to load availability.");
      setBooks((data.books || []).map((book: Book & { cover_path?: string | null }) => ({
        id: book.id,
        title: book.title,
        epubAvailable: Boolean(book.epubAvailable),
        coverPath: book.coverPath ?? book.cover_path ?? null,
      })));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load availability.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const withEpub = books.filter((book) => book.epubAvailable).length;
  const withCover = books.filter((book) => Boolean(book.coverPath)).length;

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--booknook-primary)]">Admin tools</p>
        <h1 className="text-3xl font-extrabold leading-tight text-[var(--booknook-ink)] sm:text-4xl">File Availability</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--booknook-muted)] sm:text-base">
          Check the EPUB used for online reading and each book cover. PDF files are no longer used.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={() => void load()} disabled={loading}
            className="rounded-full border border-[var(--booknook-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--booknook-ink)] disabled:opacity-60">
            {loading ? "Checking…" : "Refresh"}
          </button>
          <Link href="/admin/books"
            className="rounded-full bg-[var(--booknook-primary)] px-5 py-3 text-sm font-bold text-white">
            Back to Books
          </Link>
        </div>
      </header>

      {message && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{message}</div>}

      {!loading && !message && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--booknook-border)] bg-white p-4">
            <p className="text-xs font-semibold text-[var(--booknook-muted)]">Total books</p>
            <p className="mt-1 text-2xl font-extrabold text-[var(--booknook-ink)]">{books.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--booknook-border)] bg-white p-4">
            <p className="text-xs font-semibold text-[var(--booknook-muted)]">EPUB available</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700">{withEpub}<span className="text-sm font-bold text-[var(--booknook-muted)]"> / {books.length}</span></p>
          </div>
          <div className="col-span-2 rounded-2xl border border-[var(--booknook-border)] bg-white p-4 sm:col-span-1">
            <p className="text-xs font-semibold text-[var(--booknook-muted)]">Covers available</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700">{withCover}<span className="text-sm font-bold text-[var(--booknook-muted)]"> / {books.length}</span></p>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-[var(--booknook-border)] bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[var(--booknook-border)] bg-[#f7f8fc] px-4 py-4 sm:px-5">
          <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--booknook-muted)]">Book</span>
          <span className="text-center text-xs font-extrabold text-[var(--booknook-ink)]">EPUB</span>
          <span className="text-center text-xs font-extrabold text-[var(--booknook-ink)]">Cover</span>
        </div>
        {loading ? (
          <p className="px-4 py-12 text-center text-sm font-semibold text-[var(--booknook-muted)]">Checking your books…</p>
        ) : books.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm font-semibold text-[var(--booknook-muted)]">No books found.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {books.map((book) => (
              <li key={book.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold leading-5 text-[var(--booknook-ink)]">{book.title}</p>
                  <p className="mt-1 text-xs text-[var(--booknook-muted)]">
                    {!book.epubAvailable ? "EPUB missing — check the uploaded file" : "Ready for online reading"}
                  </p>
                </div>
                <Status available={Boolean(book.epubAvailable)} label="EPUB" />
                <Status available={Boolean(book.coverPath)} label="Cover" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
