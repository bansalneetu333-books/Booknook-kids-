"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
  orders_count: number;
  paid_orders_count: number;
  total_spent: number;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCustomers(searchValue = "") {
    try {
      setLoading(true);
      setError("");

      const query = searchValue.trim()
        ? `?search=${encodeURIComponent(searchValue.trim())}`
        : "";

      const response = await fetch(
        `/api/admin/customers${query}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load customers."
        );
      }

      setCustomers(
        Array.isArray(data?.customers)
          ? data.customers
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    loadCustomers(search);
  }

  function formatDate(value: string) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
          Admin
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
          Customers
        </h1>

        <p className="mt-2 text-slate-500">
          View customer accounts and their purchase activity.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email..."
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          Search
        </button>

        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              loadCustomers("");
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
            Customers
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {customers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Paid Orders
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {customers.reduce(
              (total, customer) =>
                total + customer.paid_orders_count,
              0
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Customer Revenue
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {formatMoney(
              customers.reduce(
                (total, customer) =>
                  total + customer.total_spent,
                0
              )
            )}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">👥</div>
            <h2 className="mt-3 text-lg font-extrabold text-slate-900">
              No customers found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Try a different name or email search.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">
                      Customer
                    </th>
                    <th className="px-6 py-4">
                      Joined
                    </th>
                    <th className="px-6 py-4">
                      Orders
                    </th>
                    <th className="px-6 py-4">
                      Paid
                    </th>
                    <th className="px-6 py-4">
                      Spent
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900">
                          {customer.full_name ||
                            "Unnamed customer"}
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {customer.email || "No email"}
                        </div>

                        {customer.role === "admin" && (
                          <span className="mt-2 inline-block rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                            Admin
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatDate(customer.created_at)}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {customer.orders_count}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {customer.paid_orders_count}
                      </td>

                      <td className="px-6 py-5 text-sm font-extrabold text-slate-900">
                        {formatMoney(customer.total_spent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900">
                        {customer.full_name ||
                          "Unnamed customer"}
                      </h3>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {customer.email || "No email"}
                      </p>
                    </div>

                    {customer.role === "admin" && (
                      <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                        Admin
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Joined
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatDate(customer.created_at)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Orders
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {customer.orders_count}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Paid Orders
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {customer.paid_orders_count}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Total Spent
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-slate-900">
                        {formatMoney(customer.total_spent)}
                      </p>
                    </div>
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
