"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Comics", href: "/books" },
  { label: "Library", href: "/library" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Cart", href: "/cart" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = () => {
    try {
      const local = JSON.parse(localStorage.getItem("booknook_cart") || "[]");
      if (Array.isArray(local)) {
        setCartCount(local.length);
      }
    } catch {
      setCartCount(0);
    }

    fetch("/api/cart", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (typeof data.count === "number") setCartCount(data.count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshCartCount();
    window.addEventListener("booknook-cart-updated", refreshCartCount);
    window.addEventListener("storage", refreshCartCount);
    return () => {
      window.removeEventListener("booknook-cart-updated", refreshCartCount);
      window.removeEventListener("storage", refreshCartCount);
    };
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--booknook-border)] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--booknook-primary)] via-[var(--booknook-secondary)] to-[var(--booknook-sky)] text-xl shadow-md">
            📚
          </span>
          <span className="truncate text-base font-black tracking-tight text-[var(--booknook-ink)] sm:text-lg">
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
                  ? "bg-[rgba(109,93,252,0.10)] text-[var(--booknook-primary)]"
                  : "text-[var(--booknook-muted)] hover:bg-[#f1f2f7] hover:text-[var(--booknook-ink)]")
              }
            >
              {item.label === "Cart" ? (
                <span className="inline-flex items-center gap-1.5">
                  Cart
                  {cartCount > 0 && <span className="rounded-full bg-[var(--booknook-primary)] px-1.5 py-0.5 text-[10px] leading-none text-white">{cartCount}</span>}
                </span>
              ) : item.label}
            </Link>
          ))}
          <Link
            href="/account"
            className="ml-1 rounded-full bg-[var(--booknook-ink)] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:opacity-90"
          >
            Account
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Link
            href="/cart"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--booknook-border)] bg-white text-lg shadow-sm"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--booknook-primary)] px-1.5 py-0.5 text-[10px] font-black leading-4 text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--booknook-border)] bg-white text-lg font-black text-[var(--booknook-ink)] shadow-sm"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--booknook-border)] bg-white px-4 py-3 shadow-lg md:hidden">
          <nav className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  "rounded-2xl px-4 py-3 text-sm font-black " +
                  (isActive(item.href)
                    ? "bg-[rgba(109,93,252,0.10)] text-[var(--booknook-primary)]"
                    : "bg-[#f7f8fc] text-slate-700")
                }
              >
                {item.label === "Cart" ? `Cart${cartCount ? ` (${cartCount})` : ""}` : item.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="col-span-2 rounded-2xl bg-[var(--booknook-ink)] px-4 py-3 text-center text-sm font-black text-white"
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
