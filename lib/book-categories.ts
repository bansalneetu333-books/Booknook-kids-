export const BOOK_CATEGORIES = [
  {
    name: "Adventure",
    slug: "adventure",
    icon: "🗺️",
  },
  {
    name: "Science",
    slug: "science",
    icon: "🔬",
  },
  {
    name: "Money",
    slug: "money",
    icon: "💰",
  },
  {
    name: "Friendship",
    slug: "friendship",
    icon: "🤝",
  },
  {
    name: "History",
    slug: "history",
    icon: "🏛️",
  },
  {
    name: "Superheroes",
    slug: "superheroes",
    icon: "🦸",
  },
  {
    name: "Fantasy",
    slug: "fantasy",
    icon: "✨",
  },
  {
    name: "Comics",
    slug: "comics",
    icon: "📚",
  },
  {
    name: "Learning",
    slug: "learning",
    icon: "🎓",
  },
  {
    name: "Life Skills",
    slug: "life-skills",
    icon: "🌟",
  },
] as const;

export type BookCategory =
  (typeof BOOK_CATEGORIES)[number];

export type BookCategoryName =
  (typeof BOOK_CATEGORIES)[number]["name"];

export type BookCategorySlug =
  (typeof BOOK_CATEGORIES)[number]["slug"];
