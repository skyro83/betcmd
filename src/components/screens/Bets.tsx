"use client";
import { useMemo, useState } from "react";
import { MatchRow } from "../MatchRow";
import { MatchDetailsSheet } from "../MatchDetailsSheet";
import type { Match, Player, Prediction } from "@/lib/types";
import { upsertPrediction } from "@/lib/store";

export function Bets({
  me,
  matches,
  predictions,
  onPredictionSaved,
}: {
  me: Player;
  matches: Match[];
  predictions: Prediction[];
  onPredictionSaved: (p: Prediction) => void;
}) {
  const days = useMemo(() => {
    const set = new Set<number>();
    for (const m of matches) set.add(m.day);
    return [...set].sort((a, b) => a - b);
  }, [matches]);

  const [day, setDay] = useState<number>(days[0] ?? 1);
  const myPredsByMatch = useMemo(() => {
    const map = new Map<string, Prediction>();
    for (const p of predictions) if (p.player_id === me.id) map.set(p.match_id, p);
    return map;
  }, [predictions, me.id]);

  const dayMatches = matches.filter((m) => m.day === day);
  const counts = days.map((d) => {
    const list = matches.filter((m) => m.day === d);
    const placed = list.filter((m) => myPredsByMatch.has(m.id)).length;
    return { d, placed, total: list.length };
  });

  const [toast, setToast] = useState<string | null>(null);
  const [detailMatch, setDetailMatch] = useState<Match | null>(null);

  async function onSave(m: Match, home: number, away: number) {
    const saved = await upsertPrediction(me.id, m.id, home, away);
    if (saved) {
      onPredictionSaved(saved);
      setToast(`Validé · ${m.home} ${home}–${away} ${m.away}`);
      setTimeout(() => setToast(null), 2000);
    }
  }

  const myCount = counts.find((c) => c.d === day);

  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <h1>Pronostics</h1>
          <div className="greet">
            {myCount ? `${myCount.placed}/${myCount.total} déposés sur la J${day}` : "Aucun match"}
          </div>
        </div>
      </div>
      <div className="scroll">
        {days.length > 0 && (
          <div className="daypills">
            {days.map((d) => {
              const c = counts.find((x) => x.d === d)!;
              return (
                <button key={d} className={day === d ? "on" : ""} onClick={() => setDay(d)}>
                  J{d}
                  <span className="b">
                    {c.placed}/{c.total}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {dayMatches.length === 0 && (
            <div className="card" style={{ textAlign: "center", color: "var(--text-2)" }}>
              Aucun match disponible.
            </div>
          )}
          {dayMatches.map((m) => {
            const pred = myPredsByMatch.get(m.id) ?? null;
            return (
              <MatchRow
                key={m.id}
                m={m}
                bet={pred ? { home_score: pred.home_score, away_score: pred.away_score } : null}
                onSave={(h, a) => onSave(m, h, a)}
                onOpenDetails={setDetailMatch}
              />
            );
          })}
        </div>
        <div style={{ padding: "6px 2px", color: "var(--text-3)", fontSize: 11, textAlign: "center" }}>
          Coup d'envoi = verrouillage. Tu peux modifier jusque-là.
        </div>
      </div>
      {toast && (
        <div className="toast">
          <span className="dot" />
          {toast}
        </div>
      )}
      <MatchDetailsSheet match={detailMatch} onClose={() => setDetailMatch(null)} />
    </div>
  );
}
