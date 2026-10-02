import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type StatusPayload = {
  orderId?: string;
};

export async function POST(request: Request) {
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
        { error: "Please log in to check your payment." },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------
    // 2. Read request
    // ------------------------------------------------------------
    const body = (await request.json()) as StatusPayload;

    const orderId =
      typeof body.orderId === "string"
        ? body.orderId.trim()
        : "";

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 3. Load only this user's order
    // ------------------------------------------------------------
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id,user_id,razorpay_order_id,razorpay_payment_id,status,amount,currency,created_at,updated_at"
      )
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Payment status order lookup error:",
        orderError
      );

      return NextResponse.json(
        { error: "Unable to check payment status." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // 4. Load the book attached to this order
    // ------------------------------------------------------------
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        id,
        book_id,
        price,
        books(
          id,
          title,
          slug,
          author,
          cover_path
        )
        `
      )
      .eq("order_id", order.id);

    if (itemsError) {
      console.error(
        "Payment status order items error:",
        itemsError
      );

      return NextResponse.json(
        { error: "Unable to load purchased books." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 5. Return safe payment status
    // ------------------------------------------------------------
    return NextResponse.json({
      ok: true,

      order: {
        id: order.id,
        razorpayOrderId: order.razorpay_order_id,
        razorpayPaymentId: order.razorpay_payment_id,
        status: order.status,
        amount: Number(order.amount),
        currency: order.currency,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },

      items: items ?? [],

      paid: order.status === "paid",
      pending: order.status === "pending",
      failed: order.status === "failed",
    });
  } catch (error) {
    console.error("Payment status API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to check payment status.",
      },
      { status: 500 }
    );
  }
}
