import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    const signature =
      request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature." },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error(
        "Missing RAZORPAY_WEBHOOK_SECRET."
      );
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
      )
    ) {
      return NextResponse.json(
        { error: "Invalid signature." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);

    const admin = createAdminClient();

    if (
      event.event === "payment.captured" ||
      event.event === "order.paid"
    ) {
      const payment =
        event.payload?.payment?.entity;

      const order =
        event.payload?.order?.entity;

      const razorpayOrderId =
        payment?.order_id ?? order?.id;

      const razorpayPaymentId =
        payment?.id;

      if (razorpayOrderId) {
        const update: Record<string, unknown> = {
          payment_status: "paid",
        };

        if (razorpayPaymentId) {
          update.razorpay_payment_id =
            razorpayPaymentId;
        }

        await admin
          .from("orders")
          .update(update)
          .eq(
            "razorpay_order_id",
            razorpayOrderId
          );
      }
    }

    if (event.event === "payment.failed") {
      const payment =
        event.payload?.payment?.entity;

      const razorpayOrderId =
        payment?.order_id;

      if (razorpayOrderId) {
        await admin
          .from("orders")
          .update({
            payment_status: "failed",
          })
          .eq(
            "razorpay_order_id",
            razorpayOrderId
          );
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("razorpay webhook error", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
