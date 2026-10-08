"use client";

import { useEffect } from "react";

export default function CartSync() {
  useEffect(() => {
    let active = true;

    async function sync() {
      let items: unknown[] = [];
      try {
        const parsed = JSON.parse(localStorage.getItem("booknook_cart") || "[]");
        items = Array.isArray(parsed) ? parsed : [];
      } catch {}

      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
          cache: "no-store",
        });

        if (!active || !response.ok) return;

        const data = await response.json();
        if (data.authenticated && Array.isArray(data.items)) {
          // The server is the source of truth for signed-in customers.
          localStorage.setItem("booknook_cart", JSON.stringify(data.items));
          window.dispatchEvent(new Event("booknook-cart-updated"));
        }
      } catch {
        // Guests continue using the local cart.
      }
    }

    void sync();
    return () => {
      active = false;
    };
  }, []);

  return null;
}
