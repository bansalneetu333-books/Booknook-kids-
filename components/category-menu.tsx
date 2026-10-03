"use client";

import Link from "next/link";
import { BOOK_CATEGORIES } from "@/lib/book-categories";

export function CategoryMenu() {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-2">
      {BOOK_CATEGORIES.map((category) => (
        <Link
          key={category.slug}
          href={`/books?category=${encodeURIComponent(
            category.slug
          )}`}
          className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </Link>
      ))}
    </nav>
  );
}

export default CategoryMenu;
