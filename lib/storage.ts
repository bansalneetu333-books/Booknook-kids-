import { createAdminClient } from "@/lib/admin";

export const PRIVATE_EBOOK_BUCKET = "ebooks-private";
export const PUBLIC_MEDIA_BUCKET = "book-covers";

export async function getActiveBookVersion(bookId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("book_versions")
    .select("id,book_id,version_number,version,epub_path,file_path,file_type,file_size,active,is_current")
    .eq("book_id", bookId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Book version lookup error:", error);
    throw new Error("Unable to load book version.");
  }
  return data;
}

export async function getReadableBookFile(bookId: string) {
  const supabase = createAdminClient();
  const version = await getActiveBookVersion(bookId);

  if (version) {
    const path = version.epub_path || version.file_path || null;
    if (path) {
      return {
        path,
        fileType: version.file_type || "application/epub+zip",
        version: version.version_number || version.version || null,
        fileSize: version.file_size ?? null,
        source: "version" as const,
      };
    }
  }

  const { data, error } = await supabase
    .from("books")
    .select("epub_path")
    .eq("id", bookId)
    .maybeSingle();

  if (error) {
    console.error("Legacy book file lookup error:", error);
    throw new Error("Unable to load book file.");
  }

  if (!data?.epub_path) return null;

  return {
    path: data.epub_path,
    fileType: "application/epub+zip",
    version: null,
    fileSize: null,
    source: "legacy" as const,
  };
}

export async function createEpubSignedUrl(path: string, expiresIn = 300) {
  const supabase = createAdminClient();
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  const { data, error } = await supabase.storage
    .from(PRIVATE_EBOOK_BUCKET)
    .createSignedUrl(normalizedPath, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", error);
    throw new Error("Unable to prepare book access.");
  }
  return data.signedUrl;
}

export function publicCoverUrl(path: string | null) {
  if (!path) return null;
  const supabase = createAdminClient();
  const { data } = supabase.storage.from(PUBLIC_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
