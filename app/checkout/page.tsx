import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getBookByIdForCheckout } from "@/lib/checkout";
import { getCurrentUser } from "@/lib/library";
import { CheckoutButton } from "@/components/checkout-button";

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ book?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/checkout");
  }

  const { book } = await searchParams;

  if (!book) {
    redirect("/books");
  }

  const item = await getBookByIdForCheckout(book);

  if (!item) {
    redirect("/books");
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold text-indigo-600">
            Secure checkout
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Confirm your purchase
          </h1>

          <div className="mt-8 flex items-center justify-between gap-4 border-b pb-6">
            <div>
              <h2 className="font-bold">
                {item.title}
              </h2>

              <p className="text-sm text-slate-500">
                Digital EPUB
              </p>
            </div>

            <strong>₹{item.price}</strong>
          </div>

          <div className="mt-6 flex items-center justify-between text-lg font-black">
            <span>Total</span>
            <span>₹{item.price} INR</span>
          </div>

          <CheckoutButton
            bookId={item.id}
            bookTitle={item.title}
            amount={item.price}
          />

          <p className="mt-4 text-center text-xs text-slate-500">
            Your payment is processed securely by Razorpay.
          </p>
        </div>
      </main>
    </>
  );
}
