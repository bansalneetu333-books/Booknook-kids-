export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Booknook Kids",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Fun digital books and stories for curious young readers.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    "bansalneetu333@gmail.com",
  logoUrl:
    process.env.NEXT_PUBLIC_LOGO_URL || "",
  faviconUrl:
    process.env.NEXT_PUBLIC_FAVICON_URL || "",
  instagramUrl:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  facebookUrl:
    process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
};

export const bookCategories = [
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

export const uploadLimits = {
  maxCoverSize: 8 * 1024 * 1024,
  maxBookSize: 50 * 1024 * 1024,
};

export const supportedBookTypes = [
  "application/pdf",
  "application/epub+zip",
];

export const supportedBookExtensions = [
  ".pdf",
  ".epub",
];
