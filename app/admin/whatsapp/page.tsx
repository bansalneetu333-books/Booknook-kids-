"use client";

import { useEffect, useState } from "react";

type Preference = {
  id: string;
  user_id: string;
  phone_number: string | null;
  opted_in: boolean;
  order_updates: boolean;
  book_updates: boolean;
  marketing_updates: boolean;
  created_at: string;
  updated_at: string;
};

type WhatsAppMessage = {
  id: string;
  user_id: string | null;
  phone_number: string | null;
  message_type: string | null;
  template_name: string | null;
  status: string | null;
  book_id: string | null;
  order_id: string | null;
  created_at: string;
  sent_at: string | null;
};

export default function AdminWhatsAppPage() {
  const [preferences, setPreferences] = useState<
    Preference[]
  >([]);

  const [messages, setMessages] = useState<
    WhatsAppMessage[]
  >([]);

  const [configured, setConfigured] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWhatsApp() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/whatsapp",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load WhatsApp information."
        );
      }

      setPreferences(
        Array.isArray(data?.preferences)
          ? data.preferences
          : []
      );

      setMessages(
        Array.isArray(data?.messages)
          ? data.messages
          : []
      );

      setConfigured(
        Boolean(data?.configured)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load WhatsApp information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWhatsApp();
  }, []);

  function formatDate(value: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  const optedInCount = preferences.filter(
    (item) => item.opted_in
  ).length;

  const sentCount = messages.filter(
    (item) =>
      item.status === "sent" ||
      item.status === "delivered" ||
      item.status === "read"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--booknook-primary)]">
            Admin
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-[var(--booknook-ink)]">
            WhatsApp
          </h1>

          <p className="mt-2 max-w-2xl text-[var(--booknook-muted)]">
            Manage customer WhatsApp preferences and message
            activity.
          </p>
        </div>

        <button
          type="button"
          onClick={loadWhatsApp}
          disabled={loading}
          className="rounded-[1.25rem] border border-[#ddd9e8] bg-white px-5 py-3 text-sm font-bold text-[var(--booknook-ink)] transition hover:bg-[#f7f8fc] disabled:opacity-60"
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {!configured && !loading && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">
              💬
            </div>

            <div>
              <h2 className="font-extrabold text-amber-900">
                WhatsApp is not configured yet
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                The dashboard is ready, but the WhatsApp
                customer tables and messaging provider still
                need to be connected. No messages are sent
                from this page.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-[var(--booknook-border)] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[var(--booknook-muted)]">
            WhatsApp Contacts
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[var(--booknook-ink)]">
            {preferences.length}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--booknook-border)] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[var(--booknook-muted)]">
            Opted In
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[var(--booknook-ink)]">
            {optedInCount}
          </p>

          <p className="mt-1 text-xs text-[#8a90a0]">
            Customers who gave WhatsApp consent
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--booknook-border)] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[var(--booknook-muted)]">
            Sent / Delivered / Read
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[var(--booknook-ink)]">
            {sentCount}
          </p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[var(--booknook-border)] bg-white shadow-sm">
        <div className="border-b border-[var(--booknook-border)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
            Customer WhatsApp Preferences
          </h2>

          <p className="mt-1 text-sm text-[var(--booknook-muted)]">
            Customers must explicitly opt in before notification
            or marketing messages are sent.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--booknook-muted)]">
            Loading WhatsApp contacts...
          </div>
        ) : preferences.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">
              📱
            </div>

            <h3 className="mt-3 font-extrabold text-[var(--booknook-ink)]">
              No WhatsApp contacts yet
            </h3>

            <p className="mt-1 text-sm text-[var(--booknook-muted)]">
              WhatsApp details will appear here after customers
              add their number and consent.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {preferences.map((item) => (
              <div
                key={item.id}
                className="p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-extrabold text-[var(--booknook-ink)]">
                      {item.phone_number ||
                        "No phone number"}
                    </p>

                    <p className="mt-1 text-xs text-[var(--booknook-muted)]">
                      Updated{" "}
                      {formatDate(
                        item.updated_at
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <PreferenceBadge
                      enabled={item.opted_in}
                      label="WhatsApp"
                    />

                    <PreferenceBadge
                      enabled={
                        item.order_updates
                      }
                      label="Orders"
                    />

                    <PreferenceBadge
                      enabled={
                        item.book_updates
                      }
                      label="Book updates"
                    />

                    <PreferenceBadge
                      enabled={
                        item.marketing_updates
                      }
                      label="Marketing"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[1.5rem] border border-[var(--booknook-border)] bg-white shadow-sm">
        <div className="border-b border-[var(--booknook-border)] p-6">
          <h2 className="text-xl font-extrabold text-[var(--booknook-ink)]">
            Message Activity
          </h2>

          <p className="mt-1 text-sm text-[var(--booknook-muted)]">
            Message status history from the WhatsApp system.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--booknook-muted)]">
            Loading message activity...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-4xl">
              💬
            </div>

            <h3 className="mt-3 font-extrabold text-[var(--booknook-ink)]">
              No messages yet
            </h3>

            <p className="mt-1 text-sm text-[var(--booknook-muted)]">
              WhatsApp message activity will appear here once
              the messaging system is connected.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="border-b border-[var(--booknook-border)] bg-[#f7f8fc]">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-[var(--booknook-muted)]">
                    <th className="px-6 py-4">
                      Phone
                    </th>

                    <th className="px-6 py-4">
                      Type
                    </th>

                    <th className="px-6 py-4">
                      Template
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {messages.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#f7f8fc]"
                    >
                      <td className="px-6 py-5 text-sm font-semibold text-[var(--booknook-ink)]">
                        {item.phone_number ||
                          "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-[var(--booknook-muted)]">
                        {item.message_type ||
                          "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-[var(--booknook-muted)]">
                        {item.template_name ||
                          "—"}
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-[#f1f2f7] px-3 py-1 text-xs font-bold capitalize text-[var(--booknook-ink)]">
                          {item.status ||
                            "pending"}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-[var(--booknook-muted)]">
                        {formatDate(
                          item.sent_at ||
                            item.created_at
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-200 md:hidden">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-[var(--booknook-ink)]">
                        {item.phone_number ||
                          "Unknown"}
                      </p>

                      <p className="mt-1 text-xs text-[var(--booknook-muted)]">
                        {item.message_type ||
                          "Message"}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#f1f2f7] px-3 py-1 text-xs font-bold capitalize text-[var(--booknook-ink)]">
                      {item.status ||
                        "pending"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-[#f7f8fc] p-3">
                    <p className="text-xs font-semibold text-[#8a90a0]">
                      Template
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-[var(--booknook-ink)]">
                      {item.template_name ||
                        "—"}
                    </p>

                    <p className="mt-2 text-xs text-[var(--booknook-muted)]">
                      {formatDate(
                        item.sent_at ||
                          item.created_at
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PreferenceBadge({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        enabled
          ? "bg-emerald-100 text-emerald-700"
          : "bg-[#f1f2f7] text-[var(--booknook-muted)]"
      }`}
    >
      {enabled ? "✓" : "×"} {label}
    </span>
  );
}
