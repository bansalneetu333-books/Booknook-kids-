import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This payment endpoint has been replaced. Use /api/checkout/verify.",
    },
    { status: 410 }
  );
}
