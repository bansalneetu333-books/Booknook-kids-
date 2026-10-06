"use client";

import { useEffect, useState } from "react";

type CartBook = {
  id: string;
  title: string;
  slug: string;
  price: number;
  cover_path?: string | null;
};

export function AddToCartButton({ book }: { book: CartBook }) {
  const [added, setAdded] = useState(false);

  function addToCart() {
    try {
      const current = JSON.parse(localStorage.getItem("booknook_cart") || "[]") as CartBook[];
      if (!current.some((item) => item.id === book.id)) {
        localStorage.setItem("booknook_cart", JSON.stringify([...current, book]));
      }
      setAdded(true);
      window.dispatchEvent(new Event("booknook-cart-updated"));
    } catch {
      setAdded(false);
    }
  }

  useEffect(() => {
    try {
      const current = JSON.parse(localStorage.getItem("booknook_cart") || "[]") as CartBook[];
      setAdded(current.some((item) => item.id === book.id));
    } catch {}
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
