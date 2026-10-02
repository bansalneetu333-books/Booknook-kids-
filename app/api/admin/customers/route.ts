import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";

    // ------------------------------------------------------------
    // 1. Load profiles
    // ------------------------------------------------------------
    let profileQuery = supabase
      .from("profiles")
      .select("id,full_name,email,role")
      .order("full_name", { ascending: true });

    if (search) {
      const escapedSearch = search
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")
        .replace(/,/g, "");

      profileQuery = profileQuery.or(
        `full_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`
      );
    }

    const { data: profiles, error: profilesError } =
      await profileQuery;

    if (profilesError) {
      console.error(
        "Admin customers profile lookup error:",
        profilesError
      );

      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const customerProfiles = (profiles ?? []).filter(
      (profile) => profile.role !== "admin"
    );

    const userIds = customerProfiles.map((profile) => profile.id);

    // ------------------------------------------------------------
    // 2. Load orders for these customers
    // ------------------------------------------------------------
    let orders: Array<{
      id: string;
      user_id: string | null;
      status: string;
      amount: number | string;
      currency: string;
      created_at: string;
    }> = [];

    if (userIds.length > 0) {
      const { data: orderData, error: ordersError } =
        await supabase
          .from("orders")
          .select(
            "id,user_id,status,amount,currency,created_at"
          )
          .in("user_id", userIds)
          .order("created_at", { ascending: false });

      if (ordersError) {
        console.error(
          "Admin customers orders lookup error:",
          ordersError
        );

        return NextResponse.json(
          { error: ordersError.message },
          { status: 500 }
        );
      }

      orders = (orderData ?? []) as typeof orders;
    }

    // ------------------------------------------------------------
    // 3. Build customer purchase summaries
    // ------------------------------------------------------------
    const orderSummaryByUser = new Map<
      string,
      {
        totalOrders: number;
        paidOrders: number;
        pendingOrders: number;
        failedOrders: number;
        totalSpent: number;
        lastOrderAt: string | null;
      }
    >();

    for (const order of orders) {
      if (!order.user_id) {
        continue;
      }

      const existing = orderSummaryByUser.get(order.user_id) ?? {
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        failedOrders: 0,
        totalSpent: 0,
        lastOrderAt: null,
      };

      existing.totalOrders += 1;

      if (order.status === "paid") {
        existing.paidOrders += 1;
        existing.totalSpent += Number(order.amount) || 0;
      }

      if (order.status === "pending") {
        existing.pendingOrders += 1;
      }

      if (order.status === "failed") {
        existing.failedOrders += 1;
      }

      if (
        !existing.lastOrderAt ||
        new Date(order.created_at).getTime() >
          new Date(existing.lastOrderAt).getTime()
      ) {
        existing.lastOrderAt = order.created_at;
      }

      orderSummaryByUser.set(order.user_id, existing);
    }

    // ------------------------------------------------------------
    // 4. Format customer response
    // ------------------------------------------------------------
    const customers = customerProfiles.map((profile) => {
      const summary = orderSummaryByUser.get(profile.id) ?? {
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        failedOrders: 0,
        totalSpent: 0,
        lastOrderAt: null,
      };

      return {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        role: profile.role,

        orders: {
          total: summary.totalOrders,
          paid: summary.paidOrders,
          pending: summary.pendingOrders,
          failed: summary.failedOrders,
        },

        totalSpent: summary.totalSpent,
        lastOrderAt: summary.lastOrderAt,
      };
    });

    // ------------------------------------------------------------
    // 5. Overall summary
    // ------------------------------------------------------------
    const summary = {
      totalCustomers: customers.length,

      customersWithPurchases: customers.filter(
        (customer) => customer.orders.paid > 0
      ).length,

      totalPaidOrders: customers.reduce(
        (total, customer) => total + customer.orders.paid,
        0
      ),

      totalRevenue: customers.reduce(
        (total, customer) => total + customer.totalSpent,
        0
      ),
    };

    return NextResponse.json({
      ok: true,
      customers,
      count: customers.length,
      summary,
    });
  } catch (error) {
    console.error("Admin customers API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load customers.",
      },
      { status: 500 }
    );
  }
}
