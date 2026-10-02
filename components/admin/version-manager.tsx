"use client";

import { useEffect, useState } from "react";

type Version = {
  id: string;
  version_number: string | null;
  file_type: string | null;
  file_size: number | null;
  active: boolean | null;
  created_at: string;
};

type Props = {
  bookId: string;
};

export default function VersionManager({ bookId }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionNumber, setVersionNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadVersions() {
    try {
      setLoadingVersions(true);
      setError("");

      const response = await fetch(
        `/api/admin/books/version?bookId=${encodeURIComponent(bookId)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load versions.");
      }

      setVersions(Array.isArray(data?.versions) ? data.versions : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load versions."
      );
    } finally {
      setLoadingVersions(false);
    }
  }

  useEffect(() => {
    loadVersions();
  }, [bookId]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!versionNumber.trim()) {
      setError("Enter a version number.");
      return;
    }

    if (!file) {
      setError("Select an EPUB or PDF file.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/epub+zip",
    ];

    const fileName = file.name.toLowerCase();

    const validExtension =
      fileName.endsWith(".pdf") || fileName.endsWith(".epub");

    if (!validExtension && !allowedTypes.includes(file.type)) {
      setError("Only EPUB and PDF files are supported.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("The ebook file must be 50 MB or smaller.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("bookId", bookId);
      formData.append("versionNumber", versionNumber.trim());
      formData.append("file", file);

      const response = await fetch("/api/admin/books/version", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to upload the version.");
      }

      setMessage("New book version uploaded successfully.");
      setVersionNumber("");
      setFile(null);

      const input = document.getElementById(
        "version-file"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      await loadVersions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the book version."
      );
    } finally {
      setLoading(false);
    }
  }

  async function activateVersion(versionId: string) {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/books/version/activate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookId,
            versionId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to activate version.");
      }

      setMessage("Book version activated successfully.");
      await loadVersions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to activate the version."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatFileSize(size: number | null) {
    if (!size || size <= 0) return "—";

    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Book Versions
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Upload a new EPUB or PDF version and choose which version customers
          receive.
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="version-number"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Version Number
            </label>

            <input
              id="version-number"
              type="text"
              value={versionNumber}
              onChange={(event) => setVersionNumber(event.target.value)}
              placeholder="Example: 1.1"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label
              htmlFor="version-file"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              EPUB / PDF File
            </label>

            <input
              id="version-file"
              type="file"
              accept=".epub,.pdf,application/epub+zip,application/pdf"
              onChange={(event) =>
                setFile(event.target.files?.[0] ?? null)
              }
              className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
            />

            <p className="mt-2 text-xs text-slate-500">
              Maximum file size: 50 MB.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload New Version"}
        </button>
      </form>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        {loadingVersions ? (
          <div className="p-6 text-sm text-slate-500">
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No versions have been uploaded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-slate-900">
                      Version {version.version_number || "—"}
                    </h3>

                    {version.active && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      Type: {(version.file_type || "unknown").toUpperCase()}
                    </span>

                    <span>
                      Size: {formatFileSize(version.file_size)}
                    </span>

                    <span>
                      Added:{" "}
                      {version.created_at
                        ? new Date(version.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>

                {!version.active && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => activateVersion(version.id)}
                    className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Make Active
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
