import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createRazorpayOrder,
} from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const bookId =
      typeof body.bookId === "string"
        ? body.bookId.trim()
        : "";

    if (!bookId) {
      return NextResponse.json(
        {
          error: "Book ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Load the published book.
     */
    const { data: book, error: bookError } =
      await supabase
        .from("books")
        .select(
          `
            id,
            title,
            price,
            currency,
            published
          `
        )
        .eq("id", bookId)
        .eq("published", true)
        .maybeSingle();

    if (bookError) {
      console.error(
        "Unable to load checkout book:",
        bookError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the selected book.",
        },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        {
          error:
            "This book is not available for purchase.",
        },
        { status: 404 }
      );
    }

    const price = Number(
      book.price ?? 0
    );

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "This book has an invalid price.",
        },
        { status: 400 }
      );
    }

    /*
     * Prevent purchasing the same book twice.
     */
    const { data: existingPurchase } =
      await supabase
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
        .eq("orders.status", "paid")
        .limit(1)
        .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        {
          error:
            "You already own this book.",
          alreadyPurchased: true,
          bookId,
        },
        { status: 409 }
      );
    }

    /*
     * Convert INR to paise for Razorpay.
     */
    const amountInPaise =
      Math.round(price * 100);

    if (amountInPaise <= 0) {
      return NextResponse.json(
        {
          error:
            "This book cannot be purchased at its current price.",
        },
        { status: 400 }
      );
    }

    /*
     * Create our local order first.
     */
    const { data: localOrder, error: orderError } =
      await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          amount: price,
          currency:
            book.currency || "INR",
        })
        .select(
          `
            id,
            user_id,
            status,
            amount,
            currency,
            created_at
          `
        )
        .single();

    if (orderError || !localOrder) {
      console.error(
        "Unable to create local order:",
        orderError
      );

      return NextResponse.json(
        {
          error:
            "Unable to create your order.",
        },
        { status: 500 }
      );
    }

    /*
     * Add the purchased book to the order.
     */
    const {
      data: orderItem,
      error: itemError,
    } = await supabase
      .from("order_items")
      .insert({
        order_id: localOrder.id,
        book_id: book.id,
        price,
      })
      .select(
        `
          id,
          order_id,
          book_id,
          price
        `
      )
      .single();

    if (itemError || !orderItem) {
      console.error(
        "Unable to create order item:",
        itemError
      );

      await supabase
        .from("orders")
        .delete()
        .eq("id", localOrder.id);

      return NextResponse.json(
        {
          error:
            "Unable to add the book to your order.",
        },
        { status: 500 }
      );
    }

    /*
     * Create the Razorpay order.
     */
    let razorpayOrder;

    try {
      razorpayOrder =
        await createRazorpayOrder({
          amount: amountInPaise,
          currency:
            book.currency || "INR",
          receipt:
            localOrder.id,
          notes: {
            order_id:
              localOrder.id,
            book_id:
              book.id,
            user_id:
              user.id,
          },
        });
    } catch (error) {
      console.error(
        "Razorpay order creation failed:",
        error
      );

      await supabase
        .from("order_items")
        .delete()
        .eq(
          "id",
          orderItem.id
        );

      await supabase
        .from("orders")
        .delete()
        .eq(
          "id",
          localOrder.id
        );

      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unable to create Razorpay order.",
        },
        { status: 500 }
      );
    }

    /*
     * Store the Razorpay order ID in our
     * local order.
     */
    const {
      data: updatedOrder,
      error: updateError,
    } = await supabase
      .from("orders")
      .update({
        razorpay_order_id:
          razorpayOrder.id,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        localOrder.id
      )
      .select(
        `
          id,
          razorpay_order_id,
          status,
          amount,
          currency
        `
      )
      .single();

    if (
      updateError ||
      !updatedOrder
    ) {
      console.error(
        "Unable to update local order:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Razorpay order was created, but the local order could not be updated. Please contact support before trying again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      order: {
        id: updatedOrder.id,
        razorpayOrderId:
          updatedOrder.razorpay_order_id,
        amount:
          Number(
            updatedOrder.amount
          ),
        currency:
          updatedOrder.currency,
        status:
          updatedOrder.status,
      },

      razorpay: {
        orderId:
          razorpayOrder.id,
        amount:
          razorpayOrder.amount,
        currency:
          razorpayOrder.currency,
      },

      book: {
        id: book.id,
        title: book.title,
        price,
        currency:
          book.currency || "INR",
      },
    });
  } catch (error) {
    console.error(
      "Checkout create-order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create checkout order.",
      },
      { status: 500 }
    );
  }
}
