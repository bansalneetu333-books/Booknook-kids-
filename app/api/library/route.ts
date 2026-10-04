import { NextResponse } from "next/server";
import { getMyLibrary } from "@/lib/library";

export async function GET() {
  try {
    const library = await getMyLibrary();

    return NextResponse.json({
      ok: true,
      books: library ?? [],
      count: library?.length ?? 0,
    });
  } catch (error) {
    console.error("Customer library API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to load library.",
      },
      { status: 500 }
    );
  }
}
