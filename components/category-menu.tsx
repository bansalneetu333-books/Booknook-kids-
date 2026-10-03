"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOOK_CATEGORIES } from "@/lib/categories";

export function CategoryMenu() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Book categories"
      className="w-full overflow-x-auto"
    >
      <div className="flex min-w-max gap-2 pb-2">
        <Link
          href="/books"
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            pathname === "/books"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-white text-slate-700 shadow-sm hover:bg-indigo-50"
          }`}
        >
          📚 All Books
        </Link>

        {BOOK_CATEGORIES.map((category) => {
          const href = `/books?category=${encodeURIComponent(
            category.slug
          )}`;

          const active =
            pathname === "/books" &&
            typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("category") ===
              category.slug;

          return (
            <Link
              key={category.slug}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition ${
                active
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-slate-700 shadow-sm hover:bg-indigo-50"
              }`}
            >
              {category.icon} {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default CategoryMenu;
