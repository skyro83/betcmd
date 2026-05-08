import { NextResponse } from "next/server";
import { fetchTopScorers } from "@/lib/bsd";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET() {
  try {
    const data = await fetchTopScorers();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=900" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
