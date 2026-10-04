import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to view your orders." },
        { status: 401 }
      );
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        razorpay_order_id,
        razorpay_payment_id,
        status,
        amount,
        currency,
        created_at,
        updated_at,
        order_items(
          id,
          book_id,
          price,
          created_at,
          books(
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
            featured
          )
        )
        `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Customer orders lookup error:", ordersError);

      return NextResponse.json(
        { error: "Unable to load your orders." },
        { status: 500 }
      );
    }

    const formattedOrders = (orders ?? []).map((order) => ({
      id: order.id,
      razorpayOrderId: order.razorpay_order_id,
      razorpayPaymentId: order.razorpay_payment_id,
      status: order.status,
      amount: Number(order.amount),
      currency: order.currency,
      createdAt: order.created_at,
      updatedAt: order.updated_at,

      items: (order.order_items ?? []).map((item) => {
        const book = Array.isArray(item.books)
          ? item.books[0] ?? null
          : item.books;

        return {
          id: item.id,
          bookId: item.book_id,
          price: Number(item.price),
          createdAt: item.created_at,

          book: book
            ? {
                id: book.id,
                title: book.title,
                slug: book.slug,
                author: book.author,
                description: book.description,
                price: Number(book.price),
                currency: book.currency,
                genre: book.genre,
                ageCategory: book.age_category,
                coverPath: book.cover_path,
                published: book.published,
                featured: book.featured,
              }
            : null,
        };
      }),
    }));

    return NextResponse.json({
      ok: true,
      orders: formattedOrders,
      count: formattedOrders.length,
    });
  } catch (error) {
    console.error("Customer orders API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load orders.",
      },
      { status: 500 }
    );
  }
}
