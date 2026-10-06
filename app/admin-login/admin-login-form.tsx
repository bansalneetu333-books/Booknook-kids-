"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "bansalneetu333@gmail.com";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(
    searchParams.get("error")
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setMessage("This login is only for the Booknook Kids administrator.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.user?.email?.trim().toLowerCase() !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        setMessage("This account is not authorized for the admin dashboard.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[2rem] border border-slate-800 bg-white p-6 shadow-2xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--booknook-primary)] text-2xl">📚</div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--booknook-primary)]">Booknook Kids</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--booknook-ink)]">Admin Login</h1>
            <p className="mt-2 text-sm text-[var(--booknook-muted)]">Sign in to manage books, customers, orders and WhatsApp.</p>
          </div>

          {message && (
            <div role="alert" className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-bold text-[var(--booknook-ink)]">Admin email</label>
              <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required className="w-full rounded-2xl border border-[var(--booknook-border)] bg-[#f7f8fc] px-4 py-3.5 text-[var(--booknook-ink)] outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100" />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-bold text-[var(--booknook-ink)]">Password</label>
              <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="w-full rounded-2xl border border-[var(--booknook-border)] bg-[#f7f8fc] px-4 py-3.5 text-[var(--booknook-ink)] outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-[var(--booknook-primary)] px-5 py-3.5 font-black text-white shadow-lg hover:opacity-90 disabled:opacity-60">
              {loading ? "Signing in..." : "Sign in to Admin"}
            </button>

            <Link
              href="/admin-reset"
              className="block text-center text-sm font-bold text-[var(--booknook-primary)] hover:text-violet-800"
            >
              Forgot admin password?
            </Link>
          </form>

          <Link href="/login" className="mt-7 block text-center text-sm font-bold text-[var(--booknook-muted)] hover:text-[var(--booknook-primary)]">
            ← Customer login
          </Link>
        </section>
      </div>
    </main>
  );
}
