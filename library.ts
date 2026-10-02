import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getMyLibrary() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("order_items")
    .select(`
      id,
      price,
      book_id,
      orders!inner (
        user_id,
        status,
        created_at
      ),
      books (
        id,
        title,
        slug,
        author,
        description,
        cover_path,
        genre,
        age_category
      )
    `)
    .eq("orders.user_id", user.id)
    .eq("orders.status", "paid")
    .order("id", { ascending: false });

  if (error) {
    console.error("Library lookup error:", error);
    throw new Error("Unable to load your library.");
  }

  const bookIds = (data ?? []).map(
    (item) => item.book_id
  );

  const progress =
    bookIds.length === 0
      ? []
      : (
          await supabase
            .from("reading_progress")
            .select(
              "book_id, location, progress_percentage, last_read_at"
            )
            .eq("user_id", user.id)
            .in("book_id", bookIds)
        ).data ?? [];

  const progressMap = new Map(
    progress.map((item) => [
      item.book_id,
      item,
    ])
  );

  return (data ?? []).map((item) => ({
    ...item,
    progress:
      progressMap.get(item.book_id) ?? null,
  }));
}

export async function ownsBook(bookId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("order_items")
    .select(
      "id, orders!inner(user_id, status)"
    )
    .eq("book_id", bookId)
    .eq("orders.user_id", user.id)
    .eq("orders.status", "paid")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Book ownership lookup error:",
      error
    );

    return false;
  }

  return Boolean(data);
}

export async function getPurchaseHistory() {
  const supabase = await createClient();
  const user = await getCurrentUser();

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
        price,
        books (
          title,
          slug
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Purchase history lookup error:",
      error
    );

    throw new Error(
      "Unable to load purchase history."
    );
  }

  return data ?? [];
}
