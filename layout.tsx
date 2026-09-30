import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    redirect("/login?next=/admin");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed hidden h-screen w-64 border-r bg-white p-5 lg:block">
        <div className="text-xl font-black">📚 Booknook Admin</div>
        <nav className="mt-8 grid gap-2 text-sm font-semibold">
          <Link className="rounded-xl p-3 hover:bg-slate-100" href="/admin">Dashboard</Link>
          <Link className="rounded-xl p-3 hover:bg-slate-100" href="/admin/books">Books</Link>
          <Link className="rounded-xl p-3 hover:bg-slate-100" href="/admin/categories">Categories</Link>
          <Link className="rounded-xl p-3 hover:bg-slate-100" href="/admin/homepage">Homepage</Link>
          <Link className="rounded-xl p-3 hover:bg-slate-100" href="/admin/analytics">Analytics</Link>
          <Link className="rounded-xl p-3 hover:bg-slate-100" href="/admin/media">Media</Link>
          <Link className="rounded-xl p-3 hover:bg-slate-100" href="/admin/orders">Orders</Link>
          <Link className="rounded-xl p-3 hover:bg-slate-100" href="/admin/customers">Customers</Link>
          <Link className="rounded-xl p-3 hover:bg-slate-100" href="/admin/sales">Sales</Link>
          <Link className="rounded-xl p-3 hover:bg-slate-100" href="/admin/health">Health</Link>
          <Link className="mt-5 rounded-xl p-3 text-indigo-600 hover:bg-indigo-50" href="/">← Store</Link>
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-4 backdrop-blur lg:hidden">
          <nav className="flex gap-4 overflow-x-auto whitespace-nowrap text-sm font-semibold">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/books">Books</Link>
            <Link href="/admin/orders">Orders</Link>
            <Link href="/admin/customers">Customers</Link>
            <Link href="/admin/sales">Sales</Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
