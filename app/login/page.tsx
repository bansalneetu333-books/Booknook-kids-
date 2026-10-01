"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "bansalneetu333@gmail.com";
const RESEND_SECONDS = 60;

type Mode = "login" | "signup" | "forgot" | "verify" | "reset";
type LoginType = "customer" | "admin";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loginType, setLoginType] = useState<LoginType>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = window.setInterval(
      () => setResendSeconds((v) => Math.max(0, v - 1)),
      1000
    );

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function choose(type: LoginType) {
    clearMessages();
    setMode("login");
    setLoginType(type);
    setPassword("");

    if (type === "admin") {
      setEmail(ADMIN_EMAIL);
    } else if (email.toLowerCase() === ADMIN_EMAIL) {
      setEmail("");
    }
  }

  function backToLogin() {
    clearMessages();
    setMode("login");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (
        loginType === "admin" &&
        normalizedEmail !== ADMIN_EMAIL
      ) {
        setError("Use the admin email to enter Admin.");
        return;
      }

      if (
        loginType === "customer" &&
        normalizedEmail === ADMIN_EMAIL
      ) {
        setError("Choose Admin Login for this account.");
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, 80)
      );

      window.location.replace(
        loginType === "admin" ? "/admin" : "/library"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === ADMIN_EMAIL) {
      setError("This email is reserved for Admin.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: name.trim()
            },
            emailRedirectTo:
              `${window.location.origin}/login`
          }
        });

      if (error) {
        setError(error.message);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMode("login");

      setMessage(
        data.session
          ? "Account ready. You can log in now."
          : "Account created. Check your email to confirm it, then log in."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendCode() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your email first.");
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo:
              `${window.location.origin}/login`
          }
        );

      if (error) {
        setError(error.message);
        return;
      }

      setEmail(normalizedEmail);
      setOtp("");
      setResendSeconds(RESEND_SECONDS);
      setMode("verify");

      setMessage(
        "If an account exists for this email, your 8-digit code is on its way."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send the code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    clearMessages();

    const token = otp
      .replace(/\D/g, "")
      .slice(0, 8);

    if (token.length !== 8) {
      setError("Enter the full 8-digit code.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token,
          type: "recovery"
        });

      if (error) {
        setError(error.message);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMode("reset");

      setMessage(
        "Code checked. Make your new password."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to check the code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    clearMessages();

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.updateUser({
          password
        });

      if (error) {
        setError(error.message);
        return;
      }

      await supabase.auth.signOut();

      setPassword("");
      setConfirmPassword("");
      setMode("login");

      setMessage(
        "Password changed. Log in with your new password."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change the password."
      );
    } finally {
      setLoading(false);
    }
  }

  const input =
    "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_35%),linear-gradient(135deg,#f8fafc,#eef2ff,#fff7ed)] px-4 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur sm:p-8">

          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-indigo-100 text-3xl">
              📚
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Booknook Kids
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Little stories. Big ideas. ✨
            </p>
          </div>

          {mode === "login" && (
            <div className="mt-7 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => choose("customer")}
                className={`rounded-xl px-3 py-3 text-sm font-black ${
                  loginType === "customer"
                    ? "bg-white text-indigo-600 shadow"
                    : "text-slate-500"
                }`}
              >
                Reader
              </button>

              <button
                type="button"
                onClick={() => choose("admin")}
                className={`rounded-xl px-3 py-3 text-sm font-black ${
                  loginType === "admin"
                    ? "bg-white text-violet-600 shadow"
                    : "text-slate-500"
                }`}
              >
                Admin
              </button>
            </div>
          )}

          <div className="mt-7">
            <h2 className="text-2xl font-black">
              {mode === "login"
                ? loginType === "admin"
                  ? "Admin Login"
                  : "Welcome back"
                : mode === "signup"
                ? "Join Booknook"
                : mode === "forgot"
                ? "Find your password"
                : mode === "verify"
                ? "Check your code"
                : "New password"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {mode === "login"
                ? loginType === "admin"
                  ? "Open your dashboard."
                  : "Pick up where you left off."
                : "A simple, secure step."}
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          {mode === "login" && (
            <form
              onSubmit={handleLogin}
              className="mt-6 space-y-4"
            >
              <label className="block text-sm font-bold">
                Email

                <input
                  className={`${input} ${
                    loginType === "admin"
                      ? "bg-slate-100"
                      : ""
                  }`}
                  type="email"
                  value={email}
                  readOnly={loginType === "admin"}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block text-sm font-bold">
                Password

                <input
                  className={input}
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                  required
                />
              </label>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3.5 font-black text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading
                  ? "Opening…"
                  : loginType === "admin"
                  ? "Open Admin"
                  : "Open Library"}
              </button>

              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode("forgot");
                }}
                className="w-full py-2 text-sm font-bold text-indigo-600"
              >
                Forgot password?
              </button>

              {loginType === "customer" && (
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode("signup");
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold"
                >
                  New here? Join
                </button>
              )}
            </form>
          )}

          {mode === "signup" && (
            <form
              onSubmit={handleSignup}
              className="mt-6 space-y-4"
            >
              <label className="block text-sm font-bold">
                Name

                <input
                  className={input}
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  autoComplete="name"
                  required
                />
              </label>

              <label className="block text-sm font-bold">
                Email

                <input
                  className={input}
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block text-sm font-bold">
                Password

                <input
                  className={input}
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="block text-sm font-bold">
                Repeat

                <input
                  className={input}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </label>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3.5 font-black text-white disabled:opacity-60"
              >
                {loading ? "Making…" : "Join"}
              </button>

              <button
                type="button"
                onClick={backToLogin}
                className="w-full py-2 text-sm font-bold text-indigo-600"
              >
                Back
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
              className="mt-6 space-y-4"
            >
              <label className="block text-sm font-bold">
                Email

                <input
                  className={input}
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </label>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3.5 font-black text-white disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Code"}
              </button>

              <button
                type="button"
                onClick={backToLogin}
                className="w-full py-2 text-sm font-bold text-indigo-600"
              >
                Back
              </button>
            </form>
          )}

          {mode === "verify" && (
            <form
              onSubmit={handleVerify}
              className="mt-6 space-y-4"
            >
              <label className="block text-sm font-bold">
                Code

                <input
                  className={`${input} text-center text-2xl font-black tracking-[0.35em]`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 8)
                    )
                  }
                  maxLength={8}
                  placeholder="00000000"
                  required
                />
              </label>

              <button
                disabled={
                  loading || otp.length !== 8
                }
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3.5 font-black text-white disabled:opacity-50"
              >
                {loading ? "Checking…" : "Check Code"}
              </button>

              <button
                type="button"
                disabled={
                  loading || resendSeconds > 0
                }
                onClick={() => void sendCode()}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold disabled:text-slate-400"
              >
                {resendSeconds
                  ? `Resend in ${resendSeconds}s`
                  : "Resend Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode("forgot");
                }}
                className="w-full py-2 text-sm font-bold text-slate-500"
              >
                Change email
              </button>
            </form>
          )}

          {mode === "reset" && (
            <form
              onSubmit={handleReset}
              className="mt-6 space-y-4"
            >
              <label className="block text-sm font-bold">
                New password

                <input
                  className={input}
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="block text-sm font-bold">
                Repeat password

                <input
                  className={input}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </label>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3.5 font-black text-white disabled:opacity-60"
              >
                {loading
                  ? "Saving…"
                  : "Save Password"}
              </button>
            </form>
          )}

          <a
            href="/"
            className="mt-7 block text-center text-xs font-semibold text-slate-400"
          >
            ← Back to Booknook
          </a>
        </div>
      </div>
    </main>
  );
}
