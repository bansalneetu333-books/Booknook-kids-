"use client";

import { useEffect, useState } from "react";

type StorageInfo = {
  bucket: string;
  type: string;
  public: boolean;
  fileCount: number;
  totalBytes: number;
};

export default function AdminStoragePage() {
  const [storage, setStorage] = useState<StorageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStorage() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/storage",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load storage information."
        );
      }

      setStorage(
        Array.isArray(data?.storage)
          ? data.storage
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load storage information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStorage();
  }, []);

  function formatBytes(bytes: number) {
    if (!bytes || bytes <= 0) {
      return "0 B";
    }

    const units = [
      "B",
      "KB",
      "MB",
      "GB",
      "TB",
    ];

    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );

    const value =
      bytes / Math.pow(1024, index);

    return `${value.toFixed(
      index === 0 ? 0 : 1
    )} ${units[index]}`;
  }

  const totalFiles = storage.reduce(
    (sum, item) =>
      sum + Number(item.fileCount || 0),
    0
  );

  const totalBytes = storage.reduce(
    (sum, item) =>
      sum + Number(item.totalBytes || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
            Admin
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            Storage
          </h1>

          <p className="mt-2 text-slate-500">
            Monitor your ebook and cover storage.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStorage}
          disabled={loading}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Storage Buckets
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {storage.length}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total Files
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {totalFiles.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Estimated Storage
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {formatBytes(totalBytes)}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-extrabold text-slate-900">
            Storage Buckets
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your Supabase storage buckets and their current usage.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading storage...
          </div>
        ) : storage.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">🗄️</div>

            <h3 className="mt-3 font-extrabold text-slate-900">
              No storage information available
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Storage data will appear here when the storage API is connected.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">
                      Bucket
                    </th>

                    <th className="px-6 py-4">
                      Access
                    </th>

                    <th className="px-6 py-4">
                      Files
                    </th>

                    <th className="px-6 py-4">
                      Size
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {storage.map((item) => (
                    <tr
                      key={item.bucket}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="font-extrabold text-slate-900">
                          {item.bucket}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {item.type || "Storage bucket"}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            item.public
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {item.public
                            ? "Public"
                            : "Private"}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {Number(
                          item.fileCount || 0
                        ).toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-5 text-sm font-extrabold text-slate-900">
                        {formatBytes(
                          Number(
                            item.totalBytes || 0
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {storage.map((item) => (
                <div
                  key={item.bucket}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900">
                        {item.bucket}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.type || "Storage bucket"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        item.public
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.public
                        ? "Public"
                        : "Private"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Files
                      </p>

                      <p className="mt-1 text-sm font-extrabold text-slate-900">
                        {Number(
                          item.fileCount || 0
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Size
                      </p>

                      <p className="mt-1 text-sm font-extrabold text-slate-900">
                        {formatBytes(
                          Number(
                            item.totalBytes || 0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
