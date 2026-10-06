import Link from "next/link";
import { redirect } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { SiteHeader } from "@/components/site-header";
import { WishlistButton } from "@/components/wishlist-button";
import { createClient } from "@/lib/supabase/server";

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/wishlist");

  const { data, error } = await supabase
    .from("wishlists")
    .select("book_id, created_at, books!inner(id,title,slug,author,price,currency,genre,age_category,cover_path,published,featured,is_free,created_at)")
    .eq("user_id", user.id)
    .eq("books.published", true)
    .order("created_at", { ascending: false });

  if (error) console.error("Wishlist page error:", error);

  const books = (data ?? [])
    .map((item: any) => Array.isArray(item.books) ? item.books[0] : item.books)
    .filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-pink-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Link href="/books" className="text-sm font-bold text-violet-700">← Continue shopping</Link>
          <h1 className="mt-4 text-4xl font-black text-slate-900">My Wishlist ❤️</h1>
          <p className="mt-2 text-slate-500">{books.length} saved {books.length === 1 ? "book" : "books"}</p>
          {books.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">
              <div className="text-6xl">♡</div><h2 className="mt-4 text-2xl font-black">Your wishlist is empty</h2>
              <p className="mt-2 text-slate-500">Save books here and come back when you are ready to read.</p>
              <Link href="/books" className="mt-6 inline-flex rounded-full bg-violet-600 px-6 py-3 font-black text-white">Explore Books</Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((book: any) => (
                <article key={book.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Link href={`/books/${book.slug}`} className="flex gap-4">
                    <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                      {book.cover_path ? <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${book.cover_path}`} alt={book.title} className="h-full w-full object-cover" /> : <span className="text-3xl">📚</span>}
                    </div>
                    <div className="min-w-0"><h2 className="font-black text-slate-900">{book.title}</h2><p className="mt-1 text-sm text-slate-500">By {book.author}</p><p className="mt-3 text-lg font-black">{book.is_free ? "Free" : `₹${Number(book.price).toFixed(2)}`}</p></div>
                  </Link>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {!book.is_free && <AddToCartButton book={{id:book.id,title:book.title,slug:book.slug,price:Number(book.price),cover_path:book.cover_path}} />}
                    <Link href={book.is_free ? `/reader/${book.id}` : `/checkout?bookId=${book.id}`} className="inline-flex items-center justify-center rounded-full bg-violet-600 px-4 py-3 text-sm font-black text-white">{book.is_free ? "Read Free" : "Buy Now"}</Link>
                    <div className="col-span-2"><WishlistButton bookId={book.id} /></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
