"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function getErrorMessage(value: string | null) {
  if (!value) return null;

  return value === "otp_expired"
    ? "That OTP has expired. Please request a new one."
    : value === "access_denied"
      ? "The verification was cancelled or denied. Please try again."
      : value;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(
    getErrorMessage(searchParams.get("error"))
  );
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) setMessage(getErrorMessage(error));
  }, [searchParams]);

  async function sendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage("Enter a valid email address.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/library`;

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setEmail(normalizedEmail);
      setStep("otp");
      setSuccess("OTP sent. Check your email for the verification code.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to send OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const token = otp.replace(/\D/g, "");

    if (!/^\d{6}$/.test(token)) {
      setMessage("Enter the 6-digit OTP sent to your email.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: "email",
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.user) {
        setMessage(
          "Verification succeeded but no account was returned. Please try again."
        );
        return;
      }

      const requestedNext = searchParams.get("next");
      const safeNext =
        requestedNext &&
        requestedNext.startsWith("/") &&
        !requestedNext.startsWith("//") &&
        requestedNext !== "/admin"
          ? requestedNext
          : "/library";

      router.replace(safeNext);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#dbeafe,transparent_30%),radial-gradient(circle_at_90%_20%,#fce7f3,transparent_30%),#f8fafc] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[2rem] border border-white bg-white p-6 shadow-xl sm:p-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-2xl shadow-sm">
                📚
              </span>
              <span className="text-2xl font-black text-slate-900">
                Booknook Kids
              </span>
            </Link>

            <h1 className="mt-7 text-3xl font-black text-slate-900">
              {step === "email" ? "Welcome! 👋" : "Check your email ✉️"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {step === "email"
                ? "Enter your email to sign in or create your Booknook Kids account."
                : `We sent a 6-digit OTP to ${email}.`}
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

          {step === "email" ? (
            <form onSubmit={sendOtp} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3.5 font-black text-white shadow-lg transition hover:from-violet-700 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Enter 6-digit OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-2xl font-black tracking-[0.35em] text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3.5 font-black text-white shadow-lg transition hover:from-violet-700 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setMessage(null);
                  setSuccess(null);
                }}
                className="w-full text-sm font-bold text-violet-600 hover:text-violet-800"
              >
                Change email address
              </button>
            </form>
          )}

          <Link
            href="/"
            className="mt-7 block text-center text-sm font-semibold text-slate-400 hover:text-slate-600"
          >
            ← Back to Booknook Kids
          </Link>

          <div className="mt-5 text-center">
            <Link
              href="/admin-login"
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Admin login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
