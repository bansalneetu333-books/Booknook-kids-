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
  price: number;
  cover_path?: string | null;
};

function getCart(): CartItem[] {
  try {
    const value = JSON.parse(localStorage.getItem("booknook_cart") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const refresh = () => setItems(getCart());
    refresh();
    window.addEventListener("booknook-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("booknook-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0), 0), [items]);

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    localStorage.setItem("booknook_cart", JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event("booknook-cart-updated"));
  }

  function clear() {
    localStorage.removeItem("booknook_cart");
    setItems([]);
    window.dispatchEvent(new Event("booknook-cart-updated"));
  }

  return (
    <>
      <SiteHeader />
      <main className="bn-page px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/books" className="text-sm font-bold text-[var(--booknook-primary)]">← Continue shopping</Link>
        <h1 className="mt-4 text-4xl font-black text-[var(--booknook-ink)]">My Cart 🛒</h1>
        <p className="mt-2 text-[var(--booknook-muted)]">Review your books and pay once for everything.</p>

        {items.length === 0 ? (
          <div className="mt-8 bn-surface p-10 text-center">
            <div className="text-5xl">🛒</div>
            <h2 className="mt-4 text-2xl font-black">Your cart is empty</h2>
            <Link href="/books" className="mt-6 inline-flex rounded-full bg-[var(--booknook-primary)] px-6 py-3 font-bold text-white">Browse Books</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              {items.map((item) => {
                const cover = item.cover_path
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${item.cover_path}`
                  : null;
                return (
                  <article key={item.id} className="flex gap-4 bn-surface p-4">
                    <Link href={`/books/${item.slug}`} className="relative h-28 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {cover ? <Image src={cover} alt={item.title} fill sizes="80px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-3xl">📚</span>}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/books/${item.slug}`} className="font-black text-[var(--booknook-ink)]">{item.title}</Link>
                      <p className="mt-2 text-lg font-black">₹{Number(item.price).toFixed(2)}</p>
                      <button onClick={() => remove(item.id)} className="mt-3 text-sm font-bold text-red-600">Remove</button>
                    </div>
                  </article>
                );
              })}
              <button onClick={clear} className="text-sm font-bold text-[var(--booknook-muted)]">Clear cart</button>
            </div>

            <aside className="h-fit bn-surface p-6 lg:sticky lg:top-24">
              <p className="text-sm font-bold text-[var(--booknook-muted)]">Order summary</p>
              <div className="mt-4 flex justify-between text-lg font-black">
                <span>{items.length} {items.length === 1 ? "book" : "books"}</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const ids = items.map((item) => item.id).filter(Boolean);
                  if (!ids.length) return;
                  router.push(`/checkout?bookIds=${encodeURIComponent(ids.join(","))}`);
                }}
                className="mt-6 flex w-full items-center justify-center rounded-full bg-[var(--booknook-primary)] px-6 py-3.5 font-black text-white transition hover:opacity-90 active:scale-[0.99]"
              >
                Checkout All
              </button>
            </aside>
          </div>
        )}
      </div>
      </main>
    </>
  );
}
