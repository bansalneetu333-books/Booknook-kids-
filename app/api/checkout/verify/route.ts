import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in before completing payment." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const orderId = String(body?.orderId || "").trim();
    const razorpayOrderId = String(
      body?.razorpayOrderId || ""
    ).trim();
    const razorpayPaymentId = String(
      body?.razorpayPaymentId || ""
    ).trim();
    const razorpaySignature = String(
      body?.razorpaySignature || ""
    ).trim();

    if (
      !orderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        { error: "Incomplete payment information." },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .select(
          "id,user_id,razorpay_order_id,status,amount,currency"
        )
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Order lookup error:",
        orderError
      );

      return NextResponse.json(
        { error: "Unable to verify the order." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (
      order.razorpay_order_id !==
      razorpayOrderId
    ) {
      return NextResponse.json(
        { error: "Order verification failed." },
        { status: 400 }
      );
    }

    if (order.status === "paid") {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        orderId: order.id,
      });
    }

    const validSignature =
      verifyRazorpayPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

    if (!validSignature) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    const { error: updateError } =
      await supabase
        .from("orders")
        .update({
          status: "paid",
          razorpay_payment_id:
            razorpayPaymentId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("user_id", user.id);

    if (updateError) {
      console.error(
        "Order payment update error:",
        updateError
      );

      return NextResponse.json(
        { error: "Unable to complete your order." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: "paid",
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}
