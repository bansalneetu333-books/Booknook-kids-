"use client";

import { useState } from "react";

type DownloadButtonProps = {
  bookId: string;
  title?: string;
  className?: string;
};

export function DownloadButton({
  bookId,
  title = "Download PDF",
  className = "",
}: DownloadButtonProps) {
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function downloadBook() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/books/download",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            bookId,
          }),
        }
      );

      const data =
        (await response.json()) as {
          url?: string;
          error?: string;
        };

      if (!response.ok || !data.url) {
        throw new Error(
          data.error ??
            "Unable to prepare the download."
        );
      }

      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download the book."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={downloadBook}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-3 font-black text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {loading
          ? "Preparing download…"
          : `⬇️ ${title}`}
      </button>

      {error && (
        <p
          className="text-sm font-semibold text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default DownloadButton;
