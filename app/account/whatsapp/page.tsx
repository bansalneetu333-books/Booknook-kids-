"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

type Preferences = {
  phone_number: string | null;
  opted_in: boolean;
  order_updates: boolean;
  book_updates: boolean;
  marketing_updates: boolean;
};

export default function WhatsAppPreferencesPage() {
  const [preferences, setPreferences] = useState<Preferences>({
    phone_number: "",
    opted_in: false,
    order_updates: true,
    book_updates: false,
    marketing_updates: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/account/whatsapp", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load WhatsApp settings.");
      }

      if (data?.preferences) {
        setPreferences({
          phone_number: data.preferences.phone_number ?? "",
          opted_in: Boolean(data.preferences.opted_in),
          order_updates: data.preferences.order_updates !== false,
          book_updates: Boolean(data.preferences.book_updates),
          marketing_updates: Boolean(data.preferences.marketing_updates),
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load WhatsApp settings."
      );
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/account/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save WhatsApp preferences."
        );
      }

      setMessage("Your WhatsApp preferences have been saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save WhatsApp preferences."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fc] p-6">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">💬</div>
          <p className="mt-4 font-semibold text-[var(--booknook-muted)]">
            Loading WhatsApp settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <>\n      <SiteHeader />\n      <main className="bn-page">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

        <Link
          href="/account"
          className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[var(--booknook-primary)] shadow-sm ring-1 ring-[var(--booknook-border)] hover:bg-violet-50"
        >
          ← Back to My Account
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
            WhatsApp
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-[var(--booknook-ink)]">
            WhatsApp Preferences
          </h1>

          <p className="mt-2 max-w-2xl text-[var(--booknook-muted)]">
            Connect WhatsApp to receive useful Booknook Kids updates about
            your purchases, books and other notifications you choose.
          </p>
        </div>

        <div className="mt-8 space-y-6">

          {/* WhatsApp number */}
          <section className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm sm:p-8">

            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-3xl">
                💬
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
                  Your WhatsApp Number
                </h2>

                <p className="mt-1 text-sm leading-6 text-[var(--booknook-muted)]">
                  Enter your WhatsApp number using the international country
                  code.
                </p>
              </div>
            </div>

            <label
              htmlFor="whatsapp-number"
              className="mt-6 block text-sm font-bold text-[var(--booknook-ink)]"
            >
              WhatsApp Number
            </label>

            <input
              id="whatsapp-number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+1 555 123 4567"
              value={preferences.phone_number ?? ""}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  phone_number: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[var(--booknook-ink)] outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

            <div className="mt-3 rounded-2xl bg-[#f7f8fc] p-4">
              <p className="text-sm font-semibold text-[var(--booknook-ink)]">
                🌎 International numbers are supported.
              </p>

              <p className="mt-1 text-sm leading-6 text-[var(--booknook-muted)]">
                Include the country code. Examples: +1, +44, +91, +61.
                Avoid adding spaces, brackets or hyphens if possible.
              </p>
            </div>

          </section>

          {/* Main opt-in */}
          <section className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm sm:p-8">

            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
                  WhatsApp Notifications
                </h2>

                <p className="mt-1 text-sm leading-6 text-[var(--booknook-muted)]">
                  Choose whether Booknook Kids may send WhatsApp
                  notifications to you.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={preferences.opted_in}
                onClick={() =>
                  setPreferences((current) => ({
                    ...current,
                    opted_in: !current.opted_in,
                  }))
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  preferences.opted_in
                    ? "bg-emerald-500"
                    : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                    preferences.opted_in
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            {!preferences.opted_in && (
              <div className="mt-5 rounded-2xl bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  WhatsApp notifications are currently turned off.
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-700">
                  Turn them on if you want to receive the notification types
                  selected below.
                </p>
              </div>
            )}

          </section>

          {/* Notification types */}
          <section className="rounded-3xl border border-[var(--booknook-border)] bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
              Choose Your Updates
            </h2>

            <p className="mt-1 text-sm leading-6 text-[var(--booknook-muted)]">
              You control which types of WhatsApp messages you receive.
            </p>

            <div className="mt-6 space-y-4">

              <PreferenceRow
                icon="🧾"
                title="Order Updates"
                description="Important updates about purchases and orders."
                checked={preferences.order_updates}
                onChange={(checked) =>
                  setPreferences((current) => ({
                    ...current,
                    order_updates: checked,
                  }))
                }
              />

              <PreferenceRow
                icon="📚"
                title="New Book & Book Updates"
                description="Updates when new books are released or existing books are updated."
                checked={preferences.book_updates}
                onChange={(checked) =>
                  setPreferences((current) => ({
                    ...current,
                    book_updates: checked,
                  }))
                }
              />

              <PreferenceRow
                icon="✨"
                title="Marketing & Special Updates"
                description="Optional messages about promotions, special offers and Booknook Kids announcements."
                checked={preferences.marketing_updates}
                onChange={(checked) =>
                  setPreferences((current) => ({
                    ...current,
                    marketing_updates: checked,
                  }))
                }
              />

            </div>

          </section>

          {/* Information */}
          <section className="rounded-3xl border border-violet-100 bg-violet-50 p-6">

            <h2 className="text-lg font-extrabold text-[var(--booknook-ink)]">
              🔐 Your Choice & Privacy
            </h2>

            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--booknook-muted)]">
              <li>
                • WhatsApp messages are sent only according to the preferences
                you choose.
              </li>

              <li>
                • Your WhatsApp number is used for Booknook Kids
                communications you have enabled.
              </li>

              <li>
                • You can change your preferences at any time.
              </li>

              <li>
                • WhatsApp messages will not contain permanent private ebook
                download links.
              </li>
            </ul>

          </section>

          {/* Messages */}
          {message && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Save */}
          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            className="w-full rounded-full bg-[var(--booknook-primary)] px-6 py-4 text-base font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving Preferences..." : "Save WhatsApp Preferences"}
          </button>

        </div>
      </div>
    </main>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--booknook-border)] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="text-2xl">{icon}</div>

        <div>
          <h3 className="font-bold text-[var(--booknook-ink)]">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-5 text-[var(--booknook-muted)]">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[var(--booknook-primary)]" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
