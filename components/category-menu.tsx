"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const categories = [
  { name: "Adventure", icon: "🗺️" },
  { name: "Science", icon: "🔬" },
  { name: "Money", icon: "💰" },
  { name: "Friendship", icon: "🤝" },
  { name: "History", icon: "🏛️" },
  { name: "Superheroes", icon: "🦸" },
  { name: "Fantasy", icon: "✨" },
  { name: "Comics", icon: "📚" },
  { name: "Learning", icon: "🎓" },
  { name: "Life Skills", icon: "🌟" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CategoryMenu() {
  const pathname = usePathname();

  return (
    <div className="w-full overflow-x-auto">
      <div className="mx-auto flex min-w-max gap-2 px-1 py-2">
        {categories.map((category) => {
          const slug = slugify(category.name);
          const href = `/books?genre=${encodeURIComponent(
            category.name
          )}`;

          const active =
            pathname === `/categories/${slug}` ||
            pathname === `/books/${slug}`;

          return (
            <Link
              key={category.name}
              href={href}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold whitespace-nowrap transition ${
                active
                  ? "border-violet-300 bg-violet-100 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
