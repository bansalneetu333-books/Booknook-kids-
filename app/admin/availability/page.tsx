"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  epubAvailable?: boolean;
  pdfAvailable?: boolean;
  coverPath?: string | null;
};

function Status({ available }: { available: boolean }) {
  return (
    <span
      className={
        available
          ? "inline-flex min-w-16 justify-center rounded-lg bg-emerald-100 px-3 py-2 text-sm font-extrabold text-emerald-700"
          : "inline-flex min-w-16 justify-center rounded-lg bg-red-100 px-3 py-2 text-sm font-extrabold text-red-700"
      }
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
      setBooks(
        (data.books || []).map((book: Book & { cover_path?: string | null }) => ({
          id: book.id,
          title: book.title,
          epubAvailable: Boolean(book.epubAvailable),
          pdfAvailable: Boolean(book.pdfAvailable),
          coverPath: book.cover_path ?? null,
        }))
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load availability.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--booknook-primary)]">Admin</p>
          <h1 className="mt-1 text-3xl font-extrabold text-[var(--booknook-ink)]">File Availability</h1>
          <p className="mt-2 text-[var(--booknook-muted)]">Check every book&apos;s EPUB, PDF and cover in one place.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-[var(--booknook-border)] bg-white px-5 py-3 text-sm font-bold text-[var(--booknook-ink)]"
          >
            Refresh
          </button>
          <Link
            href="/admin/books"
            className="rounded-full bg-[var(--booknook-primary)] px-5 py-3 text-sm font-bold text-white"
          >
            Back to Books
          </Link>
        </div>
      </div>

      {message && (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </div>
      )}

      <div className="overflow-x-auto rounded-[1.5rem] border border-[var(--booknook-border)] bg-white shadow-sm">
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr className="border-b border-[var(--booknook-border)] bg-[#f7f8fc]">
              <th className="px-5 py-4 text-left text-sm font-extrabold text-[var(--booknook-ink)]">Book</th>
              <th className="px-5 py-4 text-center text-sm font-extrabold text-[var(--booknook-ink)]">EPUB</th>
              <th className="px-5 py-4 text-center text-sm font-extrabold text-[var(--booknook-ink)]">PDF</th>
              <th className="px-5 py-4 text-center text-sm font-extrabold text-[var(--booknook-ink)]">Cover</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center font-semibold text-[var(--booknook-muted)]">Checking files…</td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center font-semibold text-[var(--booknook-muted)]">No books found.</td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-4 font-bold text-[var(--booknook-ink)]">{book.title}</td>
                  <td className="px-5 py-4 text-center"><Status available={Boolean(book.epubAvailable)} /></td>
                  <td className="px-5 py-4 text-center"><Status available={Boolean(book.pdfAvailable)} /></td>
                  <td className="px-5 py-4 text-center"><Status available={Boolean(book.coverPath)} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
