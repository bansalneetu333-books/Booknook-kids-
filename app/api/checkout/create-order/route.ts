import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CreateOrderPayload = {
  bookId?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // ------------------------------------------------------------
    // 1. Require a logged-in customer
    // ------------------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in before purchasing a book." },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------
    // 2. Read request
    // ------------------------------------------------------------
    const body = (await request.json()) as CreateOrderPayload;

    const bookId =
      typeof body.bookId === "string" ? body.bookId.trim() : "";

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 3. Load the published book
    // ------------------------------------------------------------
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id,title,price,currency,published")
      .eq("id", bookId)
      .eq("published", true)
      .maybeSingle();

    if (bookError) {
      console.error("Create Razorpay order - book lookup:", bookError);

      return NextResponse.json(
        { error: "Unable to load the book." },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        { error: "Book not found or is not currently available." },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // 4. Validate price
    // ------------------------------------------------------------
    const price = Number(book.price);

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "This book does not have a valid purchase price." },
        { status: 400 }
      );
    }

    // Razorpay expects the amount in the smallest currency unit.
    // INR 100.00 = 10000 paise.
    const amountInPaise = Math.round(price * 100);

    if (amountInPaise <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 5. Check whether the customer already owns this book
    // ------------------------------------------------------------
    const { data: existingPurchase, error: purchaseCheckError } =
      await supabase
        .from("order_items")
        .select(
          `
          id,
          orders!inner(
            id,
            user_id,
            status
          )
        `
        )
        .eq("book_id", bookId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "paid")
        .limit(1);

    if (purchaseCheckError) {
      console.error(
        "Create Razorpay order - ownership check:",
        purchaseCheckError
      );

      return NextResponse.json(
        { error: "Unable to verify your existing purchases." },
        { status: 500 }
      );
    }

    if (existingPurchase && existingPurchase.length > 0) {
      return NextResponse.json(
        {
          error: "You already own this book.",
          alreadyOwned: true,
        },
        { status: 409 }
      );
    }

    // ------------------------------------------------------------
    // 6. Validate Razorpay server configuration
    // ------------------------------------------------------------
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Missing Razorpay server configuration.");

      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 7. Create Razorpay order
    // ------------------------------------------------------------
    const razorpayAuth = Buffer.from(
      `${razorpayKeyId}:${razorpayKeySecret}`
    ).toString("base64");

    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${razorpayAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `book_${book.id}_${Date.now()}`,
          notes: {
            book_id: book.id,
            user_id: user.id,
          },
        }),
        cache: "no-store",
      }
    );

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error(
        "Razorpay order creation failed:",
        razorpayData
      );

      return NextResponse.json(
        {
          error:
            razorpayData?.error?.description ||
            "Unable to create Razorpay order.",
        },
        { status: 502 }
      );
    }

    const razorpayOrderId = razorpayData?.id;

    if (!razorpayOrderId) {
      return NextResponse.json(
        { error: "Razorpay did not return an order ID." },
        { status: 502 }
      );
    }

    // ------------------------------------------------------------
    // 8. Save order in our database
    // ------------------------------------------------------------
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        razorpay_order_id: razorpayOrderId,
        status: "pending",
        amount: price,
        currency: "INR",
      })
      .select(
        "id,user_id,razorpay_order_id,status,amount,currency,created_at"
      )
      .single();

    if (orderError) {
      console.error(
        "Create Razorpay order - database order insert:",
        orderError
      );

      return NextResponse.json(
        { error: "Unable to save the payment order." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 9. Save purchased book against the order
    // ------------------------------------------------------------
    const { data: orderItem, error: itemError } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        book_id: book.id,
        price,
      })
      .select("id,order_id,book_id,price,created_at")
      .single();

    if (itemError) {
      console.error(
        "Create Razorpay order - order item insert:",
        itemError
      );

      // Remove the local order if its item could not be created.
      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      return NextResponse.json(
        { error: "Unable to create the purchase item." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 10. Return checkout information
    // ------------------------------------------------------------
    return NextResponse.json({
      ok: true,

      order: {
        id: order.id,
        razorpayOrderId: razorpayOrderId,
        amount: amountInPaise,
        currency: "INR",
        status: order.status,
      },

      book: {
        id: book.id,
        title: book.title,
        price,
      },

      orderItem: {
        id: orderItem.id,
        orderId: orderItem.order_id,
        bookId: orderItem.book_id,
        price: orderItem.price,
      },

      razorpay: {
        keyId: razorpayKeyId,
        orderId: razorpayOrderId,
        amount: amountInPaise,
        currency: "INR",
      },
    });
  } catch (error) {
    console.error("Create Razorpay order API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create payment order.",
      },
      { status: 500 }
    );
  }
}
