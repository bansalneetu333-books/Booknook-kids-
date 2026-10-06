import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const [
      dailyResult,
      monthlyResult,
      bookResult,
      eventResult,
    ] = await Promise.all([
      supabase.from("admin_daily_sales").select("*").limit(90),
      supabase.from("admin_monthly_sales").select("*").limit(24),
      supabase.from("admin_book_sales").select("*").limit(50),
      supabase
        .from("analytics_events")
        .select("event_type,book_id,created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

    const firstError =
      dailyResult.error ||
      monthlyResult.error ||
      bookResult.error ||
      eventResult.error;

    if (firstError) {
      console.error("Admin analytics lookup error:", firstError);
      return NextResponse.json(
        { error: firstError.message || "Unable to load analytics." },
        { status: 500 }
      );
    }

    const events = eventResult.data ?? [];
    const eventCounts = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      dailySales: dailyResult.data ?? [],
      monthlySales: monthlyResult.data ?? [],
      bookSales: bookResult.data ?? [],
      eventCounts,
      analyticsEventsSampled: events.length,
    });
  } catch (error) {
    console.error("Admin analytics API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load analytics.",
      },
      { status: 500 }
    );
  }
}
