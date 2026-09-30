import { requireAdmin } from "@/lib/admin";

export default async function AdminSalesPage() {
  const { supabase } = await requireAdmin();

  const { data: orders } = await supabase
    .from("orders")
    .select("id,total_amount,created_at")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(1000);

  const { data: items } = await supabase
    .from("order_items")
    .select("price,book_id,books(title)")
    .in(
      "order_id",
      (orders ?? []).map((o) => o.id)
    );

  const revenue = (orders ?? []).reduce((s, o) => s + Number(o.total_amount), 0);

  const byBook = new Map<string, { title: string; sales: number; revenue: number }>();
  for (const item of items ?? []) {
    const key = item.book_id;
    const title = item.books?.title ?? "Unknown";
    const current = byBook.get(key) ?? { title, sales: 0, revenue: 0 };
    current.sales += 1;
    current.revenue += Number(item.price);
    byBook.set(key, current);
  }

  return (
    <main className="p-5 sm:p-8">
      <h1 className="text-3xl font-black">Sales</h1>
      <p className="mt-1 text-slate-500">Verified payment data only.</p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="mt-2 text-3xl font-black">₹{revenue}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Successful orders</p>
          <p className="mt-2 text-3xl font-black">{orders?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Books sold</p>
          <p className="mt-2 text-3xl font-black">{items?.length ?? 0}</p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Revenue by Book</h2>
        <div className="mt-5 divide-y">
          {[...byBook.values()].map((book) => (
            <div key={book.title} className="flex items-center justify-between gap-4 py-4">
              <div>
                <div className="font-bold">{book.title}</div>
                <div className="text-sm text-slate-500">{book.sales} sold</div>
              </div>
              <div className="font-black">₹{book.revenue}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
