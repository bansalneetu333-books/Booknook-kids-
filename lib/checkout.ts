import { createClient } from "@/lib/supabase/server";

export type CheckoutBook = {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  price: number;
  cover_path: string | null;
};

export async function getCheckoutBook(
  bookId: string
): Promise<CheckoutBook | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select(
      "id,title,slug,author,price,cover_path"
    )
    .eq("id", bookId)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error(
      "Checkout book lookup error:",
      error
    );

    throw new Error(
      "Unable to load the selected book."
    );
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    price: Number(data.price ?? 0),
  };
}

export async function hasPurchasedBook(
  bookId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("order_items")
    .select(
      "id, orders!inner(user_id,status)"
    )
    .eq("book_id", bookId)
    .eq("orders.user_id", user.id)
    .eq("orders.status", "paid")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Purchase lookup error:",
      error
    );

    return false;
  }

  return Boolean(data);
}
