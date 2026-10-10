"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

type CartItem = {
  id: string;
  title: string;
  slug: string;
  author?: string;
  genre?: string | null;
  price: number;
  cover_path?: string | null;
  cover_url?: string | null;
  quantity?: number;
};

type Order = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  items: { id: string; title: string; slug: string; cover_path?: string | null; price: number }[];
};

function readLocalCart(): CartItem[] {
  try {
    const value = JSON.parse(localStorage.getItem("booknook_cart") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadCart() {
    setLoading(true);
    const local = readLocalCart();
    setItems(local);

    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      if (response.ok) {
        let data = await response.json();
        setAuthenticated(Boolean(data.authenticated));
        if (data.authenticated) {
          if (local.length) {
            await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: local }),
            });
            const refreshed = await fetch("/api/cart", { cache: "no-store" });
            if (refreshed.ok) data = await refreshed.json();
          }
          if (Array.isArray(data.items)) {
            setItems(data.items);
            setOrders(Array.isArray(data.orders) ? data.orders : []);
            localStorage.setItem("booknook_cart", JSON.stringify(data.items));
          }
        } else {
          setItems(local);
        }
      }
    } catch {
      // Local guest cart remains available.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCart();
    const refresh = () => void loadCart();
    window.addEventListener("booknook-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("booknook-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)), 0),
    [items]
  );

  async function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    localStorage.setItem("booknook_cart", JSON.stringify(next));
    window.dispatchEvent(new Event("booknook-cart-updated"));

    if (authenticated) {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: id }),
      }).catch(() => {});
    }
  }

  async function clear() {
    setItems([]);
    localStorage.removeItem("booknook_cart");
    window.dispatchEvent(new Event("booknook-cart-updated"));

    if (authenticated) {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true }),
      }).catch(() => {});
    }
  }

  function coverFor(item: CartItem) {
    if (item.cover_url) return item.cover_url;
    return "/api/books/cover?slug=" + encodeURIComponent(item.slug);
  }

  return (
    <>
      <SiteHeader />
      <main className="bn-page px-3 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Link href="/books" className="text-sm font-bold text-[var(--booknook-primary)]">← Continue shopping</Link>
              <h1 className="mt-2 text-3xl font-black text-[var(--booknook-ink)] sm:text-4xl">My Cart 🛒</h1>
              <p className="mt-1 text-sm text-[var(--booknook-muted)]">
                {itemCount} {itemCount === 1 ? "book" : "books"} · Review and pay once.
              </p>
            </div>
            {items.length > 0 && (
              <button onClick={clear} className="text-sm font-bold text-red-600">Clear cart</button>
            )}
          </div>

          {loading ? (
            <div className="mt-5 bn-surface p-6 text-center text-sm text-[var(--booknook-muted)]">Loading your cart…</div>
          ) : items.length === 0 ? (
            <div className="mt-5 bn-surface p-8 text-center">
              <div className="text-4xl">🛒</div>
              <h2 className="mt-2 text-xl font-black">Your cart is empty</h2>
              <Link href="/books" className="bn-button mt-4 text-sm">Browse Books</Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_300px]">
              <section className="space-y-2">
                {items.map((item) => (
                  <article key={item.id} className="bn-surface flex gap-3 p-3 sm:p-4">
                    <Link href={"/books/" + item.slug} className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-20">
                      <Image
                        src={coverFor(item)}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link href={"/books/" + item.slug} className="block truncate text-base font-black text-[var(--booknook-ink)] sm:text-lg">
                        {item.title}
                      </Link>
                      {item.author && <p className="mt-0.5 truncate text-xs text-[var(--booknook-muted)]">By {item.author}</p>}
                      {item.genre && <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wide text-[var(--booknook-primary)]">{item.genre}</span>}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-base font-black">₹{Number(item.price).toFixed(2)}</span>
                        <button onClick={() => remove(item.id)} className="text-xs font-bold text-red-600">Remove</button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              <aside className="bn-surface h-fit p-4 lg:sticky lg:top-20">
                <h2 className="text-base font-black text-[var(--booknook-muted)]">Order summary</h2>
                <div className="mt-3 flex justify-between text-base font-black">
                  <span>{itemCount} {itemCount === 1 ? "book" : "books"}</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (items.length) {
                      // Guest carts live in localStorage, so pass their IDs to
                      // checkout. Signed-in carts are read from Supabase to keep
                      // the complete server-side cart in one place.
                      const destination = authenticated
                        ? "/checkout?cart=all"
                        : "/checkout?bookIds=" + items.map((item) => encodeURIComponent(item.id)).join(",");
                      router.push(destination);
                    }
                  }}
                  className="mt-4 flex w-full items-center justify-center rounded-full bg-[var(--booknook-primary)] px-5 py-3 font-black text-white"
                >
                  Checkout All
                </button>
                <p className="mt-2 text-center text-[11px] text-[var(--booknook-muted)]">Secure payment · Instant digital access</p>
              </aside>
            </div>
          )}

          {authenticated && (
            <section className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[var(--booknook-ink)]">Previous Orders</h2>
                  <p className="text-xs text-[var(--booknook-muted)]">Your recent BookNook purchases.</p>
                </div>
                <Link href="/account/purchases" className="text-xs font-bold text-[var(--booknook-primary)]">View all →</Link>
              </div>

              {orders.length === 0 ? (
                <div className="bn-surface p-4 text-sm text-[var(--booknook-muted)]">No previous orders yet.</div>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <article key={order.id} className="bn-surface flex items-center gap-3 p-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {order.items.slice(0, 3).map((book) => (
                          <div key={book.id} className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md bg-slate-100">
                            <Image
                              src={"/api/books/cover?slug=" + encodeURIComponent(book.slug)}
                              alt={book.title}
                              fill
                              sizes="32px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ))}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{order.items.map((book) => book.title).join(", ")}</p>
                          <p className="text-[11px] text-[var(--booknook-muted)]">
                            {new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.status}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-black">₹{order.amount.toFixed(2)}</span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
