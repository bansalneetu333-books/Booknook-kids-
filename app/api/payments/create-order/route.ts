import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpay } from "@/lib/razorpay";

const schema = z.object({
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

    const admin = createAdminClient();

    const { data: book, error: bookError } = await admin
      .from("books")
      .select("id,title,price,published")
      .eq("id", body.bookId)
      .eq("published", true)
      .maybeSingle();

    if (bookError || !book) {
      return NextResponse.json(
        { error: "Book not found." },
        { status: 404 }
      );
    }

    const amount = Math.round(Number(book.price) * 100);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid book price." },
        { status: 400 }
      );
    }

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `book_${book.id}_${Date.now()}`,
      notes: {
        bookId: book.id,
        userId: user.id,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      bookId: book.id,
      title: book.title,
    });
  } catch (error) {
    console.error("create razorpay order error", error);

    return NextResponse.json(
      { error: "Unable to create payment order." },
      { status: 500 }
    );
  }
}
