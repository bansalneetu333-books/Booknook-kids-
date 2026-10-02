import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizePhone(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[()\-\s]/g, "");
}

function isValidPhone(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please log in to manage WhatsApp settings.",
        },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("whatsapp_preferences")
      .select(
        "id, phone_number, opted_in, order_updates, book_updates, marketing_updates, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error:
            "Unable to load WhatsApp settings.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: data ?? {
        phone_number: "",
        opted_in: false,
        order_updates: true,
        book_updates: false,
        marketing_updates: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load WhatsApp settings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please log in to manage WhatsApp settings.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const optedIn = Boolean(
      body?.opted_in
    );

    const phoneNumber = normalizePhone(
      body?.phone_number
    );

    const orderUpdates =
      optedIn &&
      Boolean(body?.order_updates);

    const bookUpdates =
      optedIn &&
      Boolean(body?.book_updates);

    const marketingUpdates =
      optedIn &&
      Boolean(body?.marketing_updates);

    if (optedIn && !phoneNumber) {
      return NextResponse.json(
        {
          error:
            "WhatsApp number is required when WhatsApp notifications are enabled.",
        },
        { status: 400 }
      );
    }

    if (
      phoneNumber &&
      !isValidPhone(phoneNumber)
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid WhatsApp number with country code, for example +919876543210.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("whatsapp_preferences")
      .upsert(
        {
          user_id: user.id,
          phone_number:
            phoneNumber || null,
          opted_in: optedIn,
          order_updates: orderUpdates,
          book_updates: bookUpdates,
          marketing_updates:
            marketingUpdates,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select(
        "id, phone_number, opted_in, order_updates, book_updates, marketing_updates, created_at, updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            "Unable to save WhatsApp settings.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save WhatsApp settings.",
      },
      { status: 500 }
    );
  }
}
