import { createClient } from "@/lib/supabase/server";

export type LibraryBook = {
  id: string;
  title: string;
  slug: string;
  author: string;
  description: string | null;
  price: number;
  currency: string;
  genre: string | null;
  age_category: string | null;
  cover_path: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  purchased_at: string;
  order_id: string;
};

export type ReadingProgress = {
  book_id: string;
  location: string | null;
  progress_percentage: number;
  last_read_at: string | null;
};

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error(
      "Unable to get current user:",
      error
    );

    return null;
  }

  return user;
}

export async function getMyLibrary(): Promise<
  LibraryBook[] | null
> {
  const supabase = await createClient();

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("order_items")
    .select(
      `
        id,
        order_id,
        price,
        created_at,
        books (
          id,
          title,
          slug,
          author,
          description,
          price,
          currency,
          genre,
          age_category,
          cover_path,
          published,
          featured,
          created_at
        ),
        orders!inner (
          id,
          user_id,
          status,
          created_at
        )
      `
    )
    .eq("orders.user_id", user.id)
    .eq("orders.payment_status", "paid")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load library:",
      error
    );

    return [];
  }

  const result: LibraryBook[] = [];

  for (const row of data ?? []) {
    const book = Array.isArray(row.books)
      ? row.books[0]
      : row.books;

    const order = Array.isArray(row.orders)
      ? row.orders[0]
      : row.orders;

    if (!book || !order) {
      continue;
    }

    result.push({
      id: book.id,
      title: book.title,
      slug: book.slug,
      author: book.author,
      description:
        book.description ?? null,
      price: Number(book.price ?? 0),
      currency: book.currency ?? "INR",
      genre: book.genre ?? null,
      age_category:
        book.age_category ?? null,
      cover_path:
        book.cover_path ?? null,
      published: Boolean(book.published),
      featured: Boolean(book.featured),
      created_at: book.created_at,
      purchased_at: order.created_at,
      order_id: order.id,
    });
  }

  return result;
}

export async function ownsBook(
  bookId: string
): Promise<boolean> {
  const supabase = await createClient();

  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("order_items")
    .select(
      `
        id,
        orders!inner (
          id,
          user_id,
          status
        )
      `
    )
    .eq("book_id", bookId)
    .eq("orders.user_id", user.id)
    .eq("orders.payment_status", "paid")
    .limit(1);

  if (error) {
    console.error(
      "Unable to check book ownership:",
      error
    );

    return false;
  }

  return Boolean(data && data.length > 0);
}

export async function getPurchaseHistory() {
  const supabase = await createClient();

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        razorpay_order_id,
        razorpay_payment_id,
        payment_status,
        total_amount,
        currency,
        created_at,
        updated_at,
        order_items (
          id,
          price,
          created_at,
          books (
            id,
            title,
            slug,
            author,
            cover_path
          )
        )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load purchase history:",
      error
    );

    return [];
  }

  return (data ?? []).map(
    (order) => ({
      id: order.id,
      razorpayOrderId:
        order.razorpay_order_id,
      razorpayPaymentId:
        order.razorpay_payment_id,
      status: order.payment_status,
      amount: Number(
        order.total_amount ?? 0
      ),
      currency:
        order.currency ?? "INR",
      createdAt: order.created_at,
      updatedAt:
        order.updated_at,
      items: (
        order.order_items ?? []
      ).map((item) => {
        const book = Array.isArray(
          item.books
        )
          ? item.books[0]
          : item.books;

        return {
          id: item.id,
          price: Number(
            item.price ?? 0
          ),
          createdAt:
            item.created_at,
          book: book
            ? {
                id: book.id,
                title: book.title,
                slug: book.slug,
                author: book.author,
                coverPath:
                  book.cover_path ??
                  null,
              }
            : null,
        };
      }),
    })
  );
}

export async function getReadingProgress(
  bookId: string
): Promise<ReadingProgress | null> {
  const supabase = await createClient();

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("reading_progress")
    .select(
      `
        book_id,
        location,
        progress_percentage,
        last_read_at
      `
    )
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load reading progress:",
      error
    );

    return null;
  }

  if (!data) {
    return null;
  }

  return {
    book_id: data.book_id,
    location:
      data.location ?? null,
    progress_percentage:
      Number(
        data.progress_percentage ?? 0
      ),
    last_read_at:
      data.last_read_at ?? null,
  };
}

export async function saveReadingProgress(
  bookId: string,
  location: string | null,
  progressPercentage: number
) {
  const supabase = await createClient();

  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "Not authenticated.",
    };
  }

  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(progressPercentage) || 0
    )
  );

  const { error } = await supabase
    .from("reading_progress")
    .upsert(
      {
        user_id: user.id,
        book_id: bookId,
        location,
        progress_percentage: progress,
        last_read_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "user_id,book_id",
      }
    );

  if (error) {
    console.error(
      "Unable to save reading progress:",
      error
    );

    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}
