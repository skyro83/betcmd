import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const ALLOWED_STATUS = new Set(["open", "live", "finished"]);

/**
 * Dev-only: simulate a match state for end-to-end testing of the live pipeline.
 * Disabled in production. Updates the matches table; Supabase Realtime propagates
 * the change to all connected clients, which re-runs scorePlayers automatically.
 *
 * Examples:
 *   /api/dev/sim/<matchId>?status=live&home=1&away=0&minute=23'
 *   /api/dev/sim/<matchId>?status=finished&home=2&away=1
 *   /api/dev/sim/<matchId>?status=open                (resets)
 */
export async function GET(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }
  if (!ID_RE.test(params.matchId)) {
    return NextResponse.json({ error: "invalid matchId" }, { status: 400 });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "live";
  if (!ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const homeRaw = url.searchParams.get("home");
  const awayRaw = url.searchParams.get("away");
  const minute = url.searchParams.get("minute");

  const patch: Record<string, unknown> = { status };
  if (status === "open") {
    patch.home_score = null;
    patch.away_score = null;
    patch.minute = null;
  } else {
    if (homeRaw != null) patch.home_score = Number(homeRaw);
    if (awayRaw != null) patch.away_score = Number(awayRaw);
    patch.minute = status === "live" ? minute ?? null : null;
    if (
      (homeRaw != null && Number.isNaN(Number(homeRaw))) ||
      (awayRaw != null && Number.isNaN(Number(awayRaw)))
    ) {
      return NextResponse.json({ error: "home/away must be numbers" }, { status: 400 });
    }
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("matches")
    .update(patch)
    .eq("id", params.matchId)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) {
    return NextResponse.json(
      {
        error: `match not found: id="${params.matchId}". Liste des IDs disponibles : GET /api/dev/sim`,
      },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, match: data, applied: patch });
}
