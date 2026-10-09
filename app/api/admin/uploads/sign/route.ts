import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

const PRIVATE_EBOOK_BUCKET = "ebooks-private";
const PUBLIC_MEDIA_BUCKET = "book-covers";

const MAX_FILE_SIZE = 150 * 1024 * 1024;
const MAX_COVER_SIZE = 8 * 1024 * 1024;

type UploadKind = "cover" | "epub" | "pdf";

type UploadRequest = {
  bookId?: string;
  version?: string;
  files?: Array<{
    kind: UploadKind;
    size: number;
    type: string;
    extension: string;
  }>;
};

function cleanPart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: Request) {
  try {
    const { supabase, user, isAdmin } =
      await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const body =
      (await request.json()) as UploadRequest;

    const bookId =
      typeof body.bookId === "string"
        ? body.bookId.trim()
        : "";

    const version =
      typeof body.version === "string"
        ? body.version.trim()
        : "";

    const files = Array.isArray(body.files)
      ? body.files
      : [];

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    if (!version) {
      return NextResponse.json(
        { error: "Version is required." },
        { status: 400 }
      );
    }

    if (!files.length) {
      return NextResponse.json(
        { error: "No files were provided." },
        { status: 400 }
      );
    }

    const { data: book, error: bookError } =
      await supabase
        .from("books")
        .select("id,slug")
        .eq("id", bookId)
        .maybeSingle();

    if (bookError) {
      console.error(bookError);

      return NextResponse.json(
        { error: "Unable to verify the book." },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        { error: "Book not found." },
        { status: 404 }
      );
    }

    const uploads: Array<{
      kind: UploadKind;
      bucket: string;
      path: string;
      token: string;
    }> = [];

    const usedKinds = new Set<UploadKind>();

    for (const file of files) {
      if (
        !file ||
        !["cover", "epub", "pdf"].includes(
          file.kind
        )
      ) {
        return NextResponse.json(
          { error: "Invalid upload type." },
          { status: 400 }
        );
      }

      if (usedKinds.has(file.kind)) {
        return NextResponse.json(
          {
            error: `Duplicate ${file.kind} upload.`,
          },
          { status: 400 }
        );
      }

      usedKinds.add(file.kind);

      if (
        !Number.isFinite(file.size) ||
        file.size <= 0
      ) {
        return NextResponse.json(
          {
            error: `Invalid ${file.kind} file size.`,
          },
          { status: 400 }
        );
      }

      if (
        file.kind === "cover" &&
        file.size > MAX_COVER_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              "Cover image must be 8 MB or smaller.",
          },
          { status: 400 }
        );
      }

      if (
        file.kind !== "cover" &&
        file.size > MAX_FILE_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              "EPUB and PDF files must be 150 MB or smaller.",
          },
          { status: 400 }
        );
      }

      const safeBookSlug =
        cleanPart(book.slug || book.id);

      const safeVersion =
        cleanPart(version);

      const extension =
        cleanPart(file.extension || "bin");

      let bucket: string;
      let path: string;

      if (file.kind === "cover") {
        bucket =
          PUBLIC_MEDIA_BUCKET;

        path =
          `${safeBookSlug}/cover-${Date.now()}.${extension}`;
      } else {
        bucket =
          PRIVATE_EBOOK_BUCKET;

        path =
          `${safeBookSlug}/v${safeVersion}/${file.kind}.${extension}`;
      }

      const { data, error } =
        await supabase.storage
          .from(bucket)
          .createSignedUploadUrl(path);

      if (error || !data?.token) {
        console.error(
          "Signed upload error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error?.message ??
              `Unable to prepare ${file.kind} upload.`,
          },
          { status: 500 }
        );
      }

      uploads.push({
        kind: file.kind,
        bucket,
        path,
        token: data.token,
      });
    }

    return NextResponse.json({
      ok: true,
      uploads,
    });
  } catch (error) {
    console.error(
      "Admin upload signing error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to prepare uploads.",
      },
      { status: 500 }
    );
  }
}
