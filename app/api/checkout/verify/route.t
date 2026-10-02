import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type VerifyPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

function createSignature(orderId: string, paymentId: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    // ------------------------------------------------------------
    // 1. Require logged-in customer
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    // 2. Read Razorpay response
    // ------------------------------------------------------------
    const body = (await request.json()) as VerifyPayload;

    const razorpayOrderId =
      typeof body.razorpay_order_id === "string"
        ? body.razorpay_order_id.trim()
        : "";

    const razorpayPaymentId =
      typeof body.razorpay_payment_id === "string"
        ? body.razorpay_payment_id.trim()
        : "";

    const razorpaySignature =
      typeof body.razorpay_signature === "string"
        ? body.razorpay_signature.trim()
        : "";

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        { error: "Incomplete Razorpay payment information." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 3. Validate server configuration
    // ------------------------------------------------------------
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      console.error("Missing RAZORPAY_KEY_SECRET.");

      return NextResponse.json(
        { error: "Payment verification is not configured." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 4. Find the order belonging to this logged-in user
    // ------------------------------------------------------------
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id,user_id,razorpay_order_id,razorpay_payment_id,status,amount,currency"
      )
      .eq("razorpay_order_id", razorpayOrderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Razorpay verification order lookup error:",
        orderError
      );

      return NextResponse.json(
        { error: "Unable to find the payment order." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Payment order not found." },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // 5. Make verification idempotent
    // ------------------------------------------------------------
    if (order.status === "paid") {
      return NextResponse.json({
        ok: true,
        alreadyPaid: true,
        order: {
          id: order.id,
          razorpayOrderId: order.razorpay_order_id,
          razorpayPaymentId:
            order.razorpay_payment_id || razorpayPaymentId,
          status: "paid",
        },
      });
    }

    // ------------------------------------------------------------
    // 6. Verify Razorpay signature
    // ------------------------------------------------------------
    const expectedSignature = createSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySecret
    );

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpaySignature, "utf8");

    const signaturesMatch =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!signaturesMatch) {
      console.warn(
        "Invalid Razorpay signature for order:",
        razorpayOrderId
      );

      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 7. Update order as paid
    // ------------------------------------------------------------
    const { data: paidOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        razorpay_payment_id: razorpayPaymentId,
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("user_id", user.id)
      .neq("status", "paid")
      .select(
        "id,user_id,razorpay_order_id,razorpay_payment_id,status,amount,currency,updated_at"
      )
      .maybeSingle();

    if (updateError) {
      console.error(
        "Razorpay verification order update error:",
        updateError
      );

      return NextResponse.json(
        { error: "Payment was verified but the order could not be updated." },
        { status: 500 }
      );
    }

    if (!paidOrder) {
      // Another request may have completed the payment at the same time.
      const { data: currentOrder } = await supabase
        .from("orders")
        .select(
          "id,razorpay_order_id,razorpay_payment_id,status,amount,currency"
        )
        .eq("id", order.id)
        .maybeSingle();

      if (currentOrder?.status === "paid") {
        return NextResponse.json({
          ok: true,
          alreadyPaid: true,
          order: currentOrder,
        });
      }

      return NextResponse.json(
        { error: "Unable to confirm the payment order." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 8. Return successful verification
    // ------------------------------------------------------------
    return NextResponse.json({
      ok: true,
      verified: true,
      order: paidOrder,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    console.error("Razorpay verification API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify payment.",
      },
      { status: 500 }
    );
  }
}
