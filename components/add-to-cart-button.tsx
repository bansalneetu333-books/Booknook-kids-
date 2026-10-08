"use client";

import { useEffect, useState } from "react";

type CartBook = {
  id: string;
  title: string;
  slug: string;
  price: number;
  cover_path?: string | null;
};

function readLocalCart(): CartBook[] {
  try {
    const value = JSON.parse(localStorage.getItem("booknook_cart") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function AddToCartButton({ book }: { book: CartBook }) {
  const [added, setAdded] = useState(false);

  async function addToCart() {
    const current = readLocalCart();
    const next = current.some((item) => item.id === book.id)
      ? current
      : [...current, book];

    localStorage.setItem("booknook_cart", JSON.stringify(next));
    setAdded(true);
    window.dispatchEvent(new Event("booknook-cart-updated"));

    // Persist to the signed-in customer's cart when possible.
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [book] }),
      });
    } catch {
      // Local cart remains the fallback.
    }
  }

  useEffect(() => {
    setAdded(readLocalCart().some((item) => item.id === book.id));

    fetch("/api/cart", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.items)) {
          setAdded(data.items.some((item: { id: string }) => item.id === book.id));
        }
      })
      .catch(() => {});
  }, [book.id]);

  return (
    <button
      type="button"
      onClick={addToCart}
      className="inline-flex items-center justify-center rounded-full border-2 border-violet-600 bg-white px-6 py-3.5 font-bold text-violet-700 transition hover:bg-violet-50"
    >
      {added ? "✓ Added to Cart" : "🛒 Add to Cart"}
    </button>
  );
}

export default AddToCartButton;
