import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This payment endpoint has been replaced. Use /api/checkout/create-order.",
    },
    { status: 410 }
  );
}
