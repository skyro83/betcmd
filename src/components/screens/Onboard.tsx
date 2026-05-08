"use client";
import { useState } from "react";
import { Ic } from "../icons";

const COLORS = [
  "#C8102E", "#E8C84A", "#5C7CFA", "#5BD08C",
  "#A78BFA", "#F472B6", "#FFB547", "#7AB8FF",
  "#FF6A5B", "#22D3EE", "#94A3B8", "#FB923C",
];

export function OnboardWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="screen">
      <div className="ob-screen">
        <div className="ob-hero">
          <div className="logo-mark"><span>P</span></div>
          <h1 className="ob-title">La <em>Poule</em><br />du Mondial</h1>
          <p className="ob-sub">Mise 10 € avec les copains, pronostique les 72 matchs de poule, le meilleur empoche tout.</p>
          <div className="ob-rules">
            <div className="ob-rule">
              <span className="b silver">+1</span>
              <div><div className="t">Bon résultat</div><div className="s">Tu trouves victoire ou nul</div></div>
            </div>
            <div className="ob-rule">
              <span className="b gold">+3</span>
              <div><div className="t">Score exact</div><div className="s">Pile au but près · jackpot</div></div>
            </div>
            <div className="ob-rule">
              <span className="b red">€</span>
              <div><div className="t">Le gagnant rafle tout</div><div className="s">Mise unique · 10 € par joueur</div></div>
            </div>
          </div>
        </div>
        <div className="step-dots"><i className="on" /><i /></div>
      </div>
      <div className="footer-cta">
        <button className="btn primary" onClick={onNext}>Créer mon joueur →</button>
      </div>
    </div>
  );
}

export function OnboardCreate({
  onBack,
  onDone,
  busy,
}: {
  onBack: () => void;
  onDone: (name: string, color: string) => void;
  busy?: boolean;
}) {
  const [first, setFirst] = useState("");
  const [color, setColor] = useState("#C8102E");
  const valid = first.trim().length >= 2;
  const init = (first[0] || "?").toUpperCase();

  return (
    <div className="screen">
      <div className="topbar with-back">
        <button className="iconbtn" onClick={onBack} aria-label="Retour">
          <Ic.back />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Mon joueur</div>
        </div>
        <div style={{ width: 40 }} />
      </div>
      <div className="scroll" style={{ paddingTop: 0 }}>
        <div style={{ textAlign: "center", margin: "4px 0 22px" }}>
          <div className="step-dots"><i /><i className="on" /></div>
          <h2 style={{ margin: "6px 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>
            On fait connaissance ?
          </h2>
          <p style={{ color: "var(--text-2)", margin: 0, fontSize: 14 }}>
            Juste ton prénom suffit. Ce sera affiché aux copains.
          </p>
        </div>

        <div className="preview-card">
          <span className="av" style={{ width: 56, height: 56, fontSize: 22, background: color }}>{init}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="nm" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {first ? first : <span style={{ color: "var(--text-3)" }}>Ton prénom</span>}
            </div>
            <div className="hd">Joueur · Poule des copains</div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="form-group">
            <label htmlFor="fn">Prénom</label>
            <input
              id="fn"
              className="input"
              type="text"
              placeholder="Ex. Antoine"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Ta couleur</label>
            <div className="color-picker">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={color === c ? "on" : ""}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={"Couleur " + c}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="footer-cta">
        <button
          className="btn primary"
          disabled={!valid || busy}
          onClick={() => onDone(first.trim(), color)}
        >
          {busy ? "Création…" : "Rejoindre la poule →"}
        </button>
      </div>
    </div>
  );
}
