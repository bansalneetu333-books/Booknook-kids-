import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/orders");

  const { data: orders, error } = await supabase.from("orders").select(`
    id,payment_status,total_amount,currency,created_at,
    order_items(id,price,books(id,title,slug,author,cover_path))
  `).eq("user_id", user.id).order("created_at", { ascending: false });

  if (error) console.error("Orders page error:", error);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link href="/account" className="text-sm font-bold text-violet-700">← My Account</Link>
          <h1 className="mt-4 text-4xl font-black text-slate-900">My Orders 🧾</h1>
          <p className="mt-2 text-slate-500">Your Booknook Kids purchase history.</p>
          {!orders?.length ? (
            <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm"><div className="text-6xl">📚</div><h2 className="mt-4 text-2xl font-black">No orders yet</h2><p className="mt-2 text-slate-500">Your completed purchases will appear here.</p><Link href="/books" className="mt-6 inline-flex rounded-full bg-violet-600 px-6 py-3 font-black text-white">Browse Books</Link></div>
          ) : (
            <div className="mt-8 space-y-4">{orders.map((order:any) => (
              <article key={order.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order</p><p className="font-black">{String(order.id).slice(0,8).toUpperCase()}</p></div><div className="text-right"><p className="text-lg font-black">₹{Number(order.total_amount||0).toFixed(2)}</p><p className="text-xs font-bold uppercase text-emerald-600">{order.payment_status}</p></div></div>
                <p className="mt-2 text-xs text-slate-500">{new Date(order.created_at).toLocaleString("en-IN")}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">{(order.order_items??[]).map((item:any)=>{const book=Array.isArray(item.books)?item.books[0]:item.books;return book?<Link key={item.id} href={`/books/${book.slug}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-violet-200"><p className="font-black">{book.title}</p><p className="mt-1 text-sm text-slate-500">By {book.author}</p><p className="mt-2 text-sm font-black">₹{Number(item.price).toFixed(2)}</p></Link>:null;})}</div>
              </article>
            ))}</div>
          )}
        </div>
      </main>
    </>
  );
}
