"use client";
import { Flag } from "../Flag";
import { flagUrl, teamAbbr } from "@/lib/teams";
import { pointsForPrediction } from "@/lib/scoring";
import type { Match, Player, Prediction, ScoredPlayer } from "@/lib/types";

export function Me({
  me,
  scored,
  matches,
  predictions,
  onLogout,
  onDelete,
}: {
  me: Player;
  scored: ScoredPlayer[];
  matches: Match[];
  predictions: Prediction[];
  onLogout: () => void;
  onDelete: () => Promise<void>;
}) {
  const myScore = scored.find((p) => p.id === me.id);
  const myRank = scored.findIndex((p) => p.id === me.id) + 1;
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const myPreds = predictions.filter((p) => p.player_id === me.id);

  const rows = myPreds
    .map((pr) => {
      const m = matchById.get(pr.match_id);
      if (!m) return null;
      const pts = pointsForPrediction(pr, m);
      const kind = m.status === "finished" ? (pts === 3 ? "p3" : pts === 1 ? "p1" : "p0") : "pn";
      return { m, pr, pts, kind };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => new Date(b.m.kickoff_utc).getTime() - new Date(a.m.kickoff_utc).getTime());

  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <h1>Mon profil</h1>
        </div>
      </div>
      <div className="scroll">
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            className="av"
            style={{ width: 64, height: 64, fontSize: 24, background: me.color }}
          >
            {me.name[0]?.toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>{me.name}</div>
            <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 2 }}>
              {myRank ? (
                <>
                  {myRank}
                  <sup>e</sup> sur {scored.length} · {myScore?.pts ?? 0} pts · {myScore?.exact ?? 0} score
                  {(myScore?.exact ?? 0) > 1 ? "s" : ""} exact{(myScore?.exact ?? 0) > 1 ? "s" : ""}
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>

        <div className="stat-row" style={{ marginTop: 14 }}>
          <div className="chip">
            <div className="v num">{myPreds.length}</div>
            <div className="l">Pronos</div>
          </div>
          <div className="chip">
            <div className="v num">{myScore?.good ?? 0}</div>
            <div className="l">Bons résultats</div>
          </div>
          <div className="chip">
            <div className="v num" style={{ color: "var(--accent)" }}>
              {myScore?.exact ?? 0}
            </div>
            <div className="l">Scores exacts</div>
          </div>
        </div>

        <div className="section-h">
          <h2>Mes paris</h2>
        </div>
        {rows.length === 0 && (
          <div className="card" style={{ textAlign: "center", color: "var(--text-2)" }}>
            Aucun pronostic pour l'instant.
          </div>
        )}
        {rows.map((d) => (
          <div className="bet-row" key={d.pr.id}>
            <div>
              <div className="top">
                <Flag url={flagUrl(d.m.home, d.m.home_flag)} code={d.m.home} />
                <span>{teamAbbr(d.m.home)}</span>
                <span style={{ color: "var(--text-3)" }}>vs</span>
                <span>{teamAbbr(d.m.away)}</span>
                <Flag url={flagUrl(d.m.away, d.m.away_flag)} code={d.m.away} />
              </div>
              <div className="meta">
                {new Date(d.m.kickoff_utc).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).toUpperCase()} ·{" "}
                {new Date(d.m.kickoff_utc).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="bottom" style={{ marginTop: 6 }}>
                <span>
                  <span className="lbl">Toi</span>{" "}
                  <span className="v">
                    {d.pr.home_score}–{d.pr.away_score}
                  </span>
                </span>
                {d.m.home_score != null && d.m.away_score != null ? (
                  <span>
                    <span className="lbl">Score</span>{" "}
                    <span className="v">
                      {d.m.home_score}–{d.m.away_score}
                    </span>
                  </span>
                ) : (
                  <span className="lbl">{d.m.status === "live" ? "En direct" : "À venir"}</span>
                )}
              </div>
            </div>
            <span className={"pts-badge " + d.kind}>
              {d.kind === "pn" ? "à venir" : "+" + d.pts}
            </span>
          </div>
        ))}

        <div className="section-h">
          <h2>Compte</h2>
        </div>
        <button className="btn ghost" onClick={onLogout}>
          Changer de joueur (se déconnecter)
        </button>
        <button
          className="btn danger"
          style={{ marginTop: 8 }}
          onClick={() => {
            if (confirm("Supprimer ton compte et tous tes pronostics ?")) onDelete();
          }}
        >
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}
