import "server-only";
import { fetchGroupMatches, fetchLiveMatches } from "./bsd";
import { supabaseAdmin } from "./supabase-admin";
import type { Match } from "./types";

type MatchRow = {
  id: string;
  match_number: number | null;
  round: string;
  group_name: string | null;
  day: number;
  kickoff_utc: string;
  city: string | null;
  home_code: string;
  away_code: string;
  home_name: string | null;
  away_name: string | null;
  home_flag: string | null;
  away_flag: string | null;
  status: "open" | "live" | "finished";
  home_score: number | null;
  away_score: number | null;
  minute: string | null;
  updated_at: string;
};

function toRow(m: Match): MatchRow {
  return {
    id: m.id,
    match_number: null,
    round: "group",
    group_name: m.group || null,
    day: m.day,
    kickoff_utc: m.kickoff_utc,
    city: m.city ?? null,
    home_code: m.home,
    away_code: m.away,
    home_name: m.home_name ?? null,
    away_name: m.away_name ?? null,
    home_flag: m.home_flag ?? null,
    away_flag: m.away_flag ?? null,
    status: m.status,
    home_score: m.home_score,
    away_score: m.away_score,
    minute: m.minute ?? null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch the full WC group-stage schedule and upsert it into Supabase.
 * Called at boot then once per hour.
 */
export async function refreshAllFixtures(): Promise<{ count: number }> {
  const matches = await fetchGroupMatches();
  if (matches.length === 0) return { count: 0 };
  const rows = matches.map(toRow);
  const { error } = await supabaseAdmin().from("matches").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`upsert matches: ${error.message}`);
  return { count: rows.length };
}

/**
 * Poll the BSD /live/ endpoint and update Supabase only for matches that are
 * already in our `matches` table (i.e. WC group-stage). Also catches the
 * live → finished transition by looking at rows we previously had as live.
 */
export async function pollLiveMatches(): Promise<{ updated: number }> {
  const admin = supabaseAdmin();

  // Read which matches we know about (and which were previously live).
  const { data: known } = await admin.from("matches").select("id,status");
  const knownIds = new Set((known ?? []).map((r) => r.id));
  const wasLive = new Set((known ?? []).filter((r) => r.status === "live").map((r) => r.id));

  const live = await fetchLiveMatches();
  const candidates: Match[] = live.filter((m) => knownIds.has(m.id));

  // For matches we had as live but that no longer appear in /live/, fetch the
  // full schedule once to capture the final score/status.
  const droppedFromLive = [...wasLive].filter((id) => !candidates.find((c) => c.id === id));
  if (droppedFromLive.length > 0) {
    const all = await fetchGroupMatches();
    for (const id of droppedFromLive) {
      const m = all.find((x) => x.id === id);
      if (m) candidates.push(m);
    }
  }

  if (candidates.length === 0) return { updated: 0 };
  const rows = candidates.map(toRow);
  const { error } = await admin.from("matches").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`upsert live: ${error.message}`);
  return { updated: rows.length };
}
