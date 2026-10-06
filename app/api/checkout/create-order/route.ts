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
    const requestedIds = Array.isArray(body?.bookIds)
      ? body.bookIds
      : typeof body?.bookId === "string"
      ? [body.bookId]
      : [];

    const bookIds = Array.from(
      new Set(
        requestedIds.filter(
          (id: unknown): id is string =>
            typeof id === "string" && id.trim().length > 0
        )
      )
    );

    if (bookIds.length === 0) {
      return NextResponse.json(
        { error: "At least one book is required." },
        { status: 400 }
      );
    }

    const { data: books, error: bookError } =
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
        .in("id", bookIds);

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

    if (!books || books.length !== bookIds.length) {
      return NextResponse.json(
        { error: "One or more selected books could not be found." },
        { status: 404 }
      );
    }

    const unavailable = books.filter(
      (book) => !(book.published === true || book.is_published === true) || Number(book.price) <= 0
    );

    if (unavailable.length > 0) {
      return NextResponse.json(
        { error: "One or more selected books are not currently available for purchase." },
        { status: 400 }
      );
    }

    const { data: existingPurchases, error: purchaseLookupError } =
      await supabase
        .from("order_items")
        .select(`book_id, orders!inner(user_id,status)`)
        .in("book_id", bookIds)
        .eq("orders.user_id", user.id)
        .eq("orders.payment_status", "paid");

    if (purchaseLookupError) {
      return NextResponse.json({ error: "Unable to check previous purchases." }, { status: 500 });
    }

    const ownedIds = new Set((existingPurchases ?? []).map((item) => item.book_id));
    const booksToBuy = books.filter((book) => !ownedIds.has(book.id));

    if (booksToBuy.length === 0) {
      return NextResponse.json(
        { error: "You already own all selected books.", alreadyPurchased: true },
        { status: 409 }
      );
    }

    const totalPrice = booksToBuy.reduce((sum, book) => sum + Number(book.price), 0);
    const firstBook = booksToBuy[0];

    const price = totalPrice;

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
     * Create our local pending order first.
     */
    const { data: localOrder, error: orderError } =
      await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          payment_status: "pending",
          total_amount: Math.round(price),
          currency:
            firstBook.currency || "INR",
        })
        .select(
          "id,user_id,payment_status,total_amount,currency,created_at"
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
        .insert(
          booksToBuy.map((book) => ({
            order_id: localOrder.id,
            book_id: book.id,
            price: Number(book.price),
          }))
        );

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
            firstBook.currency || "INR",
          receipt: localOrder.id,
          notes: {
            order_id: localOrder.id,
            book_ids: booksToBuy.map((book) => book.id).join(","),
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
        "id,user_id,payment_status,total_amount,currency,razorpay_order_id,created_at"
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
          updatedOrder.payment_status,
        amount:
          Number(updatedOrder.total_amount),
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

      books: booksToBuy.map((book) => ({
        id: book.id,
        title: book.title,
        slug: book.slug,
        author: book.author,
        price: Number(book.price),
        currency: book.currency || "INR",
      })),
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
