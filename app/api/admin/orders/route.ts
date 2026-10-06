import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { supabase, user, isAdmin } =
      await requireAdmin();

    if (!user || !isAdmin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const status =
      searchParams.get("status")?.trim() || "";

    const search =
      searchParams.get("search")?.trim() || "";

    let query = supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        razorpay_order_id,
        razorpay_payment_id,
        payment_status,
        total_amount,
        currency,
        created_at,
        updated_at,
        order_items(
          id,
          book_id,
          price,
          created_at,
          books(
            id,
            title,
            slug,
            author,
            cover_path
          )
        )
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (status) {
      query = query.eq(
        "payment_status",
        status
      );
    }

    const {
      data: orders,
      error,
    } = await query;

    if (error) {
      console.error(
        "Admin orders lookup error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // Load customer profiles separately.
    // ------------------------------------------------------------
    const userIds = Array.from(
      new Set(
        (orders ?? [])
          .map(
            (order) =>
              order.user_id
          )
          .filter(
            (id): id is string =>
              typeof id === "string" &&
              id.length > 0
          )
      )
    );

    const profilesById = new Map<
      string,
      {
        id: string;
        full_name: string | null;
        email: string | null;
      }
    >();

    if (userIds.length > 0) {
      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(
          "id,full_name,email"
        )
        .in("id", userIds);

      if (profilesError) {
        console.warn(
          "Admin orders profile lookup warning:",
          profilesError
        );
      } else {
        for (const profile of profiles ?? []) {
          profilesById.set(
            profile.id,
            profile
          );
        }
      }
    }

    // ------------------------------------------------------------
    // Optional search
    // ------------------------------------------------------------
    const filteredOrders =
      (orders ?? []).filter(
        (order) => {
          if (!search) {
            return true;
          }

          const profile =
            order.user_id
              ? profilesById.get(
                  order.user_id
                )
              : null;

          const bookSearchText =
            (order.order_items ?? [])
              .flatMap((item) => {
                /*
                 * Supabase can infer a nested
                 * relationship as an array.
                 * Normalize it to one book.
                 */
                const book =
                  Array.isArray(
                    item.books
                  )
                    ? item.books[0] ??
                      null
                    : item.books;

                return book
                  ? [
                      book.title,
                      book.author,
                      book.slug,
                    ]
                  : [];
              });

          const searchableText = [
            order.id,
            order.razorpay_order_id,
            order.razorpay_payment_id,
            profile?.full_name,
            profile?.email,
            ...bookSearchText,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            search.toLowerCase()
          );
        }
      );

    // ------------------------------------------------------------
    // Format response
    // ------------------------------------------------------------
    const formattedOrders =
      filteredOrders.map(
        (order) => {
          const profile =
            order.user_id
              ? profilesById.get(
                  order.user_id
                )
              : null;

          return {
            id: order.id,

            userId:
              order.user_id,

            customer: profile
              ? {
                  id: profile.id,
                  fullName:
                    profile.full_name,
                  email:
                    profile.email,
                }
              : null,

            razorpayOrderId:
              order.razorpay_order_id,

            razorpayPaymentId:
              order.razorpay_payment_id,

            status:
              order.payment_status,

            amount: Number(
              order.total_amount
            ),

            currency:
              order.currency,

            createdAt:
              order.created_at,

            updatedAt:
              order.updated_at,

            items: (
              order.order_items ??
              []
            ).map(
              (item) => {
                /*
                 * Normalize the nested
                 * Supabase books relationship.
                 */
                const book =
                  Array.isArray(
                    item.books
                  )
                    ? item.books[0] ??
                      null
                    : item.books;

                return {
                  id: item.id,

                  bookId:
                    item.book_id,

                  price: Number(
                    item.price
                  ),

                  createdAt:
                    item.created_at,

                  book: book
                    ? {
                        id: book.id,
                        title:
                          book.title,
                        slug:
                          book.slug,
                        author:
                          book.author,
                        coverPath:
                          book.cover_path,
                      }
                    : null,
                };
              }
            ),
          };
        }
      );

    // ------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------
    const summary = {
      totalOrders:
        formattedOrders.length,

      paidOrders:
        formattedOrders.filter(
          (order) =>
            order.payment_status ===
            "paid"
        ).length,

      pendingOrders:
        formattedOrders.filter(
          (order) =>
            order.payment_status ===
            "pending"
        ).length,

      failedOrders:
        formattedOrders.filter(
          (order) =>
            order.payment_status ===
            "failed"
        ).length,

      paidRevenue:
        formattedOrders
          .filter(
            (order) =>
              order.payment_status ===
              "paid"
          )
          .reduce(
            (
              total,
              order
            ) =>
              total +
              order.total_amount,
            0
          ),
    };

    return NextResponse.json({
      ok: true,
      orders:
        formattedOrders,
      count:
        formattedOrders.length,
      summary,
    });
  } catch (error) {
    console.error(
      "Admin orders API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load admin orders.",
      },
      { status: 500 }
    );
  }
}
