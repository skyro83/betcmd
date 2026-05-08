"use client";
import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./supabase";
import type { Player, Prediction } from "./types";

const PLAYER_KEY = "lapoule.playerId";

export function getStoredPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_KEY);
}
export function setStoredPlayerId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(PLAYER_KEY, id);
  else localStorage.removeItem(PLAYER_KEY);
}

export async function createPlayer(name: string, color: string): Promise<Player | null> {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase
    .from("players")
    .insert({ name, color })
    .select()
    .single();
  if (error) {
    console.error(error);
    return null;
  }
  return data as Player;
}

export async function deletePlayer(id: string): Promise<boolean> {
  if (!supabaseConfigured) return false;
  const { error } = await supabase.from("players").delete().eq("id", id);
  return !error;
}

export async function upsertPrediction(
  player_id: string,
  match_id: string,
  home_score: number,
  away_score: number
): Promise<Prediction | null> {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase
    .from("predictions")
    .upsert(
      { player_id, match_id, home_score, away_score },
      { onConflict: "player_id,match_id" }
    )
    .select()
    .single();
  if (error) {
    console.error(error);
    return null;
  }
  return data as Prediction;
}

/**
 * Charge la table puis s'abonne aux INSERT/UPDATE/DELETE via Realtime.
 * Pas de polling.
 */
function useRealtimeTable<T extends { id: string }>(table: string) {
  const [rows, setRows] = useState<T[]>([]);
  useEffect(() => {
    if (!supabaseConfigured) return;
    let cancelled = false;
    async function load() {
      const { data } = await supabase.from(table).select("*");
      if (!cancelled && data) setRows(data as T[]);
    }
    load();
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          setRows((prev) => {
            if (payload.eventType === "DELETE") {
              const id = (payload.old as { id?: string }).id;
              return id ? prev.filter((r) => r.id !== id) : prev;
            }
            const next = payload.new as T;
            const idx = prev.findIndex((r) => r.id === next.id);
            if (idx === -1) return [...prev, next];
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
  }, [table]);
  return [rows, setRows] as const;
}

export function usePlayers() {
  const [players, setPlayers] = useRealtimeTable<Player>("players");
  return { players, setPlayers, loading: false };
}

export function usePredictions() {
  const [predictions, setPredictions] = useRealtimeTable<Prediction>("predictions");
  return { predictions, setPredictions };
}
