export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Kids E-Book Store",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "A friendly digital library for young readers.",
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL ?? "",
  faviconUrl: process.env.NEXT_PUBLIC_FAVICON_URL ?? "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? ""
  }
} as const;
