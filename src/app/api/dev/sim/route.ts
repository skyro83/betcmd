import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * Dev-only: list available match IDs so you know what to pass to /api/dev/sim/[matchId].
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("matches")
    .select("id, day, kickoff_utc, home_code, away_code, status, home_score, away_score, minute")
    .order("day")
    .order("kickoff_utc")
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.length ?? 0, matches: data ?? [] });
}
