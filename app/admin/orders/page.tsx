"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  price: number | string | null;
  books:
    | {
        title: string | null;
        slug: string | null;
      }
    | null;
};

type Order = {
  id: string;
  user_id: string | null;
  amount: number | string | null;
  currency: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: string;
  created_at: string;
  order_items: OrderItem[];
  customer?: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders(
    searchValue = "",
    statusValue = "all"
  ) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      if (statusValue !== "all") {
        params.set("status", statusValue);
      }

      const query = params.toString();

      const response = await fetch(
        `/api/admin/orders${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load orders."
        );
      }

      setOrders(
        Array.isArray(data?.orders)
          ? data.orders
          : []
      );
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
    loadOrders();
  }, []);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    loadOrders(search, status);
  }

  function handleStatusChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;
    setStatus(value);
    loadOrders(search, value);
  }

  function formatMoney(
    value: number | string | null,
    currency = "INR"
  ) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  function formatDate(value: string) {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusClass(value: string) {
    switch (value.toLowerCase()) {
      case "paid":
        return "bg-emerald-100 text-emerald-700";

      case "pending":
        return "bg-amber-100 text-amber-700";

      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  const paidOrders = orders.filter(
    (order) => order.status === "paid"
  );

  const totalRevenue = paidOrders.reduce(
    (total, order) =>
      total + Number(order.amount ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
          Admin
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
          Orders
        </h1>

        <p className="mt-2 text-slate-500">
          View customer purchases and payment status.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 lg:flex-row"
      >
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search order, customer or payment ID..."
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />

        <select
          value={status}
          onChange={handleStatusChange}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
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
          <option value="refunded">
            Refunded
          </option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          Search
        </button>

        {(search || status !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("all");
              loadOrders("", "all");
            }}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Orders
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {orders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Paid Orders
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {paidOrders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Revenue
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {formatMoney(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">🧾</div>

            <h2 className="mt-3 text-lg font-extrabold text-slate-900">
              No orders found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">
                      Order
                    </th>

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Book
                    </th>

                    <th className="px-6 py-4">
                      Amount
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900">
                          #{order.id.slice(0, 8)}
                        </div>

                        {order.razorpay_order_id && (
                          <div className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
                            {order.razorpay_order_id}
                          </div>
                        )}

                        {order.razorpay_payment_id && (
                          <div className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                            {order.razorpay_payment_id}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="font-semibold text-slate-900">
                          {order.customer?.full_name ||
                            "Customer"}
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {order.customer?.email ||
                            "No email"}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {order.order_items?.length ? (
                          <div className="space-y-1">
                            {order.order_items.map(
                              (item, index) => (
                                <div
                                  key={`${order.id}-${index}`}
                                  className="text-sm font-semibold text-slate-700"
                                >
                                  {item.books?.title ||
                                    "Book"}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm font-extrabold text-slate-900">
                        {formatMoney(
                          order.amount,
                          order.currency || "INR"
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Order
                      </p>

                      <h3 className="mt-1 font-extrabold text-slate-900">
                        #{order.id.slice(0, 8)}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Customer
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {order.customer?.full_name ||
                          "Customer"}
                      </p>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {order.customer?.email ||
                          "No email"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Book
                      </p>

                      <div className="mt-1 space-y-1">
                        {order.order_items?.map(
                          (item, index) => (
                            <p
                              key={`${order.id}-mobile-${index}`}
                              className="text-sm font-semibold text-slate-700"
                            >
                              {item.books?.title ||
                                "Book"}
                            </p>
                          )
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-400">
                          Amount
                        </p>

                        <p className="mt-1 font-extrabold text-slate-900">
                          {formatMoney(
                            order.amount,
                            order.currency || "INR"
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-400">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {formatDate(
                            order.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    {order.razorpay_payment_id && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400">
                          Payment ID
                        </p>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          {order.razorpay_payment_id}
                        </p>
                      </div>
                    )}
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
