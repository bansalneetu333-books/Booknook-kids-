import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ authenticated: false, items: [], count: 0, orders: [] });

    const admin = createAdminClient();

    const { data: rows, error } = await admin
      .from("cart_items")
      .select("id, book_id, quantity, created_at, books(id,title,slug,author,price,currency,genre,cover_path,cover_url,published,is_published)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const items = (rows ?? []).map((row: any) => {
      const book = Array.isArray(row.books) ? row.books[0] : row.books;
      return {
        id: row.book_id,
        cartItemId: row.id,
        quantity: Math.max(1, Number(row.quantity || 1)),
        title: book?.title || "Book",
        slug: book?.slug || "",
        author: book?.author || "",
        price: Number(book?.price || 0),
        currency: book?.currency || "INR",
        genre: book?.genre || null,
        cover_path: book?.cover_path || null,
        cover_url: book?.cover_url || null,
        published: Boolean(book?.published ?? book?.is_published),
      };
    }).filter((item: any) => item.slug);

    const count = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    const { data: orders } = await admin
      .from("orders")
      .select("id,status,amount,currency,created_at,updated_at,order_items(id,price,books(id,title,slug,cover_path))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      authenticated: true,
      items,
      count,
      orders: (orders ?? []).map((order: any) => ({
        id: order.id,
        status: order.status,
        amount: Number(order.amount || 0),
        currency: order.currency || "INR",
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: (order.order_items ?? []).map((item: any) => {
          const book = Array.isArray(item.books) ? item.books[0] : item.books;
          return book ? {
            id: book.id,
            title: book.title,
            slug: book.slug,
            cover_path: book.cover_path || null,
            price: Number(item.price || 0),
          } : null;
        }).filter(Boolean),
      })),
    });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json({ error: "Unable to load cart." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const incoming = Array.isArray(body.items) ? body.items : [];
    const ids = [...new Set(incoming.map((item: any) => String(item?.id || "")).filter(Boolean))];

    if (ids.length) {
      const admin = createAdminClient();
      const { data: books, error: booksError } = await admin
        .from("books")
        .select("id,published,is_published")
        .in("id", ids);

      if (booksError) throw booksError;

      const validIds = new Set(
        (books ?? [])
          .filter((book: any) => Boolean(book.published ?? book.is_published))
          .map((book: any) => book.id)
      );

      const rows = ids.filter((id) => validIds.has(id)).map((bookId) => ({
        user_id: user.id,
        book_id: bookId,
        quantity: 1,
      }));

      if (rows.length) {
        const { error } = await admin
          .from("cart_items")
          .upsert(rows, { onConflict: "user_id,book_id", ignoreDuplicates: true });
        if (error) throw error;
      }
    }

    return GET();
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json({ error: "Unable to save cart." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const admin = createAdminClient();

    if (body.clear === true) {
      const { error } = await admin.from("cart_items").delete().eq("user_id", user.id);
      if (error) throw error;
    } else if (Array.isArray(body.bookIds) && body.bookIds.length) {
      const { error } = await admin
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .in("book_id", body.bookIds.map((id: unknown) => String(id)));
      if (error) throw error;
    } else if (body.bookId) {
      const { error } = await admin
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("book_id", String(body.bookId));
      if (error) throw error;
    }

    return GET();
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json({ error: "Unable to update cart." }, { status: 500 });
  }
}
