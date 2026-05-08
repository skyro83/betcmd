import { NextResponse } from "next/server";
import {
  fetchBroadcasts,
  fetchPredictions,
  fetchEventDetails,
} from "@/lib/bsd";

export const runtime = "nodejs";
export const revalidate = 1800;

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export async function GET(
  _req: Request,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;
  if (!ID_RE.test(eventId)) {
    return NextResponse.json({ error: "invalid eventId" }, { status: 400 });
  }
  const [details, broadcasts, predictions] = await Promise.all([
    safe(fetchEventDetails(eventId)),
    safe(fetchBroadcasts(eventId)),
    safe(fetchPredictions(eventId)),
  ]);

  return NextResponse.json(
    { details, broadcasts, predictions },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600",
      },
    }
  );
}
