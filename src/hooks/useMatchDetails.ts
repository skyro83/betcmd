"use client";
import { useEffect, useState } from "react";

export type MatchDetailsPayload = {
  details: unknown;
  broadcasts: unknown;
  predictions: unknown;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: MatchDetailsPayload; at: number }>();
const inflight = new Map<string, Promise<MatchDetailsPayload>>();

function readCache(key: string): MatchDetailsPayload | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return e.data;
}

export function useMatchDetails(eventId: string | null): {
  data: MatchDetailsPayload | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<MatchDetailsPayload | null>(
    eventId ? readCache(eventId) : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setData(null);
      return;
    }
    const cached = readCache(eventId);
    if (cached) {
      setData(cached);
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    let promise = inflight.get(eventId);
    if (!promise) {
      const url = `/api/match-details/${encodeURIComponent(eventId)}`;
      promise = fetch(url, { signal: ac.signal })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<MatchDetailsPayload>;
        })
        .then((j) => {
          cache.set(eventId, { data: j, at: Date.now() });
          return j;
        })
        .finally(() => {
          inflight.delete(eventId);
        });
      inflight.set(eventId, promise);
    }

    promise
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e) => {
        if (!cancelled && e?.name !== "AbortError") {
          setError(e instanceof Error ? e.message : "error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [eventId]);

  return { data, loading, error };
}
