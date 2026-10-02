"use client";

import { useState } from "react";

type DownloadButtonProps = {
  bookId: string;
};

export function DownloadButton({
  bookId,
}: DownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function downloadBook() {
    if (busy) return;

    setBusy(true);
    setMessage("Preparing your download…");

    try {
      const response = await fetch("/api/books/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to prepare the download."
        );
      }

      if (!data?.url) {
        throw new Error("Download link was not created.");
      }

      const link = document.createElement("a");
      link.href = data.url;

      if (data.filename) {
        link.download = data.filename;
      }

      link.target = "_blank";
      link.rel = "noopener noreferrer";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage("Download started.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to download the book."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={downloadBook}
        disabled={busy}
        className="rounded-full border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Preparing…" : "⬇️ Download Book"}
      </button>

      {message && (
        <p
          className="mt-2 text-xs text-slate-500"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
}
