"use client";
import { useState } from "react";
import { Flag } from "./Flag";
import { flagUrl, teamNameFr } from "@/lib/teams";
import { isLocked } from "@/lib/match-utils";
import type { Match } from "@/lib/types";

type Bet = { home: string; away: string };

export function MatchRow({
  m,
  bet,
  onSave,
  onOpenDetails,
}: {
  m: Match;
  bet: { home_score: number; away_score: number } | null;
  onSave: (home: number, away: number) => Promise<void>;
  onOpenDetails?: (m: Match) => void;
}) {
  const locked = m.status !== "open" || isLocked(m.kickoff_utc);
  const [draft, setDraft] = useState<Bet>({
    home: bet ? String(bet.home_score) : "",
    away: bet ? String(bet.away_score) : "",
  });
  const [saved, setSaved] = useState(Boolean(bet));
  const [busy, setBusy] = useState(false);

  function set(side: "home" | "away", val: string) {
    const v = val.replace(/[^0-9]/g, "").slice(0, 2);
    setDraft((d) => ({ ...d, [side]: v }));
    setSaved(false);
  }
  function pick(r: "1" | "N" | "2") {
    const def = r === "1" ? { home: "1", away: "0" } : r === "N" ? { home: "1", away: "1" } : { home: "0", away: "1" };
    setDraft(def);
    setSaved(false);
  }

  const hasInput = draft.home !== "" && draft.away !== "";
  const result =
    hasInput
      ? Number(draft.home) > Number(draft.away)
        ? "1"
        : Number(draft.home) < Number(draft.away)
          ? "2"
          : "N"
      : null;

  async function handleSave() {
    if (!hasInput) return;
    setBusy(true);
    try {
      await onSave(Number(draft.home), Number(draft.away));
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  const date = new Date(m.kickoff_utc);
  const dateStr = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).toUpperCase();
  const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={"match" + (locked ? " locked" : "")}>
      <button
        type="button"
        className="match-head"
        onClick={() => onOpenDetails?.(m)}
        disabled={!onOpenDetails}
        aria-label="Voir les détails du match"
      >
        <div className="meta">
          <span>
            <b style={{ color: "var(--text)" }}>{dateStr}</b> · {timeStr}
            {m.city ? ` · ${m.city}` : ""}
          </span>
          {m.status === "finished" && <span className="pill done">Terminé</span>}
          {m.status === "live" && <span className="pill live">{m.minute ?? "LIVE"}</span>}
          {m.status === "open" && <span className="pill gold">Groupe {m.group}</span>}
        </div>
        <div className="row">
          <div className="team">
            <Flag url={flagUrl(m.home, m.home_flag)} code={m.home} />
            <span className="nm">{teamNameFr(m.home, m.home_name)}</span>
          </div>
          {m.status !== "open" && m.home_score != null && m.away_score != null ? (
            <div className="scoreShown">
              {m.home_score} – {m.away_score}
            </div>
          ) : (
            <div className="vs">VS</div>
          )}
          <div className="team away">
            <span className="nm">{teamNameFr(m.away, m.away_name)}</span>
            <Flag url={flagUrl(m.away, m.away_flag)} code={m.away} />
          </div>
        </div>
      </button>

      {!locked && (
        <div className="pickbar">
          <div className="picks">
            <button className={result === "1" ? "on" : ""} onClick={() => pick("1")}>1</button>
            <button className={result === "N" ? "on" : ""} onClick={() => pick("N")}>N</button>
            <button className={result === "2" ? "on" : ""} onClick={() => pick("2")}>2</button>
          </div>
          <div className="scoreInputs">
            <input inputMode="numeric" value={draft.home} placeholder="0" onChange={(e) => set("home", e.target.value)} />
            <span className="colon">:</span>
            <input inputMode="numeric" value={draft.away} placeholder="0" onChange={(e) => set("away", e.target.value)} />
          </div>
          {saved ? (
            <span className="saved">Validé</span>
          ) : (
            <button className="btn sm primary" disabled={!hasInput || busy} onClick={handleSave}>
              {busy ? "…" : "Valider"}
            </button>
          )}
        </div>
      )}

      {locked && (
        <div className="pickbar" style={{ justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-2)", fontSize: 12 }}>Ton pari</span>
          <span className="num" style={{ fontWeight: 800, fontSize: 16 }}>
            {bet ? `${bet.home_score} : ${bet.away_score}` : "– : –"}
          </span>
        </div>
      )}
    </div>
  );
}
