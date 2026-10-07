import { redirect } from "next/navigation";
import Link from "next/link";

import { getPurchaseHistory } from "@/lib/library";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const purchases = await getPurchaseHistory();

  if (!purchases) {
    redirect("/login");
  }

  return (
    <main className="bn-page">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/account"
            className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[var(--booknook-primary)] shadow-sm ring-1 ring-[var(--booknook-border)] hover:bg-violet-50"
          >
            ← Back to account
          </Link>

          <h1 className="mt-4 text-3xl font-extrabold text-[var(--booknook-ink)]">
            Purchase History
          </h1>

          <p className="mt-2 text-[var(--booknook-muted)]">
            Books you have purchased through BookNook Kids.
          </p>
        </div>

        {purchases.length === 0 ? (
          <div className="rounded-3xl border border-[var(--booknook-border)] bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">📚</div>

            <h2 className="mt-4 text-xl font-bold text-[var(--booknook-ink)]">
              No purchases yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--booknook-muted)]">
              Your purchased books will appear here after a successful
              payment.
            </p>

            <Link
              href="/library"
              className="bn-button mt-6"
            >
              Browse My Library
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase: any) => (
              <div
                key={purchase.id}
                className="rounded-3xl border border-[var(--booknook-border)] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Purchase
                    </p>

                    <p className="mt-1 font-bold text-[var(--booknook-ink)]">
                      {purchase.book?.title ||
                        purchase.title ||
                        "Book purchase"}
                    </p>

                    {purchase.createdAt && (
                      <p className="mt-1 text-sm text-[var(--booknook-muted)]">
                        {new Date(
                          purchase.createdAt
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {purchase.amount !== undefined && (
                      <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-[var(--booknook-ink)]">
                        ₹{Number(purchase.amount).toFixed(2)}
                      </span>
                    )}

                    {purchase.book?.slug && (
                      <Link
                        href={`/books/${purchase.book.slug}`}
                        className="bn-button px-5 py-2.5 text-sm"
                      >
                        View Book
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
