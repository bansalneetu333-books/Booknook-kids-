import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin";

const adminNavigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "📊",
  },
  {
    label: "Books",
    href: "/admin/books",
    icon: "📚",
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: "🛒",
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: "👥",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: "📈",
  },
  {
    label: "Storage",
    href: "/admin/storage",
    icon: "☁️",
  },
  {
    label: "WhatsApp",
    href: "/admin/whatsapp",
    icon: "💬",
  },
  {
    label: "Support",
    href: "/admin/support",
    icon: "🎧",
  },
  {
    label: "Promotions",
    href: "/admin/promotions",
    icon: "🎁",
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, isAdmin } = await requireAdmin();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdmin) {
    redirect("/");
  }

  const displayName =
    profile?.full_name ||
    user.email ||
    "Administrator";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 p-6">
            <Link
              href="/admin"
              className="flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-2xl shadow-sm">
                📚
              </span>

              <div>
                <p className="text-lg font-extrabold text-slate-900">
                  Booknook Kids
                </p>

                <p className="text-xs font-semibold text-violet-600">
                  Admin Dashboard
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
              >
                <span className="text-lg">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">
                Signed in as
              </p>

              <p className="mt-1 truncate text-sm font-bold text-slate-800">
                {displayName}
              </p>

              {user.email && (
                <p className="mt-1 truncate text-xs text-slate-500">
                  {user.email}
                </p>
              )}
            </div>

            <Link
              href="/"
              className="mt-3 flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              ← View Store
            </Link>
          </div>
        </aside>

        {/* Main area */}
        <div className="min-w-0 flex-1">
          {/* Mobile admin header */}
          <header className="border-b border-slate-200 bg-white lg:hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <Link
                href="/admin"
                className="flex items-center gap-2"
              >
                <span className="text-2xl">📚</span>

                <div>
                  <p className="font-extrabold text-slate-900">
                    Booknook Kids
                  </p>

                  <p className="text-xs font-semibold text-violet-600">
                    Admin
                  </p>
                </div>
              </Link>

              <Link
                href="/"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
              >
                Store
              </Link>
            </div>

            <div className="overflow-x-auto border-t border-slate-100">
              <nav className="flex min-w-max gap-2 px-4 py-3">
                {adminNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-violet-100 hover:text-violet-700"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
