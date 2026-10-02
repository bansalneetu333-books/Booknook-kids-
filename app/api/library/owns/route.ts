import { NextResponse } from "next/server";
import { ownsBook } from "@/lib/library";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const bookId = searchParams.get("bookId")?.trim() || "";

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required." },
        { status: 400 }
      );
    }

    const owned = await ownsBook(bookId);

    return NextResponse.json({
      ok: true,
      bookId,
      owned,
    });
  } catch (error) {
    console.error("Book ownership API error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to check book ownership.";

    if (
      message.toLowerCase().includes("not authenticated") ||
      message.toLowerCase().includes("unauthorized") ||
      message.toLowerCase().includes("login")
    ) {
      return NextResponse.json(
        {
          error: "Please log in to check book ownership.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
