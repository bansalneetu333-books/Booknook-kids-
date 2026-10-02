import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const [
      preferencesResult,
      messagesResult,
    ] = await Promise.all([
      supabase
        .from("whatsapp_preferences")
        .select(
          "id, user_id, phone_number, opted_in, order_updates, book_updates, marketing_updates, created_at, updated_at"
        )
        .order("updated_at", {
          ascending: false,
        })
        .limit(100),

      supabase
        .from("whatsapp_messages")
        .select(
          "id, user_id, phone_number, message_type, template_name, status, book_id, order_id, created_at, sent_at"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(100),
    ]);

    if (
      preferencesResult.error &&
      preferencesResult.error.code !==
        "42P01"
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to load WhatsApp preferences.",
        },
        { status: 500 }
      );
    }

    if (
      messagesResult.error &&
      messagesResult.error.code !==
        "42P01"
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to load WhatsApp messages.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      configured: !(
        preferencesResult.error?.code ===
          "42P01" ||
        messagesResult.error?.code ===
          "42P01"
      ),
      preferences:
        preferencesResult.data ?? [],
      messages:
        messagesResult.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load WhatsApp information.",
      },
      { status: 500 }
    );
  }
}
