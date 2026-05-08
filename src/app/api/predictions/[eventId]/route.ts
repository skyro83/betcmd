import { NextResponse } from "next/server";
import { fetchPredictions } from "@/lib/bsd";

export const runtime = "nodejs";
export const revalidate = 1800; // 30 min

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  try {
    const data = await fetchPredictions(params.eventId);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
