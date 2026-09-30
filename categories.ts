export const BOOK_CATEGORIES = [
  { name: "Adventure", icon: "🗺️", slug: "adventure" },
  { name: "Science", icon: "🔬", slug: "science" },
  { name: "Money", icon: "💰", slug: "money" },
  { name: "Friendship", icon: "🤝", slug: "friendship" },
  { name: "History", icon: "🏛️", slug: "history" },
  { name: "Superheroes", icon: "🦸", slug: "superheroes" },
  { name: "Fantasy", icon: "✨", slug: "fantasy" },
  { name: "Comics", icon: "📚", slug: "comics" },
  { name: "Learning", icon: "🎓", slug: "learning" },
  { name: "Life Skills", icon: "🌟", slug: "life-skills" },
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];
