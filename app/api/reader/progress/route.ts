import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  bookId: z.string().uuid(),
  location: z.string().max(10000).nullable(),
  progressPercentage: z.number().min(0).max(100)
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const supabase = await createClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: ownership } = await supabase
      .from("order_items")
      .select("id,orders!inner(user_id,payment_status)")
      .eq("book_id", body.bookId)
      .eq("orders.user_id", user.id)
      .eq("orders.payment_status", "paid")
      .limit(1)
      .maybeSingle();

    if (!ownership) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("reading_progress")
      .upsert(
        {
          user_id: user.id,
          book_id: body.bookId,
          location: body.location,
          progress_percentage: body.progressPercentage,
          last_read_at: new Date().toISOString()
        },
        {
          onConflict: "user_id,book_id"
        }
      );

    if (error) {
      console.error("progress save error", error);

      return NextResponse.json(
        { error: "Progress could not be saved." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error("progress route error", error);

    return NextResponse.json(
      { error: "Progress could not be saved." },
      { status: 400 }
    );
  }
}
