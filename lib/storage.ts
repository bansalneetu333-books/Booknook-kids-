import { createAdminClient } from "@/lib/admin";

export const PRIVATE_EBOOK_BUCKET = "ebooks-private";
export const PUBLIC_MEDIA_BUCKET = "book-covers";

export async function getActiveBookVersion(bookId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("book_versions")
    .select(
      "id,book_id,version_number,epub_path,file_path,file_type,file_size,active"
    )
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

export async function createEpubSignedUrl(
  path: string,
  expiresIn = 300
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from(PRIVATE_EBOOK_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", error);
    throw new Error(
      "Unable to prepare book access."
    );
  }

  return data.signedUrl;
}

export function publicCoverUrl(
  path: string | null
) {
  if (!path) {
    return null;
  }

  const supabase = createAdminClient();

  const { data } = supabase.storage
    .from(PUBLIC_MEDIA_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}
