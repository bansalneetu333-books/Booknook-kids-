"use client";

import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number | null;
  created_at: string;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/categories",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load categories."
        );
      }

      setCategories(
        Array.isArray(data?.categories)
          ? data.categories
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(
    value: string
  ) {
    setName(value);

    if (!slug) {
      setSlug(createSlug(value));
    }
  }

  async function handleCreate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Enter a category name.");
      return;
    }

    if (!slug.trim()) {
      setError("Enter a category slug.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            icon: icon.trim() || null,
            description:
              description.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to create category."
        );
      }

      setName("");
      setSlug("");
      setIcon("");
      setDescription("");
      setMessage(
        "Category created successfully."
      );

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(
    categoryId: string
  ) {
    const confirmed = window.confirm(
      "Delete this category? Books using this category may prevent deletion."
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/categories?id=${encodeURIComponent(
          categoryId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to delete category."
        );
      }

      setMessage(
        "Category deleted successfully."
      );

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete category."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-[var(--booknook-primary)]">
          Admin
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-[var(--booknook-ink)]">
          Categories
        </h1>

        <p className="mt-2 text-[var(--booknook-muted)]">
          Manage the categories used across your Booknook Kids store.
        </p>
      </div>

      {error && (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      <div className="rounded-[1.5rem] border border-[var(--booknook-border)] bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
            Add Category
          </h2>

          <p className="mt-1 text-sm text-[var(--booknook-muted)]">
            Create a category for organizing your books.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="mt-6 space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--booknook-ink)]">
                Category Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  handleNameChange(
                    event.target.value
                  )
                }
                placeholder="Adventure"
                className="w-full rounded-[1.25rem] border border-[#ddd9e8] bg-white px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--booknook-ink)]">
                Slug
              </label>

              <input
                type="text"
                value={slug}
                onChange={(event) =>
                  setSlug(event.target.value)
                }
                placeholder="adventure"
                className="w-full rounded-[1.25rem] border border-[#ddd9e8] bg-white px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--booknook-ink)]">
                Icon
              </label>

              <input
                type="text"
                value={icon}
                onChange={(event) =>
                  setIcon(event.target.value)
                }
                placeholder="🗺️"
                maxLength={10}
                className="w-full rounded-[1.25rem] border border-[#ddd9e8] bg-white px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--booknook-ink)]">
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Exciting stories and adventures"
                className="w-full rounded-[1.25rem] border border-[#ddd9e8] bg-white px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[var(--booknook-primary)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Add Category"}
          </button>
        </form>
      </div>

      <div className="rounded-[1.5rem] border border-[var(--booknook-border)] bg-white shadow-sm">
        <div className="border-b border-[var(--booknook-border)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
            Existing Categories
          </h2>

          <p className="mt-1 text-sm text-[var(--booknook-muted)]">
            Categories currently available in the store.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--booknook-muted)]">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">📚</div>

            <h3 className="mt-3 font-extrabold text-[var(--booknook-ink)]">
              No categories yet
            </h3>

            <p className="mt-1 text-sm text-[var(--booknook-muted)]">
              Create your first category above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
                    {category.icon || "📚"}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[var(--booknook-ink)]">
                      {category.name}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-[var(--booknook-primary)]">
                      /{category.slug}
                    </p>

                    {category.description && (
                      <p className="mt-1 text-sm text-[var(--booknook-muted)]">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    deleteCategory(
                      category.id
                    )
                  }
                  className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
