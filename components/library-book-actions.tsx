"use client";

import Link from "next/link";
import { DownloadButton } from "@/components/download-button";

export function LibraryBookActions({ bookId }: { bookId: string }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <Link
        href={`/reader/${bookId}`}
        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-black text-white hover:bg-indigo-700"
      >
        📖 Read Here
      </Link>
      <DownloadButton
        bookId={bookId}
        title="Download"
        className="rounded-xl px-3 py-2.5 text-xs"
      />
    </div>
  );
}
