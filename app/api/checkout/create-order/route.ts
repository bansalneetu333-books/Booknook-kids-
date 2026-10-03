import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const bookId = body?.bookId;

    if (
      typeof bookId !== "string" ||
      !bookId.trim()
    ) {
      return NextResponse.json(
        { error: "bookId is required." },
        { status: 400 }
      );
    }

    const { data: book, error: bookError } =
      await supabase
        .from("books")
        .select(
          `
            id,
            title,
            slug,
            author,
            price,
            currency,
            published,
            is_published
          `
        )
        .eq("id", bookId)
        .maybeSingle();

    if (bookError) {
      console.error(
        "Book lookup error:",
        bookError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the book.",
        },
        { status: 500 }
      );
    }

    if (!book) {
      return NextResponse.json(
        { error: "Book not found." },
        { status: 404 }
      );
    }

    /*
     * Some existing rows use `published`,
     * while older rows may use `is_published`.
     *
     * A book is available for purchase when
     * either field indicates it is published.
     */
    const isPublished =
      book.published === true ||
      book.is_published === true;

    if (!isPublished) {
      return NextResponse.json(
        {
          error:
            "This book is not currently available for purchase.",
        },
        { status: 400 }
      );
    }

    const price = Number(book.price);

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "This book has an invalid price.",
        },
        { status: 400 }
      );
    }

    const amountInPaise =
      Math.round(price * 100);

    /*
     * Prevent buying the same book twice.
     */
    const { data: existingPurchase, error: purchaseError } =
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
        .eq("book_id", book.id)
        .eq(
          "orders.user_id",
          user.id
        )
        .eq(
          "orders.status",
          "paid"
        )
        .limit(1)
        .maybeSingle();

    if (purchaseError) {
      console.error(
        "Purchase check error:",
        purchaseError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check previous purchases.",
        },
        { status: 500 }
      );
    }

    if (existingPurchase) {
      return NextResponse.json(
        {
          error:
            "You already own this book.",
          alreadyPurchased: true,
        },
        { status: 409 }
      );
    }

    /*
     * Create our local pending order first.
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
          "id,user_id,status,amount,currency,created_at"
        )
        .single();

    if (orderError || !localOrder) {
      console.error(
        "Local order creation error:",
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
     * Add the book to the local order.
     */
    const { error: itemError } =
      await supabase
        .from("order_items")
        .insert({
          order_id: localOrder.id,
          book_id: book.id,
          price,
        });

    if (itemError) {
      console.error(
        "Order item creation error:",
        itemError
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
            "Unable to create the order item.",
        },
        { status: 500 }
      );
    }

    let razorpayOrder;

    try {
      razorpayOrder =
        await createRazorpayOrder({
          amount: amountInPaise,
          currency:
            book.currency || "INR",
          receipt: localOrder.id,
          notes: {
            order_id: localOrder.id,
            book_id: book.id,
            user_id: user.id,
          },
        });
    } catch (error) {
      console.error(
        "Razorpay order creation error:",
        error
      );

      await supabase
        .from("order_items")
        .delete()
        .eq(
          "order_id",
          localOrder.id
        );

      await supabase
        .from("orders")
        .delete()
        .eq(
          "id",
          localOrder.id
        );

      throw error;
    }

    /*
     * Store Razorpay's order ID against our local order.
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
        "id,user_id,status,amount,currency,razorpay_order_id,created_at"
      )
      .single();

    if (updateError || !updatedOrder) {
      console.error(
        "Local order update error:",
        updateError
      );

      /*
       * The Razorpay order already exists, so we
       * don't attempt to create another one.
       */
      return NextResponse.json(
        {
          error:
            "Razorpay order was created, but the local order could not be updated.",
        },
        { status: 500 }
      );
    }

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    if (!keyId) {
      console.error(
        "RAZORPAY_KEY_ID is missing."
      );

      return NextResponse.json(
        {
          error:
            "Razorpay configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    /*
     * KEY ID is public and required by the
     * Razorpay browser checkout.
     *
     * KEY SECRET and WEBHOOK SECRET are never
     * returned to the browser.
     */
    return NextResponse.json({
      success: true,

      keyId,

      order: {
        id: updatedOrder.id,
        status:
          updatedOrder.status,
        amount:
          Number(updatedOrder.amount),
        currency:
          updatedOrder.currency,
        razorpayOrderId:
          updatedOrder.razorpay_order_id,
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
        slug: book.slug,
        author: book.author,
        price,
        currency:
          book.currency || "INR",
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
            : "Unable to create checkout order.",
      },
      { status: 500 }
    );
  }
}
