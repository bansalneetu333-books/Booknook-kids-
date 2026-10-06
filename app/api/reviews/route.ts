import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const bookId = new URL(request.url).searchParams.get("bookId");
  if (!bookId) return NextResponse.json({ error: "bookId is required." }, { status: 400 });
  const { data, error } = await supabase.from("book_reviews").select("id,book_id,user_id,rating,review,created_at").eq("book_id", bookId).eq("approved", true).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load reviews." }, { status: 500 });
  const reviews = data ?? [];
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return NextResponse.json({ reviews, average, count: reviews.length });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in to review this book." }, { status: 401 });
  const body = await request.json();
  const bookId = typeof body.bookId === "string" ? body.bookId : "";
  const rating = Number(body.rating);
  const review = typeof body.review === "string" ? body.review.trim().slice(0, 2000) : "";
  if (!bookId || !Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Choose a rating from 1 to 5." }, { status: 400 });

  const { data: purchase } = await supabase.from("order_items").select("id, orders!inner(user_id,payment_status,status)").eq("book_id", bookId).eq("orders.user_id", user.id).or("payment_status.eq.paid,status.eq.paid").limit(1).maybeSingle();
  if (!purchase) return NextResponse.json({ error: "Only customers who purchased this book can review it." }, { status: 403 });

  const { data, error } = await supabase.from("book_reviews").upsert({ book_id: bookId, user_id: user.id, rating, review, approved: true }, { onConflict: "book_id,user_id" }).select().single();
  if (error) return NextResponse.json({ error: "Unable to save your review." }, { status: 500 });
  return NextResponse.json({ review: data });
}
