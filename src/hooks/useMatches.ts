"use client";
import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Match, MatchStatus } from "@/lib/types";

type Row = {
  id: string;
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
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  minute: string | null;
};

function rowToMatch(r: Row): Match {
  return {
    id: r.id,
    group: r.group_name ?? "",
    day: r.day,
    kickoff_utc: r.kickoff_utc,
    city: r.city ?? undefined,
    home: r.home_code,
    away: r.away_code,
    home_name: r.home_name ?? undefined,
    away_name: r.away_name ?? undefined,
    home_flag: r.home_flag ?? undefined,
    away_flag: r.away_flag ?? undefined,
    status: r.status,
    home_score: r.home_score,
    away_score: r.away_score,
    minute: r.minute,
  };
}

/**
 * Charge les matchs depuis Supabase puis s'abonne aux changements via Realtime.
 * Aucun appel à wc2026api.com côté client.
 */
export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setError("Supabase non configuré");
      return;
    }
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("day")
        .order("kickoff_utc");
      if (cancelled) return;
      if (error) {
        setError(error.message);
        return;
      }
      setMatches((data as Row[]).map(rowToMatch));
      setError(null);
    }
    load();

    const channel = supabase
      .channel("matches-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          setMatches((prev) => {
            if (payload.eventType === "DELETE") {
              const id = (payload.old as { id?: string }).id;
              return id ? prev.filter((m) => m.id !== id) : prev;
            }
            const next = rowToMatch(payload.new as Row);
            const idx = prev.findIndex((m) => m.id === next.id);
            if (idx === -1) return [...prev, next].sort(sortMatches);
            const copy = prev.slice();
            copy[idx] = next;
            return copy;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { matches, error };
}

function sortMatches(a: Match, b: Match) {
  return (
    a.day - b.day ||
    new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
  );
}
