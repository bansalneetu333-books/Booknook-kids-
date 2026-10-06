import { createClient } from "@/lib/supabase/server";

export type CheckoutBook = {
  id: string; title: string; slug: string; author: string | null; price: number; cover_path: string | null;
};

export async function getCheckoutBook(bookId: string): Promise<CheckoutBook | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("books")
    .select("id,title,slug,author,price,cover_path,published,is_published,is_free")
    .eq("id", bookId).maybeSingle();

  if (error) { console.error("Checkout book lookup error:", error); throw new Error("Unable to load the selected book."); }
  if (!data || (!data.published && !data.is_published) || data.is_free || Number(data.price ?? 0) <= 0) return null;

  return { id:data.id,title:data.title,slug:data.slug,author:data.author,price:Number(data.price ?? 0),cover_path:data.cover_path };
}

export async function getPurchasedBookIds(bookIds: string[]) {
  if (!bookIds.length) return new Set<string>();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set<string>();

  const { data, error } = await supabase.from("order_items")
    .select("book_id,orders!inner(user_id,status)")
    .in("book_id", bookIds).eq("orders.user_id", user.id).eq("orders.status", "paid");

  if (error) { console.error("Purchase lookup error:", error); throw new Error("Unable to verify previous purchases."); }
  return new Set((data ?? []).map(item => item.book_id));
}

export async function hasPurchasedBook(bookId: string) {
  const owned = await getPurchasedBookIds([bookId]);
  return owned.has(bookId);
}
