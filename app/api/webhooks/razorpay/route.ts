import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing RAZORPAY_WEBHOOK_SECRET.");

      return NextResponse.json(
        { error: "Webhook is not configured." },
        { status: 500 }
      );
    }

    // IMPORTANT:
    // Read the raw request body before parsing JSON.
    // Razorpay signature verification requires the exact raw payload.
    const rawBody = await request.text();

    const signature = request.headers.get(
      "x-razorpay-signature"
    );

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Razorpay webhook signature." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 1. Verify Razorpay webhook signature
    // ------------------------------------------------------------
    const validSignature = verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret
    );

    if (!validSignature) {
      console.warn("Invalid Razorpay webhook signature.");

      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 2. Parse verified payload
    // ------------------------------------------------------------
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook payload." },
        { status: 400 }
      );
    }

    const event = payload?.event;

    if (!event) {
      return NextResponse.json(
        { error: "Webhook event is missing." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 3. Handle successful payment
    // ------------------------------------------------------------
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity =
        payload?.payload?.payment?.entity;

      const orderEntity =
        payload?.payload?.order?.entity;

      const razorpayPaymentId =
        typeof paymentEntity?.id === "string"
          ? paymentEntity.id
          : "";

      const razorpayOrderId =
        typeof paymentEntity?.order_id === "string"
          ? paymentEntity.order_id
          : typeof orderEntity?.id === "string"
            ? orderEntity.id
            : "";

      if (!razorpayOrderId) {
        console.warn(
          "Razorpay webhook does not contain an order ID."
        );

        return NextResponse.json({
          ok: true,
          ignored: true,
          reason: "Missing Razorpay order ID.",
        });
      }

      const supabase = createAdminClient();

      // Find our local order.
      const { data: order, error: orderError } =
        await supabase
          .from("orders")
          .select(
            "id,user_id,razorpay_order_id,razorpay_payment_id,status,amount,currency"
          )
          .eq("razorpay_order_id", razorpayOrderId)
          .maybeSingle();

      if (orderError) {
        console.error(
          "Razorpay webhook order lookup error:",
          orderError
        );

        return NextResponse.json(
          { error: "Unable to find local order." },
          { status: 500 }
        );
      }

      // The webhook may be received for an order created
      // outside this application.
      if (!order) {
        console.warn(
          "Razorpay order not found in BookNook:",
          razorpayOrderId
        );

        return NextResponse.json({
          ok: true,
          ignored: true,
          reason: "Order not found.",
        });
      }

      // ----------------------------------------------------------
      // 4. Idempotency
      // ----------------------------------------------------------
      if (order.status === "paid") {
        return NextResponse.json({
          ok: true,
          alreadyProcessed: true,
          orderId: order.id,
        });
      }

      // ----------------------------------------------------------
      // 5. Mark order as paid
      // ----------------------------------------------------------
      const updateData: {
        status: string;
        updated_at: string;
        razorpay_payment_id?: string;
      } = {
        status: "paid",
        updated_at: new Date().toISOString(),
      };

      if (razorpayPaymentId) {
        updateData.razorpay_payment_id =
          razorpayPaymentId;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order.id);

      if (updateError) {
        console.error(
          "Razorpay webhook order update error:",
          updateError
        );

        return NextResponse.json(
          { error: "Unable to update local order." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        processed: true,
        event,
        orderId: order.id,
      });
    }

    // ------------------------------------------------------------
    // 6. Handle failed payment
    // ------------------------------------------------------------
    if (event === "payment.failed") {
      const paymentEntity =
        payload?.payload?.payment?.entity;

      const razorpayOrderId =
        typeof paymentEntity?.order_id === "string"
          ? paymentEntity.order_id
          : "";

      if (!razorpayOrderId) {
        return NextResponse.json({
          ok: true,
          ignored: true,
          reason: "Missing Razorpay order ID.",
        });
      }

      const supabase = createAdminClient();

      const { data: order, error: orderError } =
        await supabase
          .from("orders")
          .select("id,status")
          .eq("razorpay_order_id", razorpayOrderId)
          .maybeSingle();

      if (orderError) {
        console.error(
          "Razorpay failed payment lookup error:",
          orderError
        );

        return NextResponse.json(
          { error: "Unable to find local order." },
          { status: 500 }
        );
      }

      if (!order) {
        return NextResponse.json({
          ok: true,
          ignored: true,
          reason: "Order not found.",
        });
      }

      // Never turn a successfully paid order back into failed.
      if (order.status === "paid") {
        return NextResponse.json({
          ok: true,
          alreadyPaid: true,
        });
      }

      const { error: failedUpdateError } = await supabase
        .from("orders")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .neq("status", "paid");

      if (failedUpdateError) {
        console.error(
          "Razorpay failed payment update error:",
          failedUpdateError
        );

        return NextResponse.json(
          { error: "Unable to update failed payment." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        processed: true,
        event,
        orderId: order.id,
      });
    }

    // ------------------------------------------------------------
    // 7. Other Razorpay events
    // ------------------------------------------------------------
    return NextResponse.json({
      ok: true,
      ignored: true,
      event,
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process Razorpay webhook.",
      },
      { status: 500 }
    );
  }
}
