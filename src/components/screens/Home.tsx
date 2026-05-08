"use client";
import { useState } from "react";
import { Flag } from "../Flag";
import { Avatar } from "../Avatar";
import { Ic } from "../icons";
import { MatchDetailsSheet } from "../MatchDetailsSheet";
import { flagUrl, teamAbbr, teamNameFr } from "@/lib/teams";
import type { Match, Player, Prediction, ScoredPlayer } from "@/lib/types";
import { isLocked } from "@/lib/match-utils";

const STAKE = 10;

export function Home({
  me,
  scored,
  matches,
  predictions,
  onGoto,
}: {
  me: Player;
  scored: ScoredPlayer[];
  matches: Match[];
  predictions: Prediction[];
  onGoto: (t: "bets" | "rank") => void;
}) {
  const [detailMatch, setDetailMatch] = useState<Match | null>(null);
  const live = matches.find((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "open" && !isLocked(m.kickoff_utc)).slice(0, 3);
  const myScore = scored.find((p) => p.id === me.id);
  const myRank = scored.findIndex((p) => p.id === me.id) + 1;
  const myLivePred = live ? predictions.find((p) => p.player_id === me.id && p.match_id === live.id) : null;
  const pot = scored.length * STAKE;
  const paidCount = scored.filter((p) => p.paid).length;

  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <h1>Salut {me.name.split(" ")[0]} 👋</h1>
          <div className="greet">
            {scored.length > 0 ? (
              <>
                Tu es {myRank || "—"}
                <sup>e</sup> · {myScore?.pts ?? 0} pts
              </>
            ) : (
              "Aucun joueur encore"
            )}
          </div>
        </div>
        <button className="iconbtn" aria-label="Notifications">
          <Ic.bell />
        </button>
      </div>

      <div className="scroll">
        {live && (
          <div className="live-hero" onClick={() => setDetailMatch(live)} role="button" tabIndex={0}>
            <div className="top">
              <span className="pill live">EN DIRECT{live.minute ? ` · ${live.minute}` : ""}</span>
              <span style={{ color: "var(--text-2)", fontSize: 11 }}>Groupe {live.group}</span>
            </div>
            <div className="score-row">
              <div className="team">
                <Flag url={flagUrl(live.home, live.home_flag)} code={live.home} size={36} />
                <span className="nm">{teamNameFr(live.home, live.home_name)}</span>
              </div>
              <div className="sc">
                {live.home_score ?? 0} – {live.away_score ?? 0}
                <small>VERROUILLÉ</small>
              </div>
              <div className="team">
                <Flag url={flagUrl(live.away, live.away_flag)} code={live.away} size={36} />
                <span className="nm">{teamNameFr(live.away, live.away_name)}</span>
              </div>
            </div>
            {myLivePred && (
              <div className="my-pick">
                <span style={{ color: "var(--text-2)" }}>
                  Ton pari :{" "}
                  <b>
                    {teamAbbr(live.home)} {myLivePred.home_score} – {myLivePred.away_score} {teamAbbr(live.away)}
                  </b>
                </span>
              </div>
            )}
          </div>
        )}

        <div className="stat-row" style={{ marginTop: 14 }}>
          <div className="chip">
            <div className="v num">{myScore?.pts ?? 0}</div>
            <div className="l">Tes points</div>
          </div>
          <div className="chip">
            <div className="v num">{myScore?.exact ?? 0}</div>
            <div className="l">Scores exacts</div>
          </div>
          <div className="chip gold">
            <div className="v num">
              {myRank || "—"}
              <sup style={{ fontSize: 11 }}>e</sup>
            </div>
            <div className="l">Classement</div>
          </div>
        </div>

        <div className="section-h"><h2>Cagnotte</h2></div>
        <div className="pot">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ color: "var(--text-2)", fontSize: 13, fontWeight: 600 }}>Total en jeu</div>
              <div className="amt num">
                {pot}
                <span>€</span>
              </div>
            </div>
            <span className="pill">{scored.length} joueur{scored.length > 1 ? "s" : ""}</span>
          </div>
          <div className="bar">
            <i style={{ width: scored.length ? `${Math.round((paidCount / scored.length) * 100)}%` : "0%" }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-2)" }}>
            {paidCount}/{scored.length} ont versé
          </div>
          <div className="stk">
            {scored.map((p) =>
              p.paid ? (
                <span key={p.id} className="av" style={{ background: p.color }}>
                  {p.name[0]?.toUpperCase()}
                </span>
              ) : (
                <span key={p.id} className="av unp">?</span>
              )
            )}
          </div>
        </div>

        {upcoming.length > 0 && (
          <>
            <div className="section-h">
              <h2>À pronostiquer</h2>
              <button className="more" onClick={() => onGoto("bets")}>
                Tout voir →
              </button>
            </div>
            {upcoming.map((m) => (
              <div key={m.id} className="match" onClick={() => setDetailMatch(m)} role="button" tabIndex={0}>
                <div className="meta">
                  <span>
                    <b style={{ color: "var(--text)" }}>
                      {new Date(m.kickoff_utc).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).toUpperCase()}
                    </b>{" "}
                    · {new Date(m.kickoff_utc).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="pill gold">Ouvert</span>
                </div>
                <div className="row">
                  <div className="team">
                    <Flag url={flagUrl(m.home, m.home_flag)} code={m.home} />
                    <span className="nm">{teamAbbr(m.home)}</span>
                  </div>
                  <div className="vs">VS</div>
                  <div className="team away">
                    <span className="nm">{teamAbbr(m.away)}</span>
                    <Flag url={flagUrl(m.away, m.away_flag)} code={m.away} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {scored.length > 0 && (
          <>
            <div className="section-h">
              <h2>Top 3 de la poule</h2>
              <button className="more" onClick={() => onGoto("rank")}>
                Voir tout →
              </button>
            </div>
            <div className="card" style={{ padding: "4px 14px" }}>
              {scored.slice(0, 3).map((p, i) => (
                <div
                  key={p.id}
                  className={"lb-row" + (i === 0 ? " crown" : "") + (p.id === me.id ? " me" : "")}
                >
                  <div className="rk">{i === 0 ? "" : i + 1}</div>
                  <div className="who">
                    <Avatar name={p.name} color={p.color} size={36} />
                    <div>
                      <div className="nm">
                        {p.name}
                        {p.id === me.id && " (toi)"}
                      </div>
                      <div className="sub">
                        {p.exact} score{p.exact > 1 ? "s" : ""} exact{p.exact > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="pts num">
                    {p.pts}
                    <small>pts</small>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <MatchDetailsSheet match={detailMatch} onClose={() => setDetailMatch(null)} />
    </div>
  );
}
