import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getUserPurchases } from "@/lib/orders";
import { SiteHeader } from "@/components/site-header";

export default async function PurchasesPage() {
  const { user } = await requireUser();

  if (!user) {
    redirect("/login");
  }

  const purchases = await getUserPurchases(user.id);

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-black">
            Purchase History
          </h1>

          <div className="mt-7 space-y-3">
            {purchases.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                <p className="text-4xl">🧾</p>

                <p className="mt-3 font-bold text-slate-600">
                  No purchases yet.
                </p>
              </div>
            ) : (
              purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-black">
                        {purchase.book_title}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(
                          purchase.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <p className="font-black text-indigo-600">
                      ₹{purchase.amount}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
