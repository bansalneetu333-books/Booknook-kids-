import { createAdminClient } from "@/lib/admin";

export const PRIVATE_EBOOK_BUCKET = "ebooks-private";
export const PUBLIC_MEDIA_BUCKET = "book-covers";

type StorageCandidate = {
  path: string;
  bucket: string;
  fileType: string;
  fileSize: number | null;
  createdAt: string;
};

async function listEpubCandidates(bucket: string, bookSlug: string): Promise<StorageCandidate[]> {
  const supabase = createAdminClient();
  const safeSlug = String(bookSlug || "").trim();
  if (!safeSlug) return [];

  const { data: entries, error } = await supabase.storage.from(bucket).list(safeSlug, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) return [];

  const candidates: StorageCandidate[] = [];

  for (const entry of entries ?? []) {
    const name = String(entry.name || "");
    if (!name) continue;

    if (name.toLowerCase().endsWith(".epub")) {
      candidates.push({
        path: `${safeSlug}/${name}`,
        bucket,
        fileType: "application/epub+zip",
        fileSize: typeof entry.metadata?.size === "number" ? entry.metadata.size : null,
        createdAt: String(entry.created_at ?? ""),
      });
      continue;
    }

    const { data: nested, error: nestedError } = await supabase.storage
      .from(bucket)
      .list(`${safeSlug}/${name}`, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (nestedError) continue;

    for (const file of nested ?? []) {
      const fileName = String(file.name || "");
      if (!fileName.toLowerCase().endsWith(".epub")) continue;
      candidates.push({
        path: `${safeSlug}/${name}/${fileName}`,
        bucket,
        fileType: "application/epub+zip",
        fileSize: typeof file.metadata?.size === "number" ? file.metadata.size : null,
        createdAt: String(file.created_at ?? ""),
      });
    }
  }

  candidates.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return candidates;
}

async function bucketFileExists(path: string, bucket = PRIVATE_EBOOK_BUCKET) {
  const normalized = String(path || "").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) return false;

  const { data, error } = await createAdminClient()
    .storage.from(bucket)
    .createSignedUrl(normalized, 60);

  return !error && Boolean(data?.signedUrl);
}

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

  const { data: book, error } = await supabase
    .from("books")
    .select("slug,epub_path")
    .eq("id", bookId)
    .maybeSingle();

  if (error) {
    console.error("Legacy book file lookup error:", error);
    throw new Error("Unable to load book file.");
  }

  if (version) {
    const path = version.epub_path || version.file_path || null;
    const type = String(version.file_type || "").toLowerCase();

    if (
      path &&
      path.toLowerCase().endsWith(".epub") &&
      !type.includes("pdf") &&
      (await bucketFileExists(path, PRIVATE_EBOOK_BUCKET))
    ) {
      return {
        path,
        bucket: PRIVATE_EBOOK_BUCKET,
        fileType: version.file_type || "application/epub+zip",
        version: version.version_number || version.version || null,
        fileSize: version.file_size ?? null,
        source: "version" as const,
      };
    }
  }

  if (
    book?.epub_path &&
    book.epub_path.toLowerCase().endsWith(".epub") &&
    (await bucketFileExists(book.epub_path, PRIVATE_EBOOK_BUCKET))
  ) {
    return {
      path: book.epub_path,
      bucket: PRIVATE_EBOOK_BUCKET,
      fileType: "application/epub+zip",
      version: null,
      fileSize: null,
      source: "legacy" as const,
    };
  }

  if (book?.slug) {
    const candidates = [
      ...(await listEpubCandidates(PRIVATE_EBOOK_BUCKET, book.slug)),
      ...(await listEpubCandidates("ebooks", book.slug)),
    ];

    for (const candidate of candidates) {
      if (await bucketFileExists(candidate.path, candidate.bucket)) {
        return {
          path: candidate.path,
          bucket: candidate.bucket,
          fileType: candidate.fileType,
          version: null,
          fileSize: candidate.fileSize,
          source: "storage-fallback" as const,
        };
      }
    }
  }

  return null;
}

export async function getBookFileAvailability(bookId: string) {
  const supabase = createAdminClient();

  let epubPath: string | null = null;

  const { data: book } = await supabase
    .from("books")
    .select("slug,epub_path")
    .eq("id", bookId)
    .maybeSingle();

  if (!book) {
    return { epubAvailable: false, pdfAvailable: false, epubPath: null, pdfPath: null };
  }

  if (book.epub_path && book.epub_path.toLowerCase().endsWith(".epub")) {
    epubPath = book.epub_path;
  }

  const { data: versions } = await supabase
    .from("book_versions")
    .select("epub_path,file_path,file_type,created_at")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  for (const version of versions ?? []) {
    const path = version.epub_path || version.file_path || null;
    if (!path || !path.toLowerCase().endsWith(".epub")) continue;

    const type = String(version.file_type || "").toLowerCase();
    if (type && !type.includes("epub")) continue;

    if (!epubPath) epubPath = path;
  }

  if (!epubPath && book.slug) {
    const candidates = [
      ...(await listEpubCandidates(PRIVATE_EBOOK_BUCKET, book.slug)),
      ...(await listEpubCandidates("ebooks", book.slug)),
    ];

    for (const candidate of candidates) {
      if (await bucketFileExists(candidate.path, candidate.bucket)) {
        epubPath = candidate.path;
        break;
      }
    }
  }

  return {
    epubAvailable: Boolean(epubPath),
    pdfAvailable: false,
    epubPath,
    pdfPath: null,
  };
}

export async function createEpubSignedUrl(path: string, expiresIn = 300, bucket = PRIVATE_EBOOK_BUCKET) {
  const supabase = createAdminClient();
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(normalizedPath, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", {
      bucket,
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
