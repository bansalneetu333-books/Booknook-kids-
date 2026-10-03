import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This payment webhook endpoint has been retired.",
      use:
        "/api/webhooks/razorpay",
    },
    {
      status: 410,
    }
  );
}
