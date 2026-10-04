"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type OrderItem = {
  id: string;
  bookId: string;
  price: number;
  createdAt: string;
  book: {
    id: string;
    title: string;
    slug: string;
    author: string;
    coverPath: string | null;
  } | null;
};

type Customer = {
  id: string;
  fullName: string | null;
  email: string | null;
};

type Order = {
  id: string;
  userId: string | null;
  customer: Customer | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

type OrdersResponse = {
  orders: Order[];
  summary?: {
    totalOrders?: number;
    paidOrders?: number;
    pendingOrders?: number;
    failedOrders?: number;
    totalRevenue?: number;
  };
};

function formatMoney(
  amount: number,
  currency: string
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-emerald-100 text-emerald-700";

    case "pending":
      return "bg-amber-100 text-amber-700";

    case "failed":
    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] =
    useState<OrdersResponse["summary"]>({});

  const [status, setStatus] =
    useState("all");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (status !== "all") {
        params.set("status", status);
      }

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      const query =
        params.toString();

      const response = await fetch(
        `/api/admin/orders${
          query ? `?${query}` : ""
        }`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as
          | OrdersResponse
          | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data &&
            data.error
            ? data.error
            : "Unable to load orders."
        );
      }

      const result =
        data as OrdersResponse;

      setOrders(result.orders ?? []);
      setSummary(result.summary ?? {});
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOrders();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadOrders]);

  const visibleOrders = useMemo(
    () => orders,
    [orders]
  );

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-widest text-indigo-600">
            Admin
          </p>

          <h1 className="mt-1 text-3xl font-black text-slate-900 sm:text-4xl">
            Orders
          </h1>

          <p className="mt-2 text-slate-500">
            View purchases, customers and
            Razorpay payment information.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Total Orders
            </p>

            <p className="mt-2 text-3xl font-black">
              {summary?.totalOrders ?? 0}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Paid Orders
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-600">
              {summary?.paidOrders ?? 0}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-black text-amber-600">
              {summary?.pendingOrders ?? 0}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Revenue
            </p>

            <p className="mt-2 text-2xl font-black text-indigo-600">
              {formatMoney(
                Number(
                  summary?.totalRevenue ?? 0
                ),
                "INR"
              )}
            </p>
          </div>

        </div>

        <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">

            <input
              type="search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search customer, book, order or payment ID…"
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-indigo-500"
            >
              <option value="all">
                All statuses
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="failed">
                Failed
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>

            <button
              type="button"
              onClick={() =>
                void loadOrders()
              }
              disabled={loading}
              className="rounded-2xl bg-indigo-600 px-5 py-3 font-black text-white disabled:opacity-50"
            >
              {loading
                ? "Loading…"
                : "Refresh"}
            </button>

          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-4xl">
              ⏳
            </div>

            <p className="mt-3 font-bold text-slate-600">
              Loading orders…
            </p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">
              🧾
            </div>

            <h2 className="mt-4 text-xl font-black">
              No orders found
            </h2>

            <p className="mt-2 text-slate-500">
              Try another search or status
              filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {visibleOrders.map((order) => (
              <section
                key={order.id}
                className="rounded-3xl bg-white p-5 shadow-sm sm:p-6"
              >

                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-slate-900">
                        Order #{order.id.slice(0, 8)}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {formatDate(
                        order.createdAt
                      )}
                    </p>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-2xl font-black text-indigo-600">
                      {formatMoney(
                        Number(
                          order.amount
                        ),
                        order.currency
                      )}
                    </p>

                    <p className="text-sm text-slate-500">
                      {order.items.length}{" "}
                      {order.items.length === 1
                        ? "book"
                        : "books"}
                    </p>
                  </div>

                </div>

                <div className="grid gap-5 py-5 lg:grid-cols-3">

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Customer
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {order.customer
                        ?.fullName ||
                        "Customer"}
                    </p>

                    <p className="break-all text-sm text-slate-500">
                      {order.customer
                        ?.email ||
                        "No email"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Razorpay Order
                    </p>

                    <p className="mt-1 break-all font-mono text-sm text-slate-700">
                      {order.razorpayOrderId ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Payment ID
                    </p>

                    <p className="mt-1 break-all font-mono text-sm text-slate-700">
                      {order.razorpayPaymentId ||
                        "—"}
                    </p>
                  </div>

                </div>

                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
                    Books
                  </p>

                  <div className="space-y-2">
                    {order.items.map(
                      (item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">
                              {item.book
                                ?.title ||
                                "Book"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {item.book
                                ?.author ||
                                ""}
                            </p>
                          </div>

                          <p className="shrink-0 font-black">
                            {formatMoney(
                              Number(
                                item.price
                              ),
                              order.currency
                            )}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

              </section>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}
