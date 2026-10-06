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
          full_name: fullName
        }
      }
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
    <main className="grid min-h-screen place-items-center bg-[#fffdf9] px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md bn-surface p-8 shadow-sm"
      >
        <h1 className="text-3xl font-black">
          Create Account ✨
        </h1>

        <label className="mt-6 block text-sm font-semibold">
          Full Name
        </label>

        <input
          className="mt-2 w-full rounded-2xl border p-3"
          required
          value={fullName}
          onChange={(e) =>
            setFullName(e.target.value)
          }
        />

        <label className="mt-4 block text-sm font-semibold">
          Email
        </label>

        <input
          className="mt-2 w-full rounded-2xl border p-3"
          type="email"
          required
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <label className="mt-4 block text-sm font-semibold">
          Password
        </label>

        <input
          className="mt-2 w-full rounded-2xl border p-3"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          className="mt-6 w-full rounded-xl bg-indigo-600 p-3 font-bold text-white"
          type="submit"
        >
          Create Account
        </button>

        <p
          className="mt-4 text-sm text-[var(--booknook-muted)]"
          aria-live="polite"
        >
          {status}
        </p>
      </form>
    </main>
  );
}
