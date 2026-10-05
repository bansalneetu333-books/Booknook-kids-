"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "bansalneetu333@gmail.com";

function getErrorMessage(value: string | null) {
  if (!value) return null;
  const messages: Record<string, string> = {
    missing_code: "The sign-in link is missing its code. Please try again.",
    session_not_found: "We could not create your session. Please sign in again.",
    reset: "Your password reset link is invalid or has expired.",
  };
  return messages[value] ?? value;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(
    getErrorMessage(searchParams.get("error"))
  );
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) setMessage(getErrorMessage(authError));
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setSuccess(null);

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: \${window.location.origin}/auth/callback?next=/library,
          },
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        if (!data.session) {
          setSuccess(
            "Account created. Check your email to confirm your account, then sign in."
          );
          return;
        }

        router.replace("/library");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.user) {
        setMessage("Sign-in succeeded but no user session was returned. Please try again.");
        return;
      }

      const requestedNext = searchParams.get("next");
      const safeNext =
        requestedNext &&
        requestedNext.startsWith("/") &&
        !requestedNext.startsWith("//")
          ? requestedNext
          : null;

      const isAdmin =
        data.user.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

      const destination = isAdmin ? "/admin" : safeNext ?? "/library";

      router.replace(destination);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
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
              {mode === "login" ? "Welcome back! 👋" : "Create your account ✨"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === "login"
                ? "Sign in to continue to your Booknook Kids library."
                : "Create a free account to build your personal bookshelf."}
            </p>
          </div>

          {(message || success) && (
            <div
              role="alert"
              className={\`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold \${
                success
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }\`}
            >
              {success ?? message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3.5 font-black text-white shadow-lg transition hover:from-violet-700 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {mode === "login" && (
            <div className="mt-5 text-center">
              <Link href="/reset-password" className="text-sm font-bold text-violet-600 hover:text-violet-800">
                Forgot password?
              </Link>
            </div>
          )}

          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setMessage(null);
                setSuccess(null);
              }}
              className="mt-2 font-black text-violet-600 hover:text-violet-800"
            >
              {mode === "login" ? "Create a new account" : "Sign in instead"}
            </button>
          </div>

          <Link href="/" className="mt-6 block text-center text-sm font-semibold text-slate-400 hover:text-slate-600">
            ← Back to Booknook Kids
          </Link>
        </section>
      </div>
    </main>
  );
}
