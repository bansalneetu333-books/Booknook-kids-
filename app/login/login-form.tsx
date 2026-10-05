"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function normalizePhone(value: string) {
  const cleaned = value.replace(/[\s()-]/g, "");

  // Accept Indian mobile numbers with or without +91.
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return cleaned;
}

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
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
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
    setLoading(true);
    setMessage(null);
    setSuccess(null);

    const normalizedPhone = normalizePhone(phone);

    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setMessage("Enter a valid mobile number, for example 7743085373 or +917743085373.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { shouldCreateUser: true },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setPhone(normalizedPhone);
      setStep("otp");
      setSuccess("OTP sent. Check your mobile for the verification code.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setSuccess(null);

    const normalizedPhone = normalizePhone(phone);
    const token = otp.replace(/\D/g, "");

    if (!/^\d{6,8}$/.test(token)) {
      setMessage("Enter the OTP sent to your mobile.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token,
        type: "sms",
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.user) {
        setMessage("Verification succeeded but no account was returned. Please try again.");
        return;
      }

      await supabase.auth.updateUser({
        data: {
          mobile_number: normalizedPhone,
          whatsapp_number: normalizedPhone,
        },
      });

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
      setMessage(error instanceof Error ? error.message : "Verification failed. Please try again.");
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
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-2xl shadow-sm">📚</span>
              <span className="text-2xl font-black text-slate-900">Booknook Kids</span>
            </Link>

            <h1 className="mt-7 text-3xl font-black text-slate-900">
              {step === "phone" ? "Welcome! 👋" : "Verify your mobile 📱"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {step === "phone"
                ? "Enter your mobile number to sign in or create your Booknook Kids account."
                : `We sent an OTP to ${phone}.`}
            </p>
          </div>

          {(message || success) && (
            <div role="alert" className={`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold ${success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {success ?? message}
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={sendOtp} className="mt-7 space-y-5">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-bold text-slate-700">Mobile No.</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
                <p className="mt-2 text-xs text-slate-400">Include your country code, for example +91.</p>
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3.5 font-black text-white shadow-lg transition hover:from-violet-700 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="mt-7 space-y-5">
              <div>
                <label htmlFor="otp" className="mb-2 block text-sm font-bold text-slate-700">Enter OTP</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={8}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="Enter OTP"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-2xl font-black tracking-[0.35em] text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-3.5 font-black text-white shadow-lg transition hover:from-violet-700 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button type="button" onClick={() => { setStep("phone"); setOtp(""); setMessage(null); setSuccess(null); }} className="w-full text-sm font-bold text-violet-600 hover:text-violet-800">
                Change mobile number
              </button>
            </form>
          )}

          <Link href="/" className="mt-7 block text-center text-sm font-semibold text-slate-400 hover:text-slate-600">
            ← Back to Booknook Kids
          </Link>

          <div className="mt-5 text-center">
            <Link href="/admin-login" className="text-xs font-semibold text-slate-400 hover:text-slate-600">
              Admin login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
