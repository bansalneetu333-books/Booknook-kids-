"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Creating your account…");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus(
      "Account created. Check your email if confirmation is enabled, then log in."
    );
  }

  return (
    <main className="bn-page grid min-h-screen place-items-center px-4 py-10 sm:px-6">
      <form
        onSubmit={submit}
        className="bn-surface w-full max-w-md p-7 sm:p-8"
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-2xl shadow-sm">
            📚
          </div>

          <h1 className="mt-5 text-3xl font-black text-[var(--booknook-ink)]">
            Create Account ✨
          </h1>
        </div>

        <label className="mt-6 block text-sm font-semibold">
          Full Name
        </label>

        <input
          className="bn-input mt-2 w-full px-4 py-3.5"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label className="mt-4 block text-sm font-semibold">
          Email
        </label>

        <input
          className="bn-input mt-2 w-full px-4 py-3.5"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="mt-4 block text-sm font-semibold">
          Password
        </label>

        <input
          className="bn-input mt-2 w-full px-4 py-3.5"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bn-button mt-6 w-full"
          type="submit"
        >
          Create Account
        </button>

        <p
          className="mt-4 rounded-2xl bg-[#fffdf9] p-3 text-sm text-[var(--booknook-muted)]"
          aria-live="polite"
        >
          {status}
        </p>
      </form>
    </main>
  );
}
