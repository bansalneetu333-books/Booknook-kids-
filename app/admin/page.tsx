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
    const { supabase, isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return {};
    }

    const [
      { data: books, error: booksError },
      { data: profiles, error: profilesError },
      { data: orders, error: ordersError },
    ] = await Promise.all([
      supabase.from("books").select("id,published"),
      supabase.from("profiles").select("id,email"),
      supabase.from("orders").select("id,status,amount"),
    ]);

    if (booksError || profilesError || ordersError) {
      console.error("Dashboard stats database error:", {
        booksError,
        profilesError,
        ordersError,
      });
      return {};
    }

    const totalBooks = books?.length ?? 0;

    const publishedBooks =
      books?.filter((book) => book.published === true).length ?? 0;

    const totalCustomers =
      profiles?.filter(
        (profile) =>
          profile.email?.trim().toLowerCase() !==
          "bansalneetu333@gmail.com"
      ).length ?? 0;

    const totalOrders = orders?.length ?? 0;

    const paidOrders =
      orders?.filter((order) => order.status === "paid").length ?? 0;

    const totalRevenue =
      orders
        ?.filter((order) => order.status === "paid")
        .reduce(
          (total, order) => total + (Number(order.amount) || 0),
          0
        ) ?? 0;

    return {
      totalBooks,
      publishedBooks,
      totalCustomers,
      totalOrders,
      paidOrders,
      totalRevenue,
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
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
        <p className="text-sm font-bold uppercase tracking-wider text-[var(--booknook-primary)]">
          Admin Dashboard
        </p>

        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--booknook-ink)] sm:text-4xl">
          Welcome to Booknook Kids 👋
        </h1>

        <p className="mt-2 max-w-2xl text-[var(--booknook-muted)]">
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
            className="group rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--booknook-muted)]">
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-extrabold text-[var(--booknook-ink)]">
                  {card.value}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
                {card.icon}
              </span>
            </div>

            <p className="mt-5 text-xs font-bold text-[var(--booknook-primary)] opacity-0 transition group-hover:opacity-100">
              Open →
            </p>
          </Link>
        ))}
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-[var(--booknook-muted)]">
            Common tasks for managing your store.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/books"
            className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">📚</div>

            <h3 className="mt-4 font-extrabold text-[var(--booknook-ink)]">
              Manage Books
            </h3>

            <p className="mt-1 text-sm text-[var(--booknook-muted)]">
              Add, edit, publish and manage ebook versions.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">🛒</div>

            <h3 className="mt-4 font-extrabold text-[var(--booknook-ink)]">
              Orders
            </h3>

            <p className="mt-1 text-sm text-[var(--booknook-muted)]">
              View purchases and payment status.
            </p>
          </Link>

          <Link
            href="/admin/customers"
            className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">👥</div>

            <h3 className="mt-4 font-extrabold text-[var(--booknook-ink)]">
              Customers
            </h3>

            <p className="mt-1 text-sm text-[var(--booknook-muted)]">
              View customer accounts and activity.
            </p>
          </Link>

          <Link
            href="/admin/whatsapp"
            className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">💬</div>

            <h3 className="mt-4 font-extrabold text-[var(--booknook-ink)]">
              WhatsApp
            </h3>

            <p className="mt-1 text-sm text-[var(--booknook-muted)]">
              Manage customer messaging and campaigns.
            </p>
          </Link>
        </div>
      </section>

      {/* Store links */}
      <section className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 to-pink-50 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
              View your customer website
            </h2>

            <p className="mt-1 text-sm text-[var(--booknook-muted)]">
              Check how your Booknook Kids store looks to
              readers.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[var(--booknook-primary)] px-6 py-3 font-bold text-white transition hover:opacity-90"
          >
            Open Store →
          </Link>
        </div>
      </section>
    </div>
  );
}
