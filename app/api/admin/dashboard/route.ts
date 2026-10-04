import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // 1. Books
    // ------------------------------------------------------------
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("id,published,featured");

    if (booksError) {
      console.error(
        "Dashboard books lookup error:",
        booksError
      );

      return NextResponse.json(
        { error: booksError.message },
        { status: 500 }
      );
    }

    const totalBooks = books?.length ?? 0;

    const publishedBooks =
      books?.filter((book) => book.published === true).length ?? 0;

    const featuredBooks =
      books?.filter((book) => book.featured === true).length ?? 0;

    // ------------------------------------------------------------
    // 2. Customer profiles
    // ------------------------------------------------------------
    const { data: profiles, error: profilesError } =
      await supabase
        .from("profiles")
        .select("id,email");

    if (profilesError) {
      console.error(
        "Dashboard profiles lookup error:",
        profilesError
      );

      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const totalCustomers =
      profiles?.filter(
        (profile) =>
          profile.email?.trim().toLowerCase() !==
          "bansalneetu333@gmail.com"
      ).length ?? 0;

    // ------------------------------------------------------------
    // 3. Orders
    // ------------------------------------------------------------
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id,user_id,status,amount,currency,created_at");

    if (ordersError) {
      console.error(
        "Dashboard orders lookup error:",
        ordersError
      );

      return NextResponse.json(
        { error: ordersError.message },
        { status: 500 }
      );
    }

    const totalOrders = orders?.length ?? 0;

    const paidOrders =
      orders?.filter((order) => order.status === "paid").length ?? 0;

    const pendingOrders =
      orders?.filter((order) => order.status === "pending").length ??
      0;

    const failedOrders =
      orders?.filter((order) => order.status === "failed").length ?? 0;

    const totalRevenue =
      orders
        ?.filter((order) => order.status === "paid")
        .reduce(
          (total, order) => total + (Number(order.amount) || 0),
          0
        ) ?? 0;

    // ------------------------------------------------------------
    // 4. Recent orders
    // ------------------------------------------------------------
    const recentOrders = [...(orders ?? [])]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(0, 10)
      .map((order) => ({
        id: order.id,
        userId: order.user_id,
        status: order.status,
        amount: Number(order.amount) || 0,
        currency: order.currency,
        createdAt: order.created_at,
      }));

    // ------------------------------------------------------------
    // 5. Return dashboard statistics
    // ------------------------------------------------------------
    return NextResponse.json({
      ok: true,

      totalBooks,
      publishedBooks,
      featuredBooks,
      totalCustomers,
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      revenue: totalRevenue,

      stats: {
        books: {
          total: totalBooks,
          published: publishedBooks,
          featured: featuredBooks,
        },

        customers: {
          total: totalCustomers,
        },

        orders: {
          total: totalOrders,
          paid: paidOrders,
          pending: pendingOrders,
          failed: failedOrders,
        },

        revenue: {
          total: totalRevenue,
          currency: "INR",
        },
      },

      recentOrders,
    });
  } catch (error) {
    console.error(
      "Admin dashboard statistics API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load dashboard statistics.",
      },
      { status: 500 }
    );
  }
}
