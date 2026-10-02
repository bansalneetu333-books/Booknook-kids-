
import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const admin = createAdminClient();

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return NextResponse.json(
        { error: "Unable to load customers." },
        { status: 500 }
      );
    }

    const userIds = (profiles ?? []).map((profile) => profile.id);

    let orders: Array<{
      user_id: string | null;
      amount: number | string | null;
      status: string;
    }> = [];

    if (userIds.length > 0) {
      const { data: orderData, error: ordersError } = await admin
        .from("orders")
        .select("user_id, amount, status")
        .in("user_id", userIds);

      if (ordersError) {
        return NextResponse.json(
          { error: "Unable to load customer orders." },
          { status: 500 }
        );
      }

      orders = (orderData ?? []) as typeof orders;
    }

    const orderStats = new Map<
      string,
      {
        orders: number;
        paidOrders: number;
        spent: number;
      }
    >();

    for (const order of orders) {
      if (!order.user_id) continue;

      const current = orderStats.get(order.user_id) ?? {
        orders: 0,
        paidOrders: 0,
        spent: 0,
      };

      current.orders += 1;

      if (order.status === "paid") {
        current.paidOrders += 1;
        current.spent += Number(order.amount ?? 0);
      }

      orderStats.set(order.user_id, current);
    }

    let customers = (profiles ?? []).map((profile) => {
      const stats = orderStats.get(profile.id) ?? {
        orders: 0,
        paidOrders: 0,
        spent: 0,
      };

      return {
        ...profile,
        orders_count: stats.orders,
        paid_orders_count: stats.paidOrders,
        total_spent: stats.spent,
      };
    });

    if (search) {
      const normalizedSearch = search.toLowerCase();

      customers = customers.filter((customer) => {
        return (
          String(customer.full_name ?? "")
            .toLowerCase()
            .includes(normalizedSearch) ||
          String(customer.email ?? "")
            .toLowerCase()
            .includes(normalizedSearch)
        );
      });
    }

    return NextResponse.json({
      success: true,
      customers,
      total: customers.length,
    });
  } catch (error) {
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
