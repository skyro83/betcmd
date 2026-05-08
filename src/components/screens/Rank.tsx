"use client";
import { Avatar } from "../Avatar";
import { Ic } from "../icons";
import type { Match, Player, ScoredPlayer } from "@/lib/types";

const STAKE = 10;

export function Rank({
  me,
  scored,
  matches,
}: {
  me: Player;
  scored: ScoredPlayer[];
  matches: Match[];
}) {
  const allFinished = matches.length > 0 && matches.every((m) => m.status === "finished");
  const winner = allFinished && scored.length > 0 ? scored[0] : null;
  const pot = scored.length * STAKE;

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  const now = new Date();
  const printDate = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const printTime = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <h1>Classement</h1>
          <div className="greet">
            {scored.length} joueur{scored.length > 1 ? "s" : ""} · cagnotte {pot} €
          </div>
        </div>
        {scored.length > 0 && (
          <button
            className="iconbtn"
            aria-label="Exporter le classement en PDF"
            onClick={handlePrint}
            title="Exporter / Imprimer"
          >
            <Ic.print />
          </button>
        )}
      </div>
      <div className="scroll">
        {winner && (
          <div
            className="card"
            style={{
              marginBottom: 14,
              background: "linear-gradient(160deg,#E8C84A,#D4B032)",
              color: "var(--accent-ink)",
              borderColor: "transparent",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700 }}>VAINQUEUR · MONDIAL 2026</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>👑 {winner.name}</div>
            <div style={{ marginTop: 4, fontSize: 13 }}>
              empoche <b>{pot} €</b> · {winner.pts} pts · {winner.exact} score
              {winner.exact > 1 ? "s" : ""} exact{winner.exact > 1 ? "s" : ""}
            </div>
          </div>
        )}

        <div className="card" style={{ padding: "4px 14px" }}>
          {scored.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", color: "var(--text-2)" }}>
              Pas encore de joueur.
            </div>
          )}
          {scored.map((p, i) => (
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
                    {!p.paid ? " · à payer" : ""}
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
      </div>

      {/* Print-only view — hidden on screen, swapped in for paper output. */}
      <div className="print-only" aria-hidden="true">
        <div className="print-header">
          <div>
            <h1>La Poule 2026 — Classement</h1>
            <div className="print-sub">
              {scored.length} joueur{scored.length > 1 ? "s" : ""} · cagnotte {pot} € · barème +3
              (score exact) / +1 (bon résultat)
            </div>
          </div>
          <div className="print-date">
            Édité le {printDate} à {printTime}
          </div>
        </div>

        {winner && (
          <div className="print-winner">
            🏆 Vainqueur : <b>{winner.name}</b> — {winner.pts} pts ({winner.exact} score
            {winner.exact > 1 ? "s" : ""} exact{winner.exact > 1 ? "s" : ""}) · empoche {pot} €
          </div>
        )}

        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th>Joueur</th>
              <th style={{ width: 80, textAlign: "right" }}>Exacts</th>
              <th style={{ width: 80, textAlign: "right" }}>Bons rés.</th>
              <th style={{ width: 80, textAlign: "right" }}>Points</th>
              <th style={{ width: 70, textAlign: "center" }}>Mise</th>
            </tr>
          </thead>
          <tbody>
            {scored.map((p, i) => (
              <tr key={p.id} className={i === 0 ? "first" : ""}>
                <td>{i + 1}</td>
                <td>{p.name}</td>
                <td style={{ textAlign: "right" }}>{p.exact}</td>
                <td style={{ textAlign: "right" }}>{p.good}</td>
                <td style={{ textAlign: "right" }}>
                  <b>{p.pts}</b>
                </td>
                <td style={{ textAlign: "center" }}>{p.paid ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-footer">
          La Poule 2026 · classement basé sur {matches.filter((m) => m.status === "finished").length}
          /{matches.length} matchs joués
        </div>
      </div>
    </div>
  );
}
