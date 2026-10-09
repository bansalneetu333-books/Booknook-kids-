import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    { error: "Book downloads are disabled. Please read the EPUB in the BookNook Kids online reader." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Book downloads are disabled. Please read the EPUB in the BookNook Kids online reader." },
    { status: 410 }
  );
}
