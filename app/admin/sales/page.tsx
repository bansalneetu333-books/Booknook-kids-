"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  book: { title: string } | null;
  price: number;
};

type Order = {
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  items: Item[];
};

export default function AdminSalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/orders?status=paid", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Unable to load sales.");
        }
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load sales.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const byBook = useMemo(() => {
    const map = new Map<string, { sales: number; revenue: number }>();
    for (const order of orders) {
      if (order.status !== "paid") continue;
      for (const item of order.items ?? []) {
        const title = item.book?.title || "Unknown book";
        const current = map.get(title) ?? { sales: 0, revenue: 0 };
        current.sales += 1;
        current.revenue += Number(item.price || 0);
        map.set(title, current);
      }
    }
    return [...map.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  }, [orders]);

  const revenue = orders.reduce(
    (total, order) => total + (order.status === "paid" ? Number(order.amount || 0) : 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-[var(--booknook-primary)]">Admin</p>
        <h1 className="mt-1 text-3xl font-black text-[var(--booknook-ink)]">Sales</h1>
        <p className="mt-2 text-[var(--booknook-muted)]">Revenue and paid-book sales.</p>
      </div>

      {error && (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[var(--booknook-muted)]">Revenue</p>
          <p className="mt-2 text-3xl font-black">₹{revenue.toFixed(2)}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[var(--booknook-muted)]">Paid Orders</p>
          <p className="mt-2 text-3xl font-black">{orders.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-[var(--booknook-muted)]">Books Sold</p>
          <p className="mt-2 text-3xl font-black">
            {orders.reduce((n, order) => n + (order.items?.length ?? 0), 0)}
          </p>
        </div>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Revenue by Book</h2>
        {loading ? (
          <p className="mt-5 text-[var(--booknook-muted)]">Loading sales...</p>
        ) : byBook.length === 0 ? (
          <p className="mt-5 text-[var(--booknook-muted)]">No paid sales yet.</p>
        ) : (
          <div className="mt-5 divide-y">
            {byBook.map(([title, stats]) => (
              <div key={title} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <div className="font-bold text-[var(--booknook-ink)]">{title}</div>
                  <div className="text-sm text-[var(--booknook-muted)]">{stats.sales} sold</div>
                </div>
                <div className="font-black">₹{stats.revenue.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
