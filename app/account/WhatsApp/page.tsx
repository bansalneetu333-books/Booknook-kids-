"use client";

import { useEffect, useState } from "react";

type Preferences = {
  phone_number: string;
  opted_in: boolean;
  order_updates: boolean;
  book_updates: boolean;
  marketing_updates: boolean;
};

export default function WhatsAppSettingsPage() {
  const [preferences, setPreferences] =
    useState<Preferences>({
      phone_number: "",
      opted_in: false,
      order_updates: true,
      book_updates: false,
      marketing_updates: false,
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function loadPreferences() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/account/whatsapp",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load WhatsApp settings."
        );
      }

      if (data?.preferences) {
        setPreferences({
          phone_number:
            data.preferences.phone_number ||
            "",
          opted_in: Boolean(
            data.preferences.opted_in
          ),
          order_updates:
            data.preferences.order_updates !==
            false,
          book_updates: Boolean(
            data.preferences.book_updates
          ),
          marketing_updates: Boolean(
            data.preferences.marketing_updates
          ),
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

  useEffect(() => {
    loadPreferences();
  }, []);

  async function savePreferences(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const phone = preferences.phone_number.trim();

    if (
      preferences.opted_in &&
      !phone
    ) {
      setError(
        "Enter your WhatsApp number before enabling WhatsApp notifications."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/account/whatsapp",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            phone_number: phone,
            opted_in:
              preferences.opted_in,
            order_updates:
              preferences.opted_in &&
              preferences.order_updates,
            book_updates:
              preferences.opted_in &&
              preferences.book_updates,
            marketing_updates:
              preferences.opted_in &&
              preferences.marketing_updates,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save WhatsApp settings."
        );
      }

      setPreferences((current) => ({
        ...current,
        phone_number:
          data?.preferences
            ?.phone_number ??
          phone,
        opted_in: Boolean(
          data?.preferences
            ?.opted_in ??
            preferences.opted_in
        ),
        order_updates:
          data?.preferences
            ?.order_updates ??
          preferences.order_updates,
        book_updates:
          data?.preferences
            ?.book_updates ??
          preferences.book_updates,
        marketing_updates:
          data?.preferences
            ?.marketing_updates ??
          preferences.marketing_updates,
      }));

      setMessage(
        "WhatsApp preferences saved successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save WhatsApp settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading WhatsApp settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
          Account
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
          WhatsApp Settings
        </h1>

        <p className="mt-2 text-slate-500">
          Choose which Booknook Kids updates you would like to
          receive on WhatsApp.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      <form
        onSubmit={savePreferences}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
            💬
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Connect WhatsApp
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Add your WhatsApp number and choose which
              notifications you want to receive.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <label
            htmlFor="whatsapp-number"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            WhatsApp Number
          </label>

          <input
            id="whatsapp-number"
            type="tel"
            value={preferences.phone_number}
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                phone_number:
                  event.target.value,
              }))
            }
            placeholder="+91 98765 43210"
            autoComplete="tel"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />

          <p className="mt-2 text-xs text-slate-500">
            Include your country code, for example +91 for India.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <PreferenceToggle
            checked={preferences.opted_in}
            onChange={(checked) =>
              setPreferences((current) => ({
                ...current,
                opted_in: checked,
              }))
            }
            title="Allow WhatsApp notifications"
            description="I agree to receive Booknook Kids WhatsApp messages according to the options below."
          />

          <div
            className={`space-y-3 border-t border-slate-200 pt-5 ${
              preferences.opted_in
                ? ""
                : "opacity-50"
            }`}
          >
            <PreferenceToggle
              checked={
                preferences.order_updates
              }
              disabled={
                !preferences.opted_in
              }
              onChange={(checked) =>
                setPreferences(
                  (current) => ({
                    ...current,
                    order_updates:
                      checked,
                  })
                )
              }
              title="Order updates"
              description="Receive purchase confirmations and information about accessing your books."
            />

            <PreferenceToggle
              checked={
                preferences.book_updates
              }
              disabled={
                !preferences.opted_in
              }
              onChange={(checked) =>
                setPreferences(
                  (current) => ({
                    ...current,
                    book_updates:
                      checked,
                  })
                )
              }
              title="New book and book updates"
              description="Receive notifications when new books launch or your purchased books are updated."
            />

            <PreferenceToggle
              checked={
                preferences.marketing_updates
              }
              disabled={
                !preferences.opted_in
              }
              onChange={(checked) =>
                setPreferences(
                  (current) => ({
                    ...current,
                    marketing_updates:
                      checked,
                  })
                )
              }
              title="Offers and marketing"
              description="Receive occasional Booknook Kids promotions, offers and announcements."
            />
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs leading-5 text-slate-500">
            You can change these preferences at any time. Your
            WhatsApp number will be used only for the notification
            types you choose. Booknook Kids should send messages
            through approved WhatsApp Business templates where
            required.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : "Save WhatsApp Settings"}
        </button>
      </form>
    </div>
  );
}

function PreferenceToggle({
  checked,
  disabled = false,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-4 transition ${
        disabled
          ? "cursor-not-allowed"
          : "hover:border-violet-200 hover:bg-violet-50/30"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
      />

      <span>
        <span className="block font-bold text-slate-800">
          {title}
        </span>

        <span className="mt-1 block text-sm leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}
