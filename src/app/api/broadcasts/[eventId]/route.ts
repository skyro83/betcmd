import { NextResponse } from "next/server";
import { fetchBroadcasts } from "@/lib/bsd";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  try {
    const data = await fetchBroadcasts(params.eventId);
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
