"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  orders_count: number;
  paid_orders_count: number;
  total_spent: number;
  last_order_at: string | null;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const query = search.trim()
        ? `?search=${encodeURIComponent(search.trim())}`
        : "";

      const response = await fetch(
        `/api/admin/customers${query}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load customers.");
      }

      setCustomers(Array.isArray(data?.customers) ? data.customers : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-violet-600">
          Admin
        </p>
        <h1 className="mt-1 text-3xl font-black text-slate-900">Customers</h1>
        <p className="mt-2 text-slate-500">
          View registered customers and their purchase activity.
        </p>
      </div>

      <div className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void loadCustomers();
          }}
          placeholder="Search name or email..."
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
        />
        <button
          type="button"
          onClick={() => void loadCustomers()}
          className="rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white"
        >
          Search
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No customers found.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-4 font-bold">Customer</th>
                <th className="px-5 py-4 font-bold">Orders</th>
                <th className="px-5 py-4 font-bold">Paid</th>
                <th className="px-5 py-4 font-bold">Spent</th>
                <th className="px-5 py-4 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">
                      {customer.full_name || "Unnamed customer"}
                    </div>
                    <div className="text-slate-500">{customer.email || "—"}</div>
                  </td>
                  <td className="px-5 py-4">{customer.orders_count}</td>
                  <td className="px-5 py-4">{customer.paid_orders_count}</td>
                  <td className="px-5 py-4 font-bold">
                    ₹{Number(customer.total_spent || 0).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {new Date(customer.created_at).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
