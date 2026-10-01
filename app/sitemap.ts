import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();

  const { data: books } = await supabase
    .from("books")
    .select("slug,updated_at")
    .eq("published", true);

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/books`, lastModified: new Date() },
    ...(books ?? []).map((book) => ({
      url: `${base}/books/${book.slug}`,
      lastModified: new Date(book.updated_at)
    }))
  ];
}
