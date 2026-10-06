"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Comics", href: "/books" },
  { label: "Free Reading", href: "/free-reading" },
  { label: "Library", href: "/library" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Cart", href: "/cart" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 text-xl shadow-md">
            📚
          </span>
          <span className="truncate text-base font-black tracking-tight text-slate-950 sm:text-lg">
            BookNook Kids
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "rounded-xl px-3 py-2 text-sm font-extrabold transition " +
                (isActive(item.href)
                  ? "bg-violet-100 text-violet-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")
              }
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/account"
            className="ml-1 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-violet-700"
          >
            Account
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Link
            href="/cart"
            aria-label="Cart"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg shadow-sm"
          >
            🛒
          </Link>
          <button
            type="button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-800 shadow-sm"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg md:hidden">
          <nav className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  "rounded-2xl px-4 py-3 text-sm font-black " +
                  (isActive(item.href)
                    ? "bg-violet-100 text-violet-700"
                    : "bg-slate-50 text-slate-700")
                }
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="col-span-2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white"
            >
              Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default SiteHeader;
