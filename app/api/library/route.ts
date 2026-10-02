import { NextResponse } from "next/server";
import { getMyLibrary } from "@/lib/library";

export const runtime = "nodejs";

export async function GET() {
  try {
    const library = await getMyLibrary();

    return NextResponse.json({
      ok: true,
      books: library,
      count: library.length,
    });
  } catch (error) {
    console.error("Customer library API error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load your library.";

    if (
      message.toLowerCase().includes("not authenticated") ||
      message.toLowerCase().includes("unauthorized") ||
      message.toLowerCase().includes("login")
    ) {
      return NextResponse.json(
        { error: "Please log in to view your library." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
