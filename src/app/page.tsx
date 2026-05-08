"use client";
import { useEffect, useMemo, useState } from "react";
import { OnboardWelcome, OnboardCreate } from "@/components/screens/Onboard";
import { Home } from "@/components/screens/Home";
import { Bets } from "@/components/screens/Bets";
import { Rank } from "@/components/screens/Rank";
import { Me } from "@/components/screens/Me";
import { TabBar, type Tab } from "@/components/TabBar";
import { useMatches } from "@/hooks/useMatches";
import {
  createPlayer,
  deletePlayer,
  getStoredPlayerId,
  setStoredPlayerId,
  usePlayers,
  usePredictions,
} from "@/lib/store";
import { scorePlayers } from "@/lib/scoring";
import { supabaseConfigured } from "@/lib/supabase";
import type { Player, Prediction } from "@/lib/types";

export default function Page() {
  const { players, setPlayers } = usePlayers();
  const { predictions, setPredictions } = usePredictions();
  const { matches, error: matchError } = useMatches();
  const [meId, setMeId] = useState<string | null>(null);
  const [stage, setStage] = useState<"welcome" | "create" | "app">("welcome");
  const [tab, setTab] = useState<Tab>("home");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = getStoredPlayerId();
    if (stored) {
      setMeId(stored);
      setStage("app");
    }
  }, []);

  const me: Player | null = useMemo(
    () => (meId ? players.find((p) => p.id === meId) ?? null : null),
    [meId, players]
  );

  // If meId is set but the player no longer exists (deleted on another device), reset.
  useEffect(() => {
    if (stage === "app" && meId && players.length > 0 && !me) {
      setStoredPlayerId(null);
      setMeId(null);
      setStage("welcome");
    }
  }, [stage, meId, me, players.length]);

  const scored = useMemo(
    () => scorePlayers(players, predictions, matches),
    [players, predictions, matches]
  );

  async function handleCreate(name: string, color: string) {
    setBusy(true);
    try {
      const p = await createPlayer(name, color);
      if (!p) {
        alert(
          supabaseConfigured
            ? "Erreur Supabase. Réessaie."
            : "Supabase non configuré. Voir .env.local.example."
        );
        return;
      }
      setPlayers((prev) => [...prev, p]);
      setMeId(p.id);
      setStoredPlayerId(p.id);
      setStage("app");
    } finally {
      setBusy(false);
    }
  }

  function handlePredictionSaved(p: Prediction) {
    setPredictions((prev) => {
      const idx = prev.findIndex((x) => x.player_id === p.player_id && x.match_id === p.match_id);
      if (idx === -1) return [...prev, p];
      const copy = prev.slice();
      copy[idx] = p;
      return copy;
    });
  }

  async function handleDelete() {
    if (!me) return;
    const ok = await deletePlayer(me.id);
    if (ok) {
      setPlayers((prev) => prev.filter((p) => p.id !== me.id));
      setPredictions((prev) => prev.filter((p) => p.player_id !== me.id));
      setStoredPlayerId(null);
      setMeId(null);
      setStage("welcome");
    }
  }

  function handleLogout() {
    setStoredPlayerId(null);
    setMeId(null);
    setStage("welcome");
  }

  if (stage === "welcome") return <OnboardWelcome onNext={() => setStage("create")} />;
  if (stage === "create")
    return (
      <OnboardCreate onBack={() => setStage("welcome")} onDone={handleCreate} busy={busy} />
    );

  if (!me) {
    return (
      <div className="screen">
        <div className="scroll" style={{ paddingTop: 40, textAlign: "center" }}>
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {matchError && (
        <div
          style={{
            background: "#c8102e22",
            color: "#FF6A7D",
            padding: "8px 14px",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          API matchs indisponible : {matchError}
        </div>
      )}
      {tab === "home" && (
        <Home
          me={me}
          scored={scored}
          matches={matches}
          predictions={predictions}
          onGoto={(t) => setTab(t)}
        />
      )}
      {tab === "bets" && (
        <Bets
          me={me}
          matches={matches}
          predictions={predictions}
          onPredictionSaved={handlePredictionSaved}
        />
      )}
      {tab === "rank" && <Rank me={me} scored={scored} matches={matches} />}
      {tab === "me" && (
        <Me
          me={me}
          scored={scored}
          matches={matches}
          predictions={predictions}
          onLogout={handleLogout}
          onDelete={handleDelete}
        />
      )}
      <TabBar tab={tab} setTab={setTab} />
    </>
  );
}
