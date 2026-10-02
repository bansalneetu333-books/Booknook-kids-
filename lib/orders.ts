import { createClient } from "@/lib/supabase/server";

export async function getMyOrders() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      amount,
      currency,
      razorpay_order_id,
      razorpay_payment_id,
      status,
      created_at,
      order_items (
        id,
        price,
        book_id,
        books (
          id,
          title,
          slug,
          author,
          cover_path
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load orders:", error);
    throw new Error("Unable to load your orders.");
  }

  return data ?? [];
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      amount,
      currency,
      razorpay_order_id,
      razorpay_payment_id,
      status,
      created_at,
      order_items (
        id,
        price,
        book_id,
        books (
          id,
          title,
          slug,
          author,
          cover_path
        )
      )
    `)
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Unable to load order:", error);
    return null;
  }

  return data;
}
