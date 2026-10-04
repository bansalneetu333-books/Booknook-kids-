import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/books", label: "Books", icon: "📚" },
  { href: "/admin/categories", label: "Categories", icon: "🏷️" },
  { href: "/admin/homepage", label: "Homepage", icon: "🏠" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: "💬" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await requireAdmin();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-slate-200 px-6 py-6">
              <Link
                href="/admin"
                className="flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-xl shadow-sm">
                  📚
                </div>

                <div>
                  <div className="text-lg font-extrabold text-slate-900">
                    Booknook Kids
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider text-violet-600">
                    Admin
                  </div>
                </div>
              </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                >
                  <span className="text-lg">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">
                  Signed in as
                </p>

                <p className="mt-1 truncate text-sm font-bold text-slate-800">
                  {user.email || "Admin"}
                </p>
              </div>

              <Link
                href="/"
                className="block rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                ← View Store
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-slate-200 bg-white lg:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                href="/admin"
                className="flex items-center gap-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg">
                  📚
                </div>

                <div>
                  <div className="font-extrabold text-slate-900">
                    Booknook Kids
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Admin
                  </div>
                </div>
              </Link>

              <Link
                href="/"
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
              >
                Store
              </Link>
            </div>

            <div className="overflow-x-auto border-t border-slate-100 px-4 py-3">
              <div className="flex min-w-max gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                  >
                    {item.icon} {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
