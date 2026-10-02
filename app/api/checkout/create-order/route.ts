import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in before purchasing." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const bookId = String(body?.bookId || "").trim();

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,title,price,published")
      .eq("id", bookId)
      .eq("published", true)
      .maybeSingle();

    if (bookError) {
      console.error("Book lookup error:", bookError);

      return NextResponse.json(
        { error: "Unable to load the selected book." },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        { error: "Book not found or not available." },
        { status: 404 }
      );
    }

    const { data: existingPurchase, error: purchaseError } =
      await supabase
        .from("order_items")
        .select("id, orders!inner(user_id,status)")
        .eq("book_id", bookId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "paid")
        .limit(1)
        .maybeSingle();

    if (purchaseError) {
      console.error(
        "Existing purchase lookup error:",
        purchaseError
      );

      return NextResponse.json(
        { error: "Unable to check your previous purchases." },
        { status: 500 }
      );
    }

    if (existingPurchase) {
      return NextResponse.json(
        {
          error: "You already own this book.",
          alreadyOwned: true,
        },
        { status: 409 }
      );
    }

    const price = Number(book.price ?? 0);

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "This book does not have a valid price." },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(price * 100);

    const receipt = `book_${bookId.slice(0, 8)}_${Date.now()}`;

    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        user_id: user.id,
        book_id: bookId,
      },
    });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        razorpay_order_id: razorpayOrder.id,
        status: "pending",
        amount: price,
        currency: "INR",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error(
        "Order insert error:",
        orderError
      );

      return NextResponse.json(
        { error: "Unable to create your order." },
        { status: 500 }
      );
    }

    const { error: itemError } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        book_id: bookId,
        price,
      });

    if (itemError) {
      console.error(
        "Order item insert error:",
        itemError
      );

      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      return NextResponse.json(
        { error: "Unable to create your order item." },
        { status: 500 }
      );
    }

    const { keyId } = getRazorpayConfig();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || "INR",
      keyId,
      book: {
        id: book.id,
        title: book.title,
        price,
      },
    });
  } catch (error) {
    console.error(
      "Create checkout order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create your order.",
      },
      { status: 500 }
    );
  }
}
