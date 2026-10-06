"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutButtonProps = { bookId?: string; bookIds?: string[]; price: number; title?: string };

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string; amount: number; currency: string; name: string; description?: string; order_id: string;
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
      modal?: { ondismiss?: () => void }; theme?: { color?: string };
    }) => { open: () => void };
  }
}

function getCheckoutIds(bookId?: string, bookIds?: string[]) {
  return [...new Set((bookIds?.length ? bookIds : bookId ? [bookId] : []).filter(Boolean))];
}

export function CheckoutButton({ bookId, bookIds, price, title }: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadRazorpay() {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const selector = 'script[src="https://checkout.razorpay.com/v1/checkout.js"]';
      const existing = document.querySelector(selector);
      if (existing) {
        existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(Boolean(window.Razorpay));
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function startCheckout() {
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const ids = getCheckoutIds(bookId, bookIds);
      if (!ids.length) throw new Error("No books selected.");

      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) throw new Error("Unable to load Razorpay. Please try again.");

      const response = await fetch("/api/checkout/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookIds: ids }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/login?next=${encodeURIComponent(`/checkout?bookIds=${ids.join(",")}`)}`);
          return;
        }
        if (response.status === 409 && data?.alreadyPurchased) {
          router.push("/library");
          return;
        }
        throw new Error(data?.error || "Unable to create your order.");
      }

      const razorpayOrderId = data?.razorpay?.orderId;
      const amount = Number(data?.razorpay?.amount);
      const currency = data?.razorpay?.currency || "INR";
      const orderId = data?.order?.id;
      const key = data?.keyId;
      if (!key) throw new Error("Razorpay configuration is missing.");
      if (!razorpayOrderId) throw new Error("Razorpay order was not created correctly.");
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid payment amount.");
      if (!orderId) throw new Error("Local order was not created correctly.");
      if (!window.Razorpay) throw new Error("Razorpay is not available.");

      const razorpay = new window.Razorpay({
        key, amount, currency, name: "Booknook Kids", description: title || "Booknook Kids ebook", order_id: razorpayOrderId,
        handler: async payment => {
          try {
            setMessage("Verifying your payment…");
            const verifyResponse = await fetch("/api/checkout/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payment),
            });
            const verifyData = await verifyResponse.json().catch(() => ({}));
            if (!verifyResponse.ok) throw new Error(verifyData?.error || "Payment verification failed.");

            try {
              const current = JSON.parse(localStorage.getItem("booknook_cart") || "[]") as { id: string }[];
              localStorage.setItem("booknook_cart", JSON.stringify(current.filter(item => !ids.includes(item.id))));
            } catch { /* Cart cleanup is non-critical after payment. */ }

            window.dispatchEvent(new Event("booknook-cart-updated"));
            router.push(`/library?payment=success&order=${encodeURIComponent(orderId)}`);
          } catch (error) {
            console.error("Payment verification error:", error);
            setMessage(error instanceof Error ? error.message : "Payment verification failed.");
            setLoading(false);
          }
        },
        modal: { ondismiss: () => { setLoading(false); setMessage("Payment window closed."); } },
        theme: { color: "#6366f1" },
      });
      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);
      setMessage(error instanceof Error ? error.message : "Unable to start checkout.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={startCheckout} disabled={loading}
        className="w-full rounded-full bg-indigo-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? "Processing…" : `Buy Now • ₹${Number(price).toFixed(2)}`}
      </button>
      {message && <p className="mt-3 text-center text-sm text-slate-600" aria-live="polite">{message}</p>}
    </div>
  );
}
