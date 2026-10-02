"use client";

import { useEffect, useState } from "react";

type WishlistButtonProps = {
  bookId: string;
};

export function WishlistButton({
  bookId,
}: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWishlistStatus() {
      try {
        const response = await fetch(
          `/api/wishlist?bookId=${encodeURIComponent(bookId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setWishlisted(Boolean(data?.wishlisted));
        }
      } catch {
        // User may simply not be logged in.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWishlistStatus();

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  async function toggleWishlist() {
    if (saving) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/wishlist", {
        method: wishlisted ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setMessage("Please log in to use your wishlist.");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to update wishlist."
        );
      }

      setWishlisted(
        data?.wishlisted !== undefined
          ? Boolean(data.wishlisted)
          : !wishlisted
      );

      setMessage(
        wishlisted
          ? "Removed from wishlist."
          : "Added to wishlist."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update wishlist."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggleWishlist}
        disabled={loading || saving}
        aria-label={
          wishlisted
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
        aria-pressed={wishlisted}
        className={`flex items-center justify-center gap-2 rounded-full border px-5 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          wishlisted
            ? "border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        <span className="text-lg">
          {wishlisted ? "♥" : "♡"}
        </span>

        <span>
          {loading
            ? "Loading…"
            : saving
            ? "Saving…"
            : wishlisted
            ? "In Wishlist"
            : "Add to Wishlist"}
        </span>
      </button>

      {message && (
        <p
          className="mt-2 text-xs text-slate-500"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default WishlistButton;
