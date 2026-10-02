import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/admin";

const BUCKETS = [
  {
    name: "book-covers",
    type: "Public media",
    public: true,
  },
  {
    name: "ebooks-private",
    type: "Private ebooks",
    public: false,
  },
];

type StorageFile = {
  name: string;
  id?: string | null;
  metadata?: {
    size?: number | string | null;
  } | null;
};

async function getBucketStats(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: string
) {
  let fileCount = 0;
  let totalBytes = 0;

  async function scanFolder(path = "") {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit: 1000,
        offset: 0,
        sortBy: {
          column: "name",
          order: "asc",
        },
      });

    if (error) {
      throw error;
    }

    for (const item of (data ?? []) as StorageFile[]) {
      const itemPath = path
        ? `${path}/${item.name}`
        : item.name;

      const metadata = item.metadata;

      /*
       * Supabase storage folders do not contain file metadata
       * in the same way as actual files. A folder usually has
       * no metadata. We therefore use the presence of metadata
       * to distinguish files from folders.
       */
      if (metadata && typeof metadata === "object") {
        fileCount += 1;

        const size = Number(
          metadata.size ?? 0
        );

        if (Number.isFinite(size)) {
          totalBytes += size;
        }

        continue;
      }

      /*
       * If the item looks like a folder, scan it recursively.
       * This also handles nested ebook directories.
       */
      if (!itemPath.includes(".")) {
        try {
          await scanFolder(itemPath);
        } catch {
          // Ignore an inaccessible nested folder and continue.
        }
      }
    }
  }

  await scanFolder();

  return {
    fileCount,
    totalBytes,
  };
}

export async function GET() {
  try {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const results = [];

    for (const bucket of BUCKETS) {
      try {
        const stats = await getBucketStats(
          supabase,
          bucket.name
        );

        results.push({
          bucket: bucket.name,
          type: bucket.type,
          public: bucket.public,
          fileCount: stats.fileCount,
          totalBytes: stats.totalBytes,
        });
      } catch {
        /*
         * Keep the bucket visible even if listing fails.
         * This makes the admin storage screen useful when
         * a bucket exists but its contents cannot be listed.
         */
        results.push({
          bucket: bucket.name,
          type: bucket.type,
          public: bucket.public,
          fileCount: 0,
          totalBytes: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      storage: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load storage information.",
      },
      { status: 500 }
    );
  }
}
