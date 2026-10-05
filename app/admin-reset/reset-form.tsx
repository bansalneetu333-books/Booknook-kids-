"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "bansalneetu333@gmail.com";

export default function AdminResetPage() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setMessage("Please use the Booknook Kids administrator email.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/admin-reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        ADMIN_EMAIL,
        { redirectTo }
      );

      if (error) {
        setMessage(error.message);
        return;
      }

      setSent(true);
      setMessage("Password reset email sent. Check your inbox and open the reset link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[2rem] border border-slate-800 bg-white p-6 shadow-2xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl">📚</div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-violet-600">Booknook Kids</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Reset Admin Password</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">We will send a secure password-reset link to the administrator email.</p>
          </div>

          {message && (
            <div role="alert" className={`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold ${sent ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {message}
            </div>
          )}

          {!sent && (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="admin-reset-email" className="mb-2 block text-sm font-bold text-slate-700">Admin email</label>
                <input
                  id="admin-reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white shadow-lg hover:bg-violet-700 disabled:opacity-60">
                {loading ? "Sending..." : "Send Reset Email"}
              </button>
            </form>
          )}

          <Link href="/admin-login" className="mt-7 block text-center text-sm font-bold text-slate-500 hover:text-violet-600">
            ← Back to Admin Login
          </Link>
        </section>
      </div>
    </main>
  );
}
