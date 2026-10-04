import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Webhook signatures must be calculated from the
    // exact raw request body.
    const rawBody = await request.text();

    const signature =
      request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Razorpay signature." },
        { status: 400 }
      );
    }

    const validSignature =
      verifyWebhookSignature(rawBody, signature);

    if (!validSignature) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);

    const event = payload?.event;

    const paymentEntity =
      payload?.payload?.payment?.entity;

    const orderEntity =
      payload?.payload?.order?.entity;

    /*
     * Razorpay normally sends the payment/order
     * information inside payload.
     *
     * We support the main successful-payment event
     * and safely acknowledge other verified events.
     */
    if (
      event === "payment.captured" ||
      event === "order.paid"
    ) {
      const razorpayOrderId =
        paymentEntity?.order_id ??
        orderEntity?.id;

      const razorpayPaymentId =
        paymentEntity?.id ?? null;

      if (!razorpayOrderId) {
        console.error(
          "Razorpay webhook did not contain an order ID."
        );

        return NextResponse.json(
          {
            error:
              "Razorpay order ID missing.",
          },
          { status: 400 }
        );
      }

      const admin =
        createAdminClient();

      let { data: order, error: findError } = await admin
        .from("orders")
        .select(
          "id,user_id,status,razorpay_order_id,razorpay_payment_id"
        )
        .eq("razorpay_order_id", razorpayOrderId)
        .maybeSingle();

      // The local order ID is used as Razorpay's receipt. This
      // fallback lets a verified webhook recover if the local
      // razorpay_order_id write was interrupted after payment setup.
      if (!order && !findError && typeof orderEntity?.receipt === "string") {
        const fallback = await admin
          .from("orders")
          .select(
            "id,user_id,status,razorpay_order_id,razorpay_payment_id"
          )
          .eq("id", orderEntity.receipt)
          .maybeSingle();

        order = fallback.data;
        findError = fallback.error;
      }

      if (findError) {
        console.error(
          "Webhook order lookup error:",
          findError
        );

        return NextResponse.json(
          {
            error:
              "Unable to look up order.",
          },
          { status: 500 }
        );
      }

      /*
       * The webhook can arrive before the local
       * order has been found/created in some unusual
       * retry or configuration scenarios.
       *
       * Return 200 for a verified webhook so Razorpay
       * does not repeatedly retry an event that this
       * application cannot associate with an order.
       */
      if (!order) {
        console.warn(
          "Verified Razorpay webhook received for unknown order:",
          razorpayOrderId
        );

        return NextResponse.json({
          received: true,
          matched: false,
        });
      }

      /*
       * Idempotency:
       * If the order is already paid, do not perform
       * another update.
       */
      if (order.status === "paid") {
        return NextResponse.json({
          received: true,
          alreadyProcessed: true,
          orderId: order.id,
        });
      }

      const {
        data: updatedOrder,
        error: updateError,
      } = await admin
        .from("orders")
        .update({
          status: "paid",
          razorpay_payment_id:
            razorpayPaymentId ??
            order.razorpay_payment_id,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", order.id)
        .select(
          "id,status,razorpay_order_id,razorpay_payment_id"
        )
        .single();

      if (updateError) {
        console.error(
          "Webhook order update error:",
          updateError
        );

        return NextResponse.json(
          {
            error:
              "Unable to update order.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        received: true,
        updated: true,
        order: updatedOrder,
      });
    }

    /*
     * Other verified Razorpay events are acknowledged
     * without changing the order.
     */
    return NextResponse.json({
      received: true,
      processed: false,
      event: event ?? null,
    });
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
