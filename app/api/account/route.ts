import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type UpdateAccountPayload = {
  fullName?: string;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to view your account." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,full_name,email,role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Account profile lookup error:", profileError);

      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      account: {
        id: user.id,
        email: profile?.email ?? user.email ?? null,
        fullName: profile?.full_name ?? null,
        role: profile?.role ?? "customer",
      },
    });
  } catch (error) {
    console.error("Customer account API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load account.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to update your account." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as UpdateAccountPayload;

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (fullName.length > 100) {
      return NextResponse.json(
        { error: "Full name is too long." },
        { status: 400 }
      );
    }

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
      })
      .eq("id", user.id)
      .select("id,full_name,email,role")
      .maybeSingle();

    if (updateError) {
      console.error(
        "Customer account update error:",
        updateError
      );

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Account profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      account: {
        id: profile.id,
        email: profile.email ?? user.email ?? null,
        fullName: profile.full_name,
        role: profile.role ?? "customer",
      },
      message: "Account updated successfully.",
    });
  } catch (error) {
    console.error("Customer account update API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update account.",
      },
      { status: 500 }
    );
  }
}
