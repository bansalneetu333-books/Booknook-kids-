"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  totalBooks: number;
  publishedBooks: number;
  totalCustomers: number;
  totalOrders: number;
  paidOrders: number;
  revenue: number;
};

type MonthlySale = {
  month: string;
  orders: number;
  revenue: number;
};

export default function AdminAnalyticsPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [monthlySales, setMonthlySales] = useState<
    MonthlySale[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/dashboard",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load analytics."
        );
      }

      const dashboardData: DashboardData = {
        totalBooks: Number(
          data?.totalBooks ?? data?.total_books ?? 0
        ),
        publishedBooks: Number(
          data?.publishedBooks ??
            data?.published_books ??
            0
        ),
        totalCustomers: Number(
          data?.totalCustomers ??
            data?.total_customers ??
            0
        ),
        totalOrders: Number(
          data?.totalOrders ??
            data?.total_orders ??
            0
        ),
        paidOrders: Number(
          data?.paidOrders ??
            data?.paid_orders ??
            0
        ),
        revenue: Number(
          data?.revenue ?? 0
        ),
      };

      setDashboard(dashboardData);

      if (Array.isArray(data?.monthlySales)) {
        setMonthlySales(
          data.monthlySales.map(
            (item: {
              month?: string;
              orders?: number;
              revenue?: number;
            }) => ({
              month: String(
                item.month ?? ""
              ),
              orders: Number(
                item.orders ?? 0
              ),
              revenue: Number(
                item.revenue ?? 0
              ),
            })
          )
        );
      } else {
        setMonthlySales([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  const conversionRate =
    dashboard && dashboard.totalOrders > 0
      ? Math.round(
          (dashboard.paidOrders /
            dashboard.totalOrders) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--booknook-primary)]">
            Admin
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-[var(--booknook-ink)]">
            Analytics
          </h1>

          <p className="mt-2 text-[var(--booknook-muted)]">
            Overview of your Booknook Kids store activity.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          disabled={loading}
          className="rounded-[1.25rem] border border-[#ddd9e8] bg-white px-5 py-3 text-sm font-bold text-[var(--booknook-ink)] transition hover:bg-[#f7f8fc] disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading && !dashboard ? (
        <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-10 text-center text-sm text-[var(--booknook-muted)] shadow-sm">
          Loading analytics...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="📚"
              label="Total Books"
              value={dashboard?.totalBooks ?? 0}
            />

            <MetricCard
              icon="🌟"
              label="Published Books"
              value={
                dashboard?.publishedBooks ?? 0
              }
            />

            <MetricCard
              icon="👥"
              label="Customers"
              value={
                dashboard?.totalCustomers ?? 0
              }
            />

            <MetricCard
              icon="🧾"
              label="Total Orders"
              value={
                dashboard?.totalOrders ?? 0
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[var(--booknook-muted)]">
                Paid Orders
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[var(--booknook-ink)]">
                {dashboard?.paidOrders ?? 0}
              </p>

              <p className="mt-2 text-sm text-[var(--booknook-muted)]">
                Successfully completed purchases
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[var(--booknook-muted)]">
                Revenue
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[var(--booknook-ink)]">
                {formatMoney(
                  dashboard?.revenue ?? 0
                )}
              </p>

              <p className="mt-2 text-sm text-[var(--booknook-muted)]">
                From recorded paid orders
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[var(--booknook-muted)]">
                Order Conversion
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[var(--booknook-ink)]">
                {conversionRate}%
              </p>

              <p className="mt-2 text-sm text-[var(--booknook-muted)]">
                Paid orders ÷ total orders
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm sm:p-8">
            <div>
              <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
                Monthly Sales
              </h2>

              <p className="mt-1 text-sm text-[var(--booknook-muted)]">
                Monthly sales data will appear here when the
                dashboard API provides it.
              </p>
            </div>

            {monthlySales.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-[#f7f8fc] p-8 text-center">
                <div className="text-4xl">📊</div>

                <p className="mt-3 font-bold text-[var(--booknook-ink)]">
                  No monthly sales data available yet
                </p>

                <p className="mt-1 text-sm text-[var(--booknook-muted)]">
                  Your current store totals are shown above.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-[var(--booknook-border)] text-left text-xs font-bold uppercase tracking-wider text-[var(--booknook-muted)]">
                    <tr>
                      <th className="px-4 py-3">
                        Month
                      </th>

                      <th className="px-4 py-3">
                        Orders
                      </th>

                      <th className="px-4 py-3">
                        Revenue
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {monthlySales.map(
                      (item, index) => (
                        <tr key={`${item.month}-${index}`}>
                          <td className="px-4 py-4 font-semibold text-[var(--booknook-ink)]">
                            {item.month || "—"}
                          </td>

                          <td className="px-4 py-4 text-[var(--booknook-muted)]">
                            {item.orders}
                          </td>

                          <td className="px-4 py-4 font-extrabold text-[var(--booknook-ink)]">
                            {formatMoney(
                              item.revenue
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-xl">
          {icon}
        </div>

        <p className="text-sm font-semibold text-[var(--booknook-muted)]">
          {label}
        </p>
      </div>

      <p className="mt-5 text-3xl font-extrabold text-[var(--booknook-ink)]">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
