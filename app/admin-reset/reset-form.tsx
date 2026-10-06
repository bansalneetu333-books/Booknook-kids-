"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "bansalneetu333@gmail.com";

type Step = "email" | "code" | "password";

export default function AdminResetPage() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setMessage("Please use the Booknook Kids administrator email.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        ADMIN_EMAIL,
        {
          redirectTo: `${window.location.origin}/admin-reset`,
        }
      );

      if (error) {
        setMessage(error.message);
        return;
      }

      setStep("code");
      setSuccess("Reset code sent. Check your email and enter the code below.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send reset code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = code.replace(/\D/g, "");

    if (!/^\d{6,8}$/.test(token)) {
      setMessage("Enter the reset code from your email.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.verifyOtp({
        email: ADMIN_EMAIL,
        token,
        type: "recovery",
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.session || !data.user) {
        setMessage("The code was verified, but a recovery session was not created. Please request a new code.");
        return;
      }

      setStep("password");
      setSuccess("Code verified. You can now create a new admin password.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify the reset code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        return;
      }

      await supabase.auth.signOut();

      setSuccess("Password changed successfully. You can now sign in to Admin.");
      setStep("email");
      setCode("");
      setPassword("");
      setConfirm("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the admin password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[2rem] border border-slate-800 bg-white p-6 shadow-2xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--booknook-primary)] text-2xl">
              {step === "password" ? "🔐" : "📚"}
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[var(--booknook-primary)]">
              Booknook Kids
            </p>
            <h1 className="mt-2 text-3xl font-black text-[var(--booknook-ink)]">
              {step === "email"
                ? "Reset Admin Password"
                : step === "code"
                  ? "Enter Reset Code"
                  : "Create New Password"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--booknook-muted)]">
              {step === "email"
                ? "We'll send a verification code to the administrator email."
                : step === "code"
                  ? `Enter the code sent to ${ADMIN_EMAIL}.`
                  : "Choose a new password for your administrator account."}
            </p>
          </div>

          {(message || success) && (
            <div
              role="alert"
              className={`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold ${
                success
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {success ?? message}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={sendCode} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="admin-reset-email"
                  className="mb-2 block text-sm font-bold text-[var(--booknook-ink)]"
                >
                  Admin email
                </label>
                <input
                  id="admin-reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-2xl border border-[var(--booknook-border)] bg-[#f7f8fc] px-4 py-3.5 text-[var(--booknook-ink)] outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[var(--booknook-primary)] px-5 py-3.5 font-black text-white shadow-lg hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={verifyCode} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="reset-code"
                  className="mb-2 block text-sm font-bold text-[var(--booknook-ink)]"
                >
                  Reset code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={8}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  placeholder="Enter code"
                  className="w-full rounded-2xl border border-[var(--booknook-border)] bg-[#f7f8fc] px-4 py-3.5 text-center text-2xl font-black tracking-[0.3em] text-[var(--booknook-ink)] outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[var(--booknook-primary)] px-5 py-3.5 font-black text-white shadow-lg hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify Reset Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setMessage(null);
                  setSuccess(null);
                }}
                className="w-full text-sm font-bold text-[var(--booknook-primary)] hover:text-violet-800"
              >
                Send a new code
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={updatePassword} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-bold text-[var(--booknook-ink)]"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-2xl border border-[var(--booknook-border)] bg-[#f7f8fc] px-4 py-3.5 text-[var(--booknook-ink)] outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-bold text-[var(--booknook-ink)]"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-2xl border border-[var(--booknook-border)] bg-[#f7f8fc] px-4 py-3.5 text-[var(--booknook-ink)] outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[var(--booknook-primary)] px-5 py-3.5 font-black text-white shadow-lg hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Create New Password"}
              </button>
            </form>
          )}

          <Link
            href="/admin-login"
            className="mt-7 block text-center text-sm font-bold text-[var(--booknook-muted)] hover:text-[var(--booknook-primary)]"
          >
            ← Back to Admin Login
          </Link>
        </section>
      </div>
    </main>
  );
}
