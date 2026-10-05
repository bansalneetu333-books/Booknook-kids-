"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const onAuthStateChange = (event: string) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    };

    const { data } = supabase.auth.onAuthStateChange(onAuthStateChange);

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) setReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        return;
      }

      await supabase.auth.signOut();
      router.replace("/admin-login?reset=success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[2rem] border border-slate-800 bg-white p-6 shadow-2xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl">🔐</div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-violet-600">Booknook Kids</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Create New Password</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Choose a new password for your administrator account.</p>
          </div>

          {message && (
            <div role="alert" className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{message}</div>
          )}

          {ready ? (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-slate-700">New password</label>
                <input id="new-password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100" />
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-slate-700">Confirm password</label>
                <input id="confirm-password" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white shadow-lg hover:bg-violet-700 disabled:opacity-60">
                {loading ? "Updating..." : "Create New Password"}
              </button>
            </form>
          ) : (
            <div className="mt-7 rounded-2xl bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
              This reset link is not active. Please request a new reset email from Admin Login.
            </div>
          )}

          <Link href="/admin-login" className="mt-7 block text-center text-sm font-bold text-slate-500 hover:text-violet-600">
            ← Back to Admin Login
          </Link>
        </section>
      </div>
    </main>
  );
}
