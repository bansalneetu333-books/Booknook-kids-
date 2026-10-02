import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    "Reader";

  const email =
    profile?.email ||
    user.email ||
    "";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
            My Account
          </p>

          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
            Welcome, {displayName}
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your Booknook Kids account and reading preferences.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-3xl">
                👤
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Account Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your login account details.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Name
                </p>

                <p className="mt-1 font-bold text-slate-800">
                  {displayName}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email
                </p>

                <p className="mt-1 break-all font-bold text-slate-800">
                  {email || "No email"}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/library"
            className="rounded-3xl border border-violet-200 bg-violet-50 p-6 transition hover:bg-violet-100"
          >
            <div className="text-3xl">📚</div>

            <h2 className="mt-4 text-lg font-extrabold text-slate-900">
              My Library
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-600">
              Open your purchased books and continue reading.
            </p>

            <p className="mt-4 text-sm font-bold text-violet-700">
              Open Library →
            </p>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AccountCard
            href="/account/whatsapp"
            icon="💬"
            title="WhatsApp"
            description="Connect WhatsApp and choose which Booknook Kids updates you receive."
          />

          <AccountCard
            href="/orders"
            icon="🧾"
            title="My Orders"
            description="View your purchases and payment history."
          />

          <AccountCard
            href="/wishlist"
            icon="❤️"
            title="Wishlist"
            description="See books you have saved for later."
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900">
            Your Privacy & Preferences
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Your account information is used to provide your Booknook Kids
            library and purchases. WhatsApp messages are only enabled according
            to the preferences you choose in your WhatsApp settings.
          </p>

          <Link
            href="/account/whatsapp"
            className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Manage WhatsApp Preferences
          </Link>
        </div>
      </div>
    </div>
  );
}

function AccountCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
    >
      <div className="text-3xl">{icon}</div>

      <h2 className="mt-4 text-lg font-extrabold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-5 text-slate-500">
        {description}
      </p>

      <p className="mt-4 text-sm font-bold text-violet-700">
        Manage →
      </p>
    </Link>
  );
}
