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

async function findExistingStorageFile(bookSlug: string) {
  const supabase = createAdminClient();
  const safeSlug = bookSlug.trim();
  if (!safeSlug) return null;

  const { data: entries, error } = await supabase.storage.from(PRIVATE_EBOOK_BUCKET).list(safeSlug, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
  if (error) { console.error("Storage fallback list error:", error); return null; }

  const candidates: Array<{ path: string; fileType: string; fileSize: number | null; createdAt: string }> = [];
  for (const entry of entries ?? []) {
    const name = String(entry.name || "");
    const lower = name.toLowerCase();
    if (lower.endsWith(".epub")) {
      candidates.push({ path: safeSlug + "/" + name, fileType: "application/epub+zip", fileSize: typeof entry.metadata?.size === "number" ? entry.metadata.size : null, createdAt: entry.created_at || "" });
      continue;
    }
    const { data: nested } = await supabase.storage.from(PRIVATE_EBOOK_BUCKET).list(safeSlug + "/" + name, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    for (const file of nested ?? []) {
      const fileName = String(file.name || "");
      const fileLower = fileName.toLowerCase();
      if (!fileLower.endsWith(".epub")) continue;
      candidates.push({ path: safeSlug + "/" + name + "/" + fileName, fileType: "application/epub+zip", fileSize: typeof file.metadata?.size === "number" ? file.metadata.size : null, createdAt: file.created_at || "" });
    }
  }
  candidates.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return candidates[0] ?? null;
}
async function storageObjectExists(path: string) {
  const normalized = String(path || "").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) return false;
  const { data, error } = await createAdminClient().storage.from(PRIVATE_EBOOK_BUCKET).createSignedUrl(normalized, 60);
  return !error && Boolean(data?.signedUrl);
}

export async function getReadableBookFile(bookId: string) {
  const supabase = createAdminClient();
  const version = await getActiveBookVersion(bookId);
  const { data: book, error } = await supabase.from("books").select("slug,epub_path").eq("id", bookId).maybeSingle();
  if (error) {
    console.error("Legacy book file lookup error:", error);
    throw new Error("Unable to load book file.");
  }

  if (version) {
    const path = version.epub_path || version.file_path || null;
    const type = String(version.file_type || "").toLowerCase();
    if (path && path.toLowerCase().endsWith(".epub") && !type.includes("pdf") && await storageObjectExists(path)) {
      return { path, fileType: version.file_type || "application/epub+zip", version: version.version_number || version.version || null, fileSize: version.file_size ?? null, source: "version" as const };
    }
  }

  if (book?.epub_path && book.epub_path.toLowerCase().endsWith(".epub") && await storageObjectExists(book.epub_path)) {
    return { path: book.epub_path, fileType: "application/epub+zip", version: null, fileSize: null, source: "legacy" as const };
  }

  if (book?.slug) {
    const fallback = await findExistingStorageFile(book.slug);
    if (fallback && await storageObjectExists(fallback.path)) {
      return { path: fallback.path, fileType: fallback.fileType, version: null, fileSize: fallback.fileSize, source: "storage-fallback" as const };
    }
  }
  return null;
}

export async function getBookFileAvailability(bookId: string) {
  const supabase = createAdminClient();
  let epubPath: string | null = null;

  const { data: book } = await supabase.from("books").select("slug,epub_path").eq("id", bookId).maybeSingle();
  if (!book) return { epubAvailable: false, pdfAvailable: false, epubPath: null, pdfPath: null };

  if (book.epub_path && book.epub_path.toLowerCase().endsWith(".epub")) {
    epubPath = book.epub_path;
  }

  const { data: versions } = await supabase.from("book_versions")
    .select("epub_path,file_path,file_type,created_at")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  for (const version of versions ?? []) {
    const path = version.epub_path || version.file_path || null;
    if (!path || !path.toLowerCase().endsWith(".epub")) continue;
    const type = String(version.file_type || "").toLowerCase();
    if (type && !type.includes("epub")) continue;
    epubPath = epubPath || path;
  }

  if (!epubPath) {
    const fallback = await findAllExistingStorageFiles(book.slug);
    epubPath = fallback.epubPath;
  }

  return { epubAvailable: Boolean(epubPath), pdfAvailable: false, epubPath, pdfPath: null };
}

async function findAllExistingStorageFiles(bookSlug: string) {
  const supabase = createAdminClient();
  const safeSlug = String(bookSlug || "").trim();
  if (!safeSlug) return { epubPath: null as string | null, pdfPath: null as string | null };

  const { data: entries } = await supabase.storage.from(PRIVATE_EBOOK_BUCKET)
    .list(safeSlug, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

  let epubPath: string | null = null;
  for (const entry of entries ?? []) {
    const name = String(entry.name || "");
    if (name.toLowerCase().endsWith(".epub")) {
      epubPath = epubPath || safeSlug + "/" + name;
      continue;
    }
    const { data: nested } = await supabase.storage.from(PRIVATE_EBOOK_BUCKET)
      .list(safeSlug + "/" + name, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    for (const file of nested ?? []) {
      const fileName = String(file.name || "");
      if (fileName.toLowerCase().endsWith(".epub")) epubPath = epubPath || safeSlug + "/" + name + "/" + fileName;
    }
  }

  return { epubPath, pdfPath: null };
}

export async function createEpubSignedUrl(path: string, expiresIn = 300) {
  const supabase = createAdminClient();
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  const { data, error } = await supabase.storage
    .from(PRIVATE_EBOOK_BUCKET)
    .createSignedUrl(normalizedPath, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", {
      bucket: PRIVATE_EBOOK_BUCKET,
      path: normalizedPath,
      message: error?.message,
      statusCode: error?.statusCode,
      error: error?.name,
    });
    throw new Error(
      error?.message
        ? `Unable to prepare book access: ${error.message}`
        : `Unable to prepare book access for storage path: ${normalizedPath}`
    );
  }
  return data.signedUrl;
}

export function publicCoverUrl(path: string | null) {
  if (!path) return null;
  const supabase = createAdminClient();
  const { data } = supabase.storage.from(PUBLIC_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
