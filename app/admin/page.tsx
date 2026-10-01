import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export default async function AdminDashboard() {
  const { user, isAdmin } = await requireAdmin();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-indigo-700 via-violet-600 to-pink-500 p-7 text-white shadow-xl">
          <p className="text-sm font-black uppercase tracking-widest text-white/70">
            Booknook Kids
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Admin Dashboard 👑
          </h1>

          <p className="mt-2 text-white/80">
            Manage your books, customers, orders and store.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/books"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1"
          >
            <div className="text-4xl">📚</div>

            <h2 className="mt-4 text-xl font-black">
              Books
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add and manage books.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1"
          >
            <div className="text-4xl">🧾</div>

            <h2 className="mt-4 text-xl font-black">
              Orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View customer purchases.
            </p>
          </Link>

          <Link
            href="/admin/customers"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1"
          >
            <div className="text-4xl">👨‍👩‍👧‍👦</div>

            <h2 className="mt-4 text-xl font-black">
              Customers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your readers.
            </p>
          </Link>

          <Link
            href="/admin/categories"
            className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1"
          >
            <div className="text-4xl">🏷️</div>

            <h2 className="mt-4 text-xl font-black">
              Categories
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Organize your catalogue.
            </p>
          </Link>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">
            Quick Actions
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/books/new"
              className="rounded-full bg-indigo-600 px-5 py-3 font-bold text-white"
            >
              + Add Book
            </Link>

            <Link
              href="/books"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 font-bold"
            >
              View Store
            </Link>

            <Link
              href="/"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 font-bold"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
