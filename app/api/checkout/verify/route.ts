import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  verifyPaymentSignature,
} from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      typeof razorpay_order_id !==
        "string" ||
      typeof razorpay_payment_id !==
        "string" ||
      typeof razorpay_signature !==
        "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Missing Razorpay payment details.",
        },
        {
          status: 400,
        }
      );
    }

    const isValid =
      verifyPaymentSignature({
        orderId:
          razorpay_order_id,
        paymentId:
          razorpay_payment_id,
        signature:
          razorpay_signature,
      });

    if (!isValid) {
      return NextResponse.json(
        {
          error:
            "Invalid payment signature.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .select(
        "id,user_id,status,amount,currency,razorpay_order_id"
      )
      .eq(
        "razorpay_order_id",
        razorpay_order_id
      )
      .maybeSingle();

    if (orderError) {
      console.error(
        "Order lookup error:",
        orderError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find the order.",
        },
        {
          status: 500,
        }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      order.user_id !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to verify this order.",
        },
        {
          status: 403,
        }
      );
    }

    if (order.status === "paid") {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        orderId: order.id,
      });
    }

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabase
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id:
          razorpay_payment_id,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq(
        "user_id",
        user.id
      )
      .select(
        "id,status,amount,currency,razorpay_order_id,razorpay_payment_id"
      )
      .single();

    if (updateError) {
      console.error(
        "Order update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Payment was verified, but the order could not be updated.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
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
      {
        status: 500,
      }
    );
  }
}
