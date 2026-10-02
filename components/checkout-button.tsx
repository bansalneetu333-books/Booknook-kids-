"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutButtonProps = {
  bookId: string;
  price: number;
  title?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description?: string;
      order_id: string;
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => void;
      modal?: {
        ondismiss?: () => void;
      };
      prefill?: {
        name?: string;
        email?: string;
      };
      theme?: {
        color?: string;
      };
    }) => {
      open: () => void;
    };
  }
}

export function CheckoutButton({
  bookId,
  price,
  title,
}: CheckoutButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadRazorpay() {
    if (window.Razorpay) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const existing = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existing) {
        existing.addEventListener("load", () =>
          resolve(Boolean(window.Razorpay))
        );
        existing.addEventListener("error", () =>
          resolve(false)
        );
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.async = true;

      script.onload = () =>
        resolve(Boolean(window.Razorpay));

      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  async function startCheckout() {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const razorpayLoaded =
        await loadRazorpay();

      if (!razorpayLoaded) {
        throw new Error(
          "Unable to load Razorpay. Please try again."
        );
      }

      const response = await fetch(
        "/api/checkout/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push(
            `/login?next=${encodeURIComponent(
              `/checkout?bookId=${bookId}`
            )}`
          );
          return;
        }

        throw new Error(
          data?.error ||
            "Unable to create your order."
        );
      }

      const key =
        data?.keyId ||
        data?.key ||
        process.env
          .NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!key) {
        throw new Error(
          "Razorpay configuration is missing."
        );
      }

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay is not available."
        );
      }

      const options = {
        key,
        amount: Number(data.amount),
        currency: data.currency || "INR",
        name: "Booknook Kids",
        description:
          title || "Booknook Kids ebook",
        order_id: data.razorpayOrderId,
        handler: async (payment: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setMessage(
              "Verifying your payment…"
            );

            const verifyResponse =
              await fetch(
                "/api/checkout/verify",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    orderId:
                      data.orderId,
                    razorpayOrderId:
                      payment.razorpay_order_id,
                    razorpayPaymentId:
                      payment.razorpay_payment_id,
                    razorpaySignature:
                      payment.razorpay_signature,
                  }),
                }
              );

            const verifyData =
              await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData?.error ||
                  "Payment verification failed."
              );
            }

            setMessage(
              "Payment successful! Your book is now in your library."
            );

            router.push(
              `/library?payment=success&order=${encodeURIComponent(
                data.orderId
              )}`
            );
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Payment verification failed."
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setMessage(
              "Payment window closed."
            );
          },
        },
        theme: {
          color: "#6366f1",
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.open();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start checkout."
      );

      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="w-full rounded-full bg-indigo-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Processing…"
          : `Buy Now • ₹${Number(price).toFixed(2)}`}
      </button>

      {message && (
        <p
          className="mt-3 text-center text-sm text-slate-600"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
}
