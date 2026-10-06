import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/books", label: "Books", icon: "📚" },
  { href: "/admin/availability", label: "File Availability", icon: "✓" },
  { href: "/admin/categories", label: "Categories", icon: "🏷️" },
  { href: "/admin/homepage", label: "Homepage", icon: "🏠" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/sales", label: "Sales", icon: "💰" },
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
    redirect("/admin-login");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-[var(--booknook-border)] bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-[var(--booknook-border)] px-6 py-6">
              <Link
                href="/admin"
                className="flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-xl shadow-sm">
                  📚
                </div>

                <div>
                  <div className="text-lg font-extrabold text-[var(--booknook-ink)]">
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
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[var(--booknook-ink)] transition hover:bg-violet-50 hover:text-[var(--booknook-primary)]"
                >
                  <span className="text-lg">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="border-t border-[var(--booknook-border)] p-4">
              <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-[var(--booknook-muted)]">
                  Signed in as
                </p>

                <p className="mt-1 truncate text-sm font-bold text-slate-800">
                  {user.email || "Admin"}
                </p>
              </div>

              <Link
                href="/"
                className="block rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-bold text-[var(--booknook-ink)] transition hover:bg-slate-50"
              >
                ← View Store
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-[var(--booknook-border)] bg-white lg:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                href="/admin"
                className="flex items-center gap-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg">
                  📚
                </div>

                <div>
                  <div className="font-extrabold text-[var(--booknook-ink)]">
                    Booknook Kids
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Admin
                  </div>
                </div>
              </Link>

              <Link
                href="/"
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-[var(--booknook-ink)]"
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
                    className="rounded-xl bg-[#f1f2f7] px-3 py-2 text-xs font-bold text-[var(--booknook-ink)] transition hover:bg-violet-50 hover:text-[var(--booknook-primary)]"
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
