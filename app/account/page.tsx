import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default async function AccountPage() {
  const { user } = await requireUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[2rem] bg-white p-7 shadow-sm">
            <p className="text-sm font-black text-indigo-600">
              ACCOUNT
            </p>

            <h1 className="mt-2 text-4xl font-black">
              My Account
            </h1>

            <div className="mt-8 rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Email
              </p>

              <p className="mt-1 font-bold text-slate-800">
                {user.email}
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/library"
                className="rounded-2xl border border-slate-200 bg-white p-5 font-black shadow-sm"
              >
                📚 My Library
              </Link>

              <Link
                href="/account/purchases"
                className="rounded-2xl border border-slate-200 bg-white p-5 font-black shadow-sm"
              >
                🧾 Purchases
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
