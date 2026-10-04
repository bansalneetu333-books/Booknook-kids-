import { NextResponse } from "next/server";
import { getMyLibrary } from "@/lib/library";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const library = await getMyLibrary();

    if (library === null) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      books: library,
      count: library.length,
    });
  } catch (error) {
    console.error(
      "Customer library API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load your library.",
      },
      {
        status: 500,
      }
    );
  }
}
