"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "bansalneetu333@gmail.com";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"login" | "forgot" | "update">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  /*
   * Check whether Supabase has already established a session.
   *
   * This is particularly important after the /auth/callback route
   * exchanges the recovery/login code for a session.
   */
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const userEmail = session.user.email?.trim().toLowerCase();

          if (userEmail === ADMIN_EMAIL.toLowerCase()) {
            router.replace("/admin");
          } else {
            router.replace("/library");
          }

          return;
        }

        const errorParam = searchParams.get("error");

        if (errorParam) {
          setError(decodeURIComponent(errorParam));
        }

        /*
         * If Supabase redirected here after password recovery,
         * the recovery session will normally already be available.
         */
        const type = searchParams.get("type");

        if (type === "recovery") {
          setMode("update");
        }
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    /*
     * Supabase can establish a session after this page initially loads,
     * so listen for auth changes as well.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
        setMessage("Create your new password below.");
        setError("");
        return;
      }

      if (
        event === "SIGNED_IN" &&
        session?.user &&
        !window.location.pathname.startsWith("/admin") &&
        !window.location.pathname.startsWith("/library")
      ) {
        const userEmail = session.user.email?.trim().toLowerCase();

        if (userEmail === ADMIN_EMAIL.toLowerCase()) {
          router.replace("/admin");
        } else {
          router.replace("/library");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, searchParams, supabase.auth]);

  /*
   * Normal email/password login.
   */
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error("Please enter your email address.");
      }

      if (!password) {
        throw new Error("Please enter your password.");
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error("Login was not completed. Please try again.");
      }

      const userEmail = data.user.email?.trim().toLowerCase();

      if (userEmail === ADMIN_EMAIL.toLowerCase()) {
        router.replace("/admin");
      } else {
        router.replace("/library");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /*
   * Send Supabase's standard password-reset email.
   *
   * We deliberately use the canonical Supabase recovery flow here
   * instead of pretending that the project has a custom 8-digit OTP
   * implementation.
   */
  async function handleForgotPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error("Please enter your email address.");
      }

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        window.location.origin;

      const redirectTo = `${siteUrl}/auth/callback?next=/login`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo,
        });

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "Password reset instructions have been sent to your email. Please open the email and follow the secure link to create a new password."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /*
   * Set a new password after Supabase has established a recovery session.
   */
  async function handleUpdatePassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!newPassword) {
        throw new Error("Please enter a new password.");
      }

      if (newPassword.length < 6) {
        throw new Error(
          "Your password must be at least 6 characters long."
        );
      }

      if (newPassword !== confirmPassword) {
        throw new Error("The passwords do not match.");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Your password-reset session has expired. Please request a new reset email."
        );
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw updateError;
      }

      setNewPassword("");
      setConfirmPassword("");
      setMessage(
        "Your password has been updated successfully. You can now sign in."
      );

      /*
       * Sign out after changing the password so the user explicitly
       * signs in with the new credentials.
       */
      await supabase.auth.signOut();

      setMode("login");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function showLogin() {
    setMode("login");
    setError("");
    setMessage("");
    setPassword("");
  }

  function showForgot() {
    setMode("forgot");
    setError("");
    setMessage("");
    setPassword("");
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          <p className="text-sm font-medium text-slate-600">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 px-4 py-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <div className="w-full">
          {/* Brand */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-purple-600 text-3xl shadow-lg">
              📚
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              BookNook Kids
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Fun digital books and stories for curious young readers.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-xl sm:p-8">
            {/* LOGIN */}
            {mode === "login" && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Welcome back 👋
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Sign in to continue reading.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {message}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      disabled={loading}
                    />
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={showForgot}
                      className="text-sm font-semibold text-sky-600 hover:text-sky-700"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-purple-600 px-5 py-3.5 font-bold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs leading-5 text-slate-500">
                    Your account determines where you go after signing in.
                    The configured administrator account is automatically
                    sent to the admin dashboard.
                  </p>
                </div>
              </>
            )}

            {/* FORGOT PASSWORD */}
            {mode === "forgot" && (
              <>
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={showLogin}
                    className="mb-4 text-sm font-semibold text-sky-600 hover:text-sky-700"
                    disabled={loading}
                  >
                    ← Back to sign in
                  </button>

                  <h2 className="text-2xl font-bold text-slate-900">
                    Reset your password
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter your account email and we&apos;ll send you a secure
                    password-reset link.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {message}
                  </div>
                )}

                <form
                  onSubmit={handleForgotPassword}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Email address
                    </label>

                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-purple-600 px-5 py-3.5 font-bold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Sending..."
                      : "Send Reset Instructions"}
                  </button>
                </form>
              </>
            )}

            {/* UPDATE PASSWORD */}
            {mode === "update" && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Create a new password 🔐
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter and confirm your new password below.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {message}
                  </div>
                )}

                <form
                  onSubmit={handleUpdatePassword}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      New password
                    </label>

                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Confirm new password
                    </label>

                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      placeholder="Enter the password again"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-purple-600 px-5 py-3.5 font-bold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Updating password..."
                      : "Update Password"}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} BookNook Kids
          </p>
        </div>
      </div>
    </main>
  );
}
