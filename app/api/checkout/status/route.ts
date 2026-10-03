import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
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

    const url =
      new URL(request.url);

    const orderId =
      url.searchParams.get(
        "orderId"
      );

    const razorpayOrderId =
      url.searchParams.get(
        "razorpayOrderId"
      );

    if (
      !orderId &&
      !razorpayOrderId
    ) {
      return NextResponse.json(
        {
          error:
            "orderId or razorpayOrderId is required.",
        },
        {
          status: 400,
        }
      );
    }

    let query = supabase
      .from("orders")
      .select(
        `
          id,
          user_id,
          razorpay_order_id,
          razorpay_payment_id,
          status,
          amount,
          currency,
          created_at,
          updated_at
        `
      )
      .eq(
        "user_id",
        user.id
      );

    if (orderId) {
      query = query.eq(
        "id",
        orderId
      );
    } else {
      query = query.eq(
        "razorpay_order_id",
        razorpayOrderId
      );
    }

    const {
      data: order,
      error,
    } = await query.maybeSingle();

    if (error) {
      console.error(
        "Checkout status lookup error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to check order status.",
        },
        {
          status: 500,
        }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          found: false,
          status: null,
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      found: true,
      order: {
        id: order.id,
        status: order.status,
        amount: Number(
          order.amount
        ),
        currency:
          order.currency,
        razorpayOrderId:
          order.razorpay_order_id,
        razorpayPaymentId:
          order.razorpay_payment_id,
        createdAt:
          order.created_at,
        updatedAt:
          order.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "Checkout status error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to check checkout status.",
      },
      {
        status: 500,
      }
    );
  }
}
