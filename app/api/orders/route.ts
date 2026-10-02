import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    // ------------------------------------------------------------
    // 1. Require logged-in customer
    // ------------------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to view your orders." },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------
    // 2. Load this customer's orders
    // ------------------------------------------------------------
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
      console.error(
        "Customer orders lookup error:",
        ordersError
      );

      return NextResponse.json(
        { error: "Unable to load your orders." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 3. Return safe customer order information
    // ------------------------------------------------------------
    const formattedOrders = (orders ?? []).map((order) => ({
      id: order.id,
      razorpayOrderId: order.razorpay_order_id,
      razorpayPaymentId: order.razorpay_payment_id,
      status: order.status,
      amount: Number(order.amount),
      currency: order.currency,
      createdAt: order.created_at,
      updatedAt: order.updated_at,

      items: (order.order_items ?? []).map((item) => ({
        id: item.id,
        bookId: item.book_id,
        price: Number(item.price),
        createdAt: item.created_at,
        book: item.books
          ? {
              id: item.books.id,
              title: item.books.title,
              slug: item.books.slug,
              author: item.books.author,
              description: item.books.description,
              price: Number(item.books.price),
              currency: item.books.currency,
              genre: item.books.genre,
              ageCategory: item.books.age_category,
              coverPath: item.books.cover_path,
              published: item.books.published,
              featured: item.books.featured,
            }
          : null,
      })),
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
