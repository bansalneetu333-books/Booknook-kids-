import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  bookId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please login first." },
        { status: 401 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error("Missing Razorpay secret.");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(
        `${body.razorpay_order_id}|${body.razorpay_payment_id}`
      )
      .digest("hex");

    const valid =
      expectedSignature === body.razorpay_signature;

    if (!valid) {
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: book } = await admin
      .from("books")
      .select("id,title,price")
      .eq("id", body.bookId)
      .maybeSingle();

    if (!book) {
      return NextResponse.json(
        { error: "Book not found." },
        { status: 404 }
      );
    }

    const { data: existingOrder } = await admin
      .from("orders")
      .select("id,payment_status")
      .eq("razorpay_order_id", body.razorpay_order_id)
      .maybeSingle();

    if (existingOrder?.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        orderId: existingOrder.id,
      });
    }

    let orderId = existingOrder?.id;

    if (!orderId) {
      const { data: order, error: orderError } = await admin
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: book.price,
          currency: "INR",
          payment_status: "paid",
          razorpay_order_id: body.razorpay_order_id,
          razorpay_payment_id: body.razorpay_payment_id,
        })
        .select("id")
        .single();

      if (orderError || !order) {
        console.error(orderError);

        return NextResponse.json(
          { error: "Unable to create purchase record." },
          { status: 500 }
        );
      }

      orderId = order.id;
    } else {
      const { error } = await admin
        .from("orders")
        .update({
          payment_status: "paid",
          razorpay_payment_id:
            body.razorpay_payment_id,
        })
        .eq("id", orderId);

      if (error) {
        throw error;
      }
    }

    const { error: itemError } = await admin
      .from("order_items")
      .upsert(
        {
          order_id: orderId,
          book_id: book.id,
          quantity: 1,
          unit_price: book.price,
        },
        {
          onConflict: "order_id,book_id",
        }
      );

    if (itemError) {
      console.error(itemError);

      return NextResponse.json(
        { error: "Unable to save purchased book." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      bookId: book.id,
    });
  } catch (error) {
    console.error("payment verification error", error);

    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
