"use client";

import { useEffect, useState } from "react";

type BookSale = {
  book_id: string;
  title: string;
  units_sold: number;
  gross_revenue: number;
};

type Dashboard = {
  paidOrders: number;
  revenue: number;
};

export default function AdminSalesPage() {
  const [bookSales, setBookSales] = useState<BookSale[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard>({
    paidOrders: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSales() {
    try {
      setLoading(true);
      setError("");

      const [analyticsResponse, dashboardResponse] =
        await Promise.all([
          fetch("/api/admin/analytics", { cache: "no-store" }),
          fetch("/api/admin/dashboard", { cache: "no-store" }),
        ]);

      const analyticsData = await analyticsResponse.json();
      const dashboardData = await dashboardResponse.json();

      if (!analyticsResponse.ok) {
        throw new Error(
          analyticsData?.error || "Unable to load sales."
        );
      }

      if (!dashboardResponse.ok) {
        throw new Error(
          dashboardData?.error || "Unable to load store totals."
        );
      }

      setBookSales(
        Array.isArray(analyticsData?.bookSales)
          ? analyticsData.bookSales.map(
              (item: {
                book_id?: string;
                title?: string;
                units_sold?: number;
                gross_revenue?: number;
              }) => ({
                book_id: String(item.book_id ?? ""),
                title: String(item.title ?? "Unknown book"),
                units_sold: Number(item.units_sold ?? 0),
                gross_revenue: Number(item.gross_revenue ?? 0),
              })
            )
          : []
      );

      setDashboard({
        paidOrders: Number(dashboardData?.paidOrders ?? 0),
        revenue: Number(dashboardData?.revenue ?? 0),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load sales."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSales();
  }, []);

  const booksSold = bookSales.reduce(
    (total, book) => total + book.units_sold,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-[var(--booknook-primary)]">
          Admin
        </p>
        <h1 className="mt-1 text-3xl font-black text-[var(--booknook-ink)]">
          Sales
        </h1>
        <p className="mt-2 text-[var(--booknook-muted)]">
          Revenue and paid-book sales from Supabase reporting data.
        </p>
      </div>

      {error && (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[var(--booknook-muted)]">
            Revenue
          </p>
          <p className="mt-2 text-3xl font-black">
            ₹{dashboard.revenue.toFixed(2)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[var(--booknook-muted)]">
            Paid Orders
          </p>
          <p className="mt-2 text-3xl font-black">
            {dashboard.paidOrders}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[var(--booknook-muted)]">
            Books Sold
          </p>
          <p className="mt-2 text-3xl font-black">
            {booksSold}
          </p>
        </div>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black">
              Revenue by Book
            </h2>
            <p className="mt-1 text-sm text-[var(--booknook-muted)]">
              Calculated from the Supabase sales view.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadSales()}
            disabled={loading}
            className="rounded-full border border-[var(--booknook-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--booknook-ink)] disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="mt-5 text-[var(--booknook-muted)]">
            Loading sales...
          </p>
        ) : bookSales.length === 0 ? (
          <p className="mt-5 text-[var(--booknook-muted)]">
            No paid sales yet.
          </p>
        ) : (
          <div className="mt-5 divide-y">
            {bookSales.map((book) => (
              <div
                key={book.book_id || book.title}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <div className="font-bold text-[var(--booknook-ink)]">
                    {book.title}
                  </div>
                  <div className="text-sm text-[var(--booknook-muted)]">
                    {book.units_sold} sold
                  </div>
                </div>

                <div className="font-black">
                  ₹{book.gross_revenue.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
