import Link from "next/link";

import { requireAdmin } from "@/lib/admin";

type DashboardStats = {
  totalBooks?: number;
  publishedBooks?: number;
  totalCustomers?: number;
  totalOrders?: number;
  paidOrders?: number;
  totalRevenue?: number;
};

async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return {};
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const response = await fetch(
      `${baseUrl}/api/admin/dashboard`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {};
    }

    return await response.json();
  } catch (error) {
    console.error(
      "Dashboard stats error:",
      error
    );

    return {};
  }
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      label: "Total Books",
      value: stats.totalBooks ?? 0,
      icon: "📚",
      href: "/admin/books",
    },
    {
      label: "Published Books",
      value: stats.publishedBooks ?? 0,
      icon: "🌟",
      href: "/admin/books",
    },
    {
      label: "Customers",
      value: stats.totalCustomers ?? 0,
      icon: "👥",
      href: "/admin/customers",
    },
    {
      label: "Orders",
      value: stats.totalOrders ?? 0,
      icon: "🛒",
      href: "/admin/orders",
    },
    {
      label: "Paid Orders",
      value: stats.paidOrders ?? 0,
      icon: "✅",
      href: "/admin/orders",
    },
    {
      label: "Revenue",
      value: `₹${Number(
        stats.totalRevenue ?? 0
      ).toFixed(2)}`,
      icon: "💰",
      href: "/admin/analytics",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
          Admin Dashboard
        </p>

        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Welcome to Booknook Kids 👋
        </h1>

        <p className="mt-2 max-w-2xl text-slate-600">
          Manage your books, customers, orders, sales and
          digital library from one place.
        </p>
      </div>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {card.value}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
                {card.icon}
              </span>
            </div>

            <p className="mt-5 text-xs font-bold text-violet-600 opacity-0 transition group-hover:opacity-100">
              Open →
            </p>
          </Link>
        ))}
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Common tasks for managing your store.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/books"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">📚</div>

            <h3 className="mt-4 font-extrabold text-slate-900">
              Manage Books
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Add, edit, publish and manage ebook versions.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">🛒</div>

            <h3 className="mt-4 font-extrabold text-slate-900">
              Orders
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              View purchases and payment status.
            </p>
          </Link>

          <Link
            href="/admin/customers"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">👥</div>

            <h3 className="mt-4 font-extrabold text-slate-900">
              Customers
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              View customer accounts and activity.
            </p>
          </Link>

          <Link
            href="/admin/whatsapp"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">💬</div>

            <h3 className="mt-4 font-extrabold text-slate-900">
              WhatsApp
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer messaging and campaigns.
            </p>
          </Link>
        </div>
      </section>

      {/* Store links */}
      <section className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 to-pink-50 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              View your customer website
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Check how your Booknook Kids store looks to
              readers.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700"
          >
            Open Store →
          </Link>
        </div>
      </section>
    </div>
  );
}
