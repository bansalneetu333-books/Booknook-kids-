import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const requestedIds = Array.isArray(body?.bookIds) ? body.bookIds : typeof body?.bookId === "string" ? [body.bookId] : [];
    const bookIds = [...new Set(
      requestedIds
        .filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0)
        .map((id: string) => id.trim())
    )];

    if (bookIds.length === 0) return NextResponse.json({ error: "At least one book is required." }, { status: 400 });
    if (bookIds.length > 50) return NextResponse.json({ error: "Cart is too large. Please check out in smaller groups." }, { status: 400 });

    const { data: books, error: bookError } = await supabase.from("books")
      .select("id,title,slug,author,price,currency,published,is_published,is_free").in("id", bookIds);
    if (bookError) return NextResponse.json({ error: "Unable to load the selected books." }, { status: 500 });
    if (!books || books.length !== bookIds.length) return NextResponse.json({ error: "One or more selected books could not be found." }, { status: 404 });

    const unavailable = books.filter(book => !(book.published === true || book.is_published === true) || book.is_free === true || Number(book.price) <= 0);
    if (unavailable.length) return NextResponse.json({ error: "One or more selected books are not currently available for purchase." }, { status: 400 });

    const { data: existingPurchases, error: purchaseLookupError } = await supabase.from("order_items")
      .select("book_id, orders!inner(user_id,status)").in("book_id", bookIds)
      .eq("orders.user_id", user.id).eq("orders.status", "paid");
    if (purchaseLookupError) return NextResponse.json({ error: "Unable to check previous purchases." }, { status: 500 });

    const ownedIds = new Set((existingPurchases ?? []).map(item => item.book_id));
    const booksToBuy = books.filter(book => !ownedIds.has(book.id));
    if (!booksToBuy.length) return NextResponse.json({ error: "You already own all selected books.", alreadyPurchased: true }, { status: 409 });

    const currencies = new Set(booksToBuy.map(book => (book.currency || "INR").toUpperCase()));
    if (currencies.size !== 1 || !currencies.has("INR")) return NextResponse.json({ error: "Only INR payments are supported." }, { status: 400 });

    const totalPrice = booksToBuy.reduce((sum, book) => sum + Number(book.price), 0);
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) return NextResponse.json({ error: "Invalid order total." }, { status: 400 });

    const amountInPaise = Math.round(totalPrice * 100);
    if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 100) return NextResponse.json({ error: "Order amount must be at least ₹1." }, { status: 400 });

    const { data: localOrder, error: orderError } = await supabase.from("orders").insert({
      user_id: user.id, status: "pending", amount: totalPrice, currency: "INR",
    }).select("id,user_id,status,amount,currency,created_at").single();
    if (orderError || !localOrder) return NextResponse.json({ error: "Unable to create your order." }, { status: 500 });

    const { error: itemError } = await supabase.from("order_items").insert(
      booksToBuy.map(book => ({ order_id: localOrder.id, book_id: book.id, price: Number(book.price) }))
    );
    if (itemError) {
      await supabase.from("orders").delete().eq("id", localOrder.id);
      return NextResponse.json({ error: "Unable to create the order items." }, { status: 500 });
    }

    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amount: amountInPaise, currency: "INR", receipt: localOrder.id,
        notes: { order_id: localOrder.id, book_ids: booksToBuy.map(book => book.id).join(","), user_id: user.id },
      });
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      await supabase.from("order_items").delete().eq("order_id", localOrder.id);
      await supabase.from("orders").delete().eq("id", localOrder.id);
      throw error;
    }

    const { data: updatedOrder, error: updateError } = await supabase.from("orders").update({
      razorpay_order_id: razorpayOrder.id, updated_at: new Date().toISOString(),
    }).eq("id", localOrder.id).select("id,user_id,status,amount,currency,razorpay_order_id,created_at").single();

    if (updateError || !updatedOrder) {
      console.error("Local order update error:", updateError);
      return NextResponse.json({ error: "Razorpay order was created, but the local order could not be updated. Please do not retry immediately; support may need to reconcile this payment." }, { status: 500 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    if (!keyId) return NextResponse.json({ error: "Razorpay configuration is incomplete." }, { status: 500 });

    return NextResponse.json({
      success: true, keyId,
      order: { id: updatedOrder.id, status: updatedOrder.status, amount: Number(updatedOrder.amount), currency: updatedOrder.currency, razorpayOrderId: updatedOrder.razorpay_order_id },
      razorpay: { orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency },
      books: booksToBuy.map(book => ({ id: book.id, title: book.title, slug: book.slug, author: book.author, price: Number(book.price), currency: "INR" })),
    });
  } catch (error) {
    console.error("Create checkout order error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create checkout order." }, { status: 500 });
  }
}
