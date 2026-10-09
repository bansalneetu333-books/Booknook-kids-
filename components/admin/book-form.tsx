"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BOOK_CATEGORIES } from "@/lib/book-categories";

const MAX_FILE = 150 * 1024 * 1024;
const MAX_COVER = 8 * 1024 * 1024;

type Book = {
  id: string;
  title: string;
  slug: string;
  author: string;
  description: string;
  price: number;
  genre: string;
  age_category: string;
  published: boolean;
  featured: boolean;
  cover_path?: string | null;
  epub_path?: string | null;
  categories?: string[];
};

type SignedUpload = {
  kind: "cover" | "epub";
  bucket: string;
  path: string;
  token: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extension(file: File) {
  const name = file.name.toLowerCase();

  const ext = name.includes(".")
    ? name.split(".").pop() || "bin"
    : "bin";

  return (
    ext.replace(/[^a-z0-9]/g, "").slice(0, 10) ||
    "bin"
  );
}

export function BookForm({ book }: { book?: Book }) {
  const [form, setForm] = useState({
    title: book?.title ?? "",
    slug: book?.slug ?? "",
    author: book?.author ?? "Neetu Bansal",
    description: book?.description ?? "",
    price: String(book?.price ?? 199),
    genre: book?.genre ?? BOOK_CATEGORIES[0].name,
    published: book?.published ?? false,
    featured: book?.featured ?? false,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (book?.categories?.length) return book.categories;
    const legacy = (book?.genre ?? "").split("/").map((value) => value.trim()).filter(Boolean);
    return legacy.length ? legacy : [];
  });

  const [cover, setCover] = useState<File | null>(null);
  const [epub, setEpub] = useState<File | null>(null);
  const [coverSaved, setCoverSaved] = useState(Boolean(book?.cover_path));
  const [epubSaved, setEpubSaved] = useState(Boolean(book?.epub_path));

  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  function update(
    key: string,
    value: string | boolean
  ) {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  }

  function chooseEpub(file: File | null) {
    if (file && file.size > MAX_FILE) {
      setStatus("EPUB is over 150 MB.");
      return;
    }

    setEpub(file);
    setStatus("");
  }

  function chooseCover(file: File | null) {
    if (file && file.size > MAX_COVER) {
      setStatus("Cover is over 8 MB.");
      return;
    }

    setCover(file);
    setStatus("");
  }

  async function submit(publish: boolean) {
    if (busy) return;

    setStatus("");

    if (!form.title.trim()) {
      setStatus("Add a title.");
      return;
    }

    if (!form.author.trim()) {
      setStatus("Add an author.");
      return;
    }

    if (selectedCategories.length === 0) {
      setStatus("Select at least one category.");
      return;
    }

    if (!book?.id && !epub) {
      setStatus("Add an EPUB for a new book.");
      return;
    }



    if (epub && epub.size > MAX_FILE) {
      setStatus("EPUB is over 150 MB.");
      return;
    }

    if (cover && cover.size > MAX_COVER) {
      setStatus("Cover is over 8 MB.");
      return;
    }

    setBusy(true);

    try {
      const slug =
        form.slug.trim() ||
        slugify(form.title);

      const metadata = {
        ...(book?.id ? { bookId: book.id } : {}),
        title: form.title.trim(),
        slug,
        author: form.author.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        genre: selectedCategories.join(" / "),
        categorySlugs: selectedCategories
          .map((name) => BOOK_CATEGORIES.find((category) => category.name === name)?.slug)
          .filter(Boolean),
        published: publish,
        featured: form.featured,
      };

      setStatus("Saving details…");

      const metaResponse = await fetch(
        "/api/admin/books",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(metadata),
        }
      );

      const meta = await metaResponse.json();

      if (!metaResponse.ok) {
        throw new Error(
          meta.error ??
            "Could not save book details."
        );
      }

      const bookId = meta.id as string;

      const files = [
        cover
          ? {
              kind: "cover" as const,
              size: cover.size,
              type:
                cover.type ||
                "image/jpeg",
              extension: extension(cover),
            }
          : null,

        epub
          ? {
              kind: "epub" as const,
              size: epub.size,
              type: "application/epub+zip",
              extension: "epub",
            }
          : null,

      ].filter(Boolean) as Array<{
        kind: "cover" | "epub";
        size: number;
        type: string;
        extension: string;
      }>;

      if (files.length > 0) {
        const version = `${Date.now()}`;

        setStatus(
          "Making secure upload links…"
        );

        const signResponse = await fetch(
          "/api/admin/uploads/sign",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              bookId,
              version,
              files,
            }),
          }
        );

        const signData =
          await signResponse.json();

        if (!signResponse.ok) {
          throw new Error(
            signData.error ??
              "Could not prepare upload."
          );
        }

        const supabase = createClient();

        const signed =
          signData.uploads as SignedUpload[];

        const uploaded: Partial<
          Record<
            SignedUpload["kind"],
            SignedUpload
          >
        > = {};

        for (const item of signed) {
          const file =
            item.kind === "cover"
              ? cover
              : epub;

          if (!file) continue;

          setStatus(
            `Sending ${item.kind}…`
          );

          const { error } =
            await supabase.storage
              .from(item.bucket)
              .uploadToSignedUrl(
                item.path,
                item.token,
                file,
                {
                  contentType:
                    item.kind === "epub"
                      ? "application/epub+zip"
                      : file.type,
                }
              );

          if (error) {
            throw new Error(
              error.message
            );
          }

          uploaded[item.kind] = item;
          if (item.kind === "cover") setCoverSaved(true);
          if (item.kind === "epub") setEpubSaved(true);

          // Save the cover immediately after its upload succeeds.
          // This keeps the cover linked even if the EPUB upload fails.
          if (item.kind === "cover") {
            const coverSaveResponse = await fetch("/api/admin/books", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...metadata,
                bookId,
                published: publish,
                coverPath: item.path,
              }),
            });

            const coverSaveData = await coverSaveResponse.json();

            if (!coverSaveResponse.ok) {
              throw new Error(
                coverSaveData.error ??
                  "The cover uploaded but could not be saved to the book."
              );
            }
          }
        }

        if (
          uploaded.epub ||
          uploaded.cover
        ) {
          setStatus("Finishing book…");

          const finalizeResponse =
            await fetch(
              "/api/admin/books/finalize",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  bookId,

                  ...(uploaded.epub ? { version, epubPath: uploaded.epub.path, epubSize: epub?.size ?? 0 } : {}),

                  coverPath:
                    uploaded.cover?.path ??
                    null,

                  published: publish,
                }),
              }
            );

          const finalizeData =
            await finalizeResponse.json();

          if (!finalizeResponse.ok) {
            throw new Error(
              finalizeData.error ??
                "Could not finish book."
            );
          }

        } else if (publish) {
          const publishResponse =
            await fetch(
              "/api/admin/books",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  ...metadata,
                  bookId,
                  published: true,
                }),
              }
            );

          const publishData =
            await publishResponse.json();

          if (!publishResponse.ok) {
            throw new Error(
              publishData.error ??
                "Could not publish book."
            );
          }
        }
      } else if (publish) {
        const publishResponse =
          await fetch(
            "/api/admin/books",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                ...metadata,
                bookId,
                published: true,
              }),
            }
          );

        const publishData =
          await publishResponse.json();

        if (!publishResponse.ok) {
          throw new Error(
            publishData.error ??
              "Could not publish book."
          );
        }
      }

      setStatus(
        publish
          ? "Book is live ✨"
          : "Saved ✨"
      );

      window.location.href =
        `/admin/books/${bookId}`;
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not save the book."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="grid gap-5">

        <div className="grid gap-4 sm:grid-cols-2">

          <label className="grid gap-2 text-sm font-bold">
            Title

            <input
              className="rounded-2xl border p-3.5"
              value={form.title}
              onChange={(e) => {
                const value =
                  e.target.value;

                update("title", value);

                if (!book) {
                  update(
                    "slug",
                    slugify(value)
                  );
                }
              }}
              placeholder="Book title"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Slug

            <input
              className="rounded-2xl border p-3.5"
              value={form.slug}
              onChange={(e) =>
                update(
                  "slug",
                  e.target.value
                )
              }
              placeholder="book-title"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Author

            <input
              className="rounded-2xl border p-3.5"
              value={form.author}
              onChange={(e) =>
                update(
                  "author",
                  e.target.value
                )
              }
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Price

            <input
              className="rounded-2xl border p-3.5"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) =>
                update(
                  "price",
                  e.target.value
                )
              }
              required
            />
          </label>

          <div className="grid gap-2 text-sm font-bold sm:col-span-2">
            <span>Categories <span className="text-red-500">*</span></span>
            <span className="text-xs font-medium text-slate-500">
              Choose one or more categories.
            </span>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-slate-50 p-3 sm:grid-cols-3">
              {BOOK_CATEGORIES.map((category) => {
                const checked = selectedCategories.includes(category.name);
                return (
                  <label
                    key={category.slug}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      checked
                        ? "border-violet-300 bg-violet-100 text-violet-800"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedCategories((current) =>
                          e.target.checked
                            ? [...current, category.name]
                            : current.filter((name) => name !== category.name)
                        );
                      }}
                    />
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <label className="grid gap-2 text-sm font-bold">
          About

          <textarea
            className="min-h-32 rounded-2xl border p-3.5"
            value={form.description}
            onChange={(e) =>
              update(
                "description",
                e.target.value
              )
            }
            placeholder="A short, friendly book description…"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">

          <label className={`grid gap-2 rounded-2xl border-2 p-4 text-sm font-bold transition ${cover || coverSaved ? "border-emerald-300 bg-emerald-50" : "border-dashed border-slate-300 bg-white"}`}>
            <span className="flex items-center justify-between gap-2">Cover {(cover || coverSaved) && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800">✓ {cover ? "Selected" : "Saved"}</span>}</span>
            <span className="text-xs font-medium text-slate-500">Image • 8 MB max</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => chooseCover(e.target.files?.[0] ?? null)} />
            {!cover && coverSaved && <span className="text-xs font-semibold text-emerald-700">Previously uploaded cover is saved.</span>}
          </label>

          <label className={`grid gap-2 rounded-2xl border-2 p-4 text-sm font-bold transition ${epub || epubSaved ? "border-emerald-300 bg-emerald-50" : "border-dashed border-slate-300 bg-white"}`}>
            <span className="flex items-center justify-between gap-2">EPUB {(epub || epubSaved) && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800">✓ {epub ? "Selected" : "Saved"}</span>}</span>
            <span className="text-xs font-medium text-slate-500">Online reader file • 150 MB max</span>
            <input type="file" accept=".epub,application/epub+zip" onChange={(e) => chooseEpub(e.target.files?.[0] ?? null)} />
            {!epub && epubSaved && <span className="text-xs font-semibold text-emerald-700">Previously uploaded EPUB is saved.</span>}
          </label>

  
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void submit(false)
            }
            className="rounded-full border border-slate-200 px-6 py-3 font-black disabled:opacity-50"
          >
            Save
          </button>

          <button
            type="button"
            disabled={
              busy ||
              (!book?.id && !epub)
            }
            onClick={() =>
              void submit(true)
            }
            className="rounded-full bg-indigo-600 px-6 py-3 font-black text-white shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {busy
              ? "Working…"
              : "Go Live"}
          </button>

        </div>

        <p
          className="text-sm font-semibold text-slate-500"
          aria-live="polite"
        >
          {status}
        </p>

      </div>
    </div>
  );
}

export default BookForm;
