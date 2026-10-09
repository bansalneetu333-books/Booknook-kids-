"use client";

import Link from "next/link";

export function LibraryBookActions({ bookId }: { bookId: string }) {
  return (
    <div className="mt-3">
      <Link
        href={`/reader/${bookId}`}
        className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-black text-white hover:bg-indigo-700"
      >
        📖 Read Online
      </Link>
    </div>
  );
}
