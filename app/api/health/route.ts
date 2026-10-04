import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]?.trim());

  return NextResponse.json(
    {
      ok: missing.length === 0,
      service: "booknook-kids",
      checks: { environment: missing.length === 0 },
      ...(missing.length ? { missing } : {}),
    },
    { status: missing.length ? 503 : 200 }
  );
}
