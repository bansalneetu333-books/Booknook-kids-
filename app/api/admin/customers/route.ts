import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const search = request.nextUrl.searchParams
      .get("search")
      ?.trim()
      .toLowerCase();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Admin customers profiles error:", profilesError);

      return NextResponse.json(
        {
          error: "Unable to load customers.",
          details: profilesError.message,
        },
        { status: 500 }
      );
    }

    const customers = profiles ?? [];

    const filteredCustomers = search
      ? customers.filter((customer) => {
          const name = customer.full_name?.toLowerCase() ?? "";
          const email = customer.email?.toLowerCase() ?? "";

          return (
            name.includes(search) ||
            email.includes(search)
          );
        })
      : customers;

    const userIds = filteredCustomers.map(
      (customer) => customer.id
    );

    let orders: Array<{
      id: string;
      user_id: string | null;
      amount: number | string;
      status: string;
      created_at: string;
    }> = [];

    if (userIds.length > 0) {
      const { data: orderData, error: ordersError } =
        await supabase
          .from("orders")
          .select(
            "id, user_id, amount, status, created_at"
          )
          .in("user_id", userIds)
          .order("created_at", {
            ascending: false,
          });

      if (ordersError) {
        console.error(
          "Admin customers orders error:",
          ordersError
        );

        return NextResponse.json(
          {
            error: "Unable to load customer order information.",
            details: ordersError.message,
          },
          { status: 500 }
        );
      }

      orders = orderData ?? [];
    }

    const ordersByUser = new Map<
      string,
      {
        ordersCount: number;
        paidOrdersCount: number;
        totalSpent: number;
        lastOrderAt: string | null;
      }
    >();

    for (const order of orders) {
      if (!order.user_id) continue;

      const current = ordersByUser.get(order.user_id) ?? {
        ordersCount: 0,
        paidOrdersCount: 0,
        totalSpent: 0,
        lastOrderAt: null,
      };

      current.ordersCount += 1;

      if (order.status === "paid") {
        current.paidOrdersCount += 1;
        current.totalSpent += Number(order.amount ?? 0);
      }

      if (
        !current.lastOrderAt ||
        new Date(order.created_at).getTime() >
          new Date(current.lastOrderAt).getTime()
      ) {
        current.lastOrderAt = order.created_at;
      }

      ordersByUser.set(order.user_id, current);
    }

    const result = filteredCustomers.map((customer) => {
      const stats = ordersByUser.get(customer.id) ?? {
        ordersCount: 0,
        paidOrdersCount: 0,
        totalSpent: 0,
        lastOrderAt: null,
      };

      return {
        id: customer.id,
        full_name: customer.full_name,
        email: customer.email,
        created_at: customer.created_at,
        orders_count: stats.ordersCount,
        paid_orders_count: stats.paidOrdersCount,
        total_spent: stats.totalSpent,
        last_order_at: stats.lastOrderAt,
      };
    });

    return NextResponse.json({
      success: true,
      customers: result,
      total: result.length,
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
