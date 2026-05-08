"use client";
import { useEffect, useMemo, useRef, useId } from "react";
import { Flag } from "./Flag";
import { flagUrl, teamNameFr, teamAbbr } from "@/lib/teams";
import type { Match } from "@/lib/types";
import { useMatchDetails } from "@/hooks/useMatchDetails";

/* ---------- BSD payload types (what we actually consume) ---------- */

type BroadcastItem = {
  channel_name?: string;
  channel_link?: string;
  country_code?: string;
  scheduled_start_time?: string;
};

type Prediction = {
  prob_home_win?: number | null;
  prob_draw?: number | null;
  prob_away_win?: number | null;
  expected_home_goals?: number | null;
  expected_away_goals?: number | null;
  most_likely_score?: string | null;
  predicted_result?: string | null;
  confidence?: number | null;
  prob_btts_yes?: number | null;
  prob_over_2_5?: number | null;
};

type FormStats = {
  matches_played?: number | null;
  wins?: number | null;
  draws?: number | null;
  losses?: number | null;
  goals_scored?: number | null;
  goals_conceded?: number | null;
  xg_for?: number | null;
  xg_against?: number | null;
  clean_sheet_pct?: number | null;
  shot_accuracy?: number | null;
  pass_rate?: number | null;
  duel_win_rate?: number | null;
};

type NamedRef = { name?: string; short_name?: string; city?: string };

type H2HMatch = {
  id?: number | string;
  event_date?: string;
  date?: string;
  home_team?: string | NamedRef;
  away_team?: string | NamedRef;
  home_score?: number | null;
  away_score?: number | null;
};

type EventDetails = {
  venue?: string | NamedRef | null;
  stadium?: string | NamedRef | null;
  city?: string | null;
  home_coach?: string | { name?: string; short_name?: string } | null;
  away_coach?: string | { name?: string; short_name?: string } | null;
  home_form?: FormStats | null;
  away_form?: FormStats | null;
  head_to_head?: H2HMatch[] | { matches?: H2HMatch[]; results?: H2HMatch[] } | null;
};

/* ---------- Helpers ---------- */

function asArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object" && Array.isArray((v as { results?: T[] }).results)) {
    return (v as { results: T[] }).results;
  }
  return [];
}

function pickPrediction(raw: unknown): Prediction | null {
  if (!raw) return null;
  const arr = asArray<Prediction>(raw);
  if (arr.length > 0) return arr[0];
  if (typeof raw === "object") return raw as Prediction;
  return null;
}

function extractH2H(details: EventDetails | null | undefined): H2HMatch[] {
  if (!details?.head_to_head) return [];
  const h2h = details.head_to_head;
  if (Array.isArray(h2h)) return h2h;
  if (Array.isArray(h2h.matches)) return h2h.matches;
  if (Array.isArray(h2h.results)) return h2h.results;
  return [];
}

function toPct(p?: number | null): number | null {
  if (p == null) return null;
  if (p <= 1) return Math.round(p * 100);
  return Math.round(p);
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
}

function num(n: number | null | undefined, digits = 1): string {
  if (n == null) return "—";
  return n.toFixed(digits);
}

function coachName(c: EventDetails["home_coach"]): string | null {
  if (!c) return null;
  if (typeof c === "string") return c;
  return c.short_name ?? c.name ?? null;
}

function nameOf(v: string | NamedRef | null | undefined): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.short_name ?? v.name ?? "";
}

function safeHttpUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/* ---------- Component ---------- */

export function MatchDetailsSheet({ match, onClose }: { match: Match | null; onClose: () => void }) {
  const eventId = match?.id ?? null;
  const { data, loading } = useMatchDetails(eventId);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!match) return;
    previousFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 30);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      previousFocusRef.current?.focus?.();
    };
  }, [match, onClose]);

  const broadcasts = useMemo(() => asArray<BroadcastItem>(data?.broadcasts), [data]);
  const prediction = useMemo(() => pickPrediction(data?.predictions), [data]);
  const details = (data?.details as EventDetails | null) ?? null;
  const h2h = useMemo(() => extractH2H(details), [details]);

  if (!match) return null;

  const date = new Date(match.kickoff_utc);
  const dateStr = date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
  const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const homePct = toPct(prediction?.prob_home_win);
  const drawPct = toPct(prediction?.prob_draw);
  const awayPct = toPct(prediction?.prob_away_win);
  const hasPrediction = homePct != null || drawPct != null || awayPct != null;

  const venueStr = nameOf(details?.venue) || nameOf(details?.stadium) || match.venue || "";
  const city = details?.city ?? match.city ?? "";
  const cityLine = [venueStr, city].filter(Boolean).join(" · ");

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grab" />
        <button
          ref={closeRef}
          className="sheet-close"
          onClick={onClose}
          aria-label="Fermer la fiche match"
        >
          ✕
        </button>
        <h2 id={titleId} className="visually-hidden">
          {teamNameFr(match.home, match.home_name)} contre {teamNameFr(match.away, match.away_name)}
        </h2>

        <div className="sheet-header">
          <div className="sheet-meta">
            <span className="cap">{dateStr}</span>
            <span className="dot-sep">·</span>
            <span className="cap">{timeStr}</span>
            {match.group && (
              <>
                <span className="dot-sep">·</span>
                <span className="cap">Groupe {match.group}</span>
              </>
            )}
          </div>
          {cityLine && <div className="sheet-venue">{cityLine}</div>}

          <div className="sheet-teams">
            <div className="sheet-team">
              <Flag url={flagUrl(match.home, match.home_flag)} code={match.home} size={56} />
              <div className="nm">{teamNameFr(match.home, match.home_name)}</div>
              {coachName(details?.home_coach) && <div className="coach">{coachName(details?.home_coach)}</div>}
            </div>
            <div className="sheet-score">
              {match.status !== "open" && match.home_score != null && match.away_score != null ? (
                <>
                  <span>{match.home_score}</span>
                  <span className="sep">–</span>
                  <span>{match.away_score}</span>
                </>
              ) : (
                <span className="vs">VS</span>
              )}
              {match.status === "live" && (
                <small className="pill live" style={{ marginTop: 6 }}>
                  {match.minute ?? "LIVE"}
                </small>
              )}
              {match.status === "finished" && (
                <small className="pill done" style={{ marginTop: 6 }}>
                  Terminé
                </small>
              )}
            </div>
            <div className="sheet-team">
              <Flag url={flagUrl(match.away, match.away_flag)} code={match.away} size={56} />
              <div className="nm">{teamNameFr(match.away, match.away_name)}</div>
              {coachName(details?.away_coach) && <div className="coach">{coachName(details?.away_coach)}</div>}
            </div>
          </div>
        </div>

        <div className="sheet-body">
          <Section title="Diffusion">
            {loading && !data ? (
              <Skeleton lines={2} />
            ) : broadcasts.length === 0 ? (
              <Empty text="Diffusion non communiquée." />
            ) : (
              <ul className="bcast-list">
                {broadcasts.slice(0, 30).map((b, i) => {
                  const label = b.channel_name ?? "Chaîne";
                  const country = b.country_code?.toUpperCase();
                  const safeLink = safeHttpUrl(b.channel_link);
                  const inner = (
                    <>
                      <div className="bcast-name">{label}</div>
                      {country && <div className="bcast-sub">{country}</div>}
                    </>
                  );
                  return (
                    <li key={i} className="bcast" style={{ animationDelay: `${i * 30}ms` }}>
                      {safeLink ? (
                        <a href={safeLink} target="_blank" rel="noreferrer noopener">
                          {inner}
                        </a>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Pronostic BSD">
            {loading && !data ? (
              <Skeleton lines={2} />
            ) : !hasPrediction ? (
              <Empty text="Pas de pronostic disponible." />
            ) : (
              <>
                <div className="probas">
                  <ProbaBar label={teamAbbr(match.home)} pct={homePct} variant="home" />
                  <ProbaBar label="N" pct={drawPct} variant="draw" />
                  <ProbaBar label={teamAbbr(match.away)} pct={awayPct} variant="away" />
                </div>
                {prediction && <PredictionExtras prediction={prediction} />}
              </>
            )}
          </Section>

          <Section title="Forme récente">
            {loading && !data ? (
              <Skeleton lines={3} />
            ) : !details?.home_form && !details?.away_form ? (
              <Empty text="Pas de stats de forme." />
            ) : (
              <FormCompare
                home={details?.home_form}
                away={details?.away_form}
                homeLabel={teamAbbr(match.home)}
                awayLabel={teamAbbr(match.away)}
              />
            )}
          </Section>

          <Section title="Confrontations directes">
            {loading && !data ? (
              <Skeleton lines={3} />
            ) : h2h.length === 0 ? (
              <Empty text="Aucune rencontre récente trouvée." />
            ) : (
              <ul className="h2h-list">
                {h2h.slice(0, 6).map((h, i) => (
                  <li key={String(h.id ?? i)} className="h2h-row">
                    <span className="h2h-date">{formatDate(h.event_date ?? h.date)}</span>
                    <span className="h2h-teams">
                      <span>{nameOf(h.home_team)}</span>
                      <b className="num">
                        {h.home_score ?? "-"} – {h.away_score ?? "-"}
                      </b>
                      <span>{nameOf(h.away_team)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function PredictionExtras({ prediction }: { prediction: Prediction }) {
  const ehg = prediction.expected_home_goals;
  const eag = prediction.expected_away_goals;
  const score =
    prediction.most_likely_score ??
    (ehg != null && eag != null ? `${Math.round(ehg)} – ${Math.round(eag)}` : null);
  const xgLabel =
    ehg != null || eag != null ? `${num(ehg)} – ${num(eag)}` : null;
  return (
    <div className="pred-extras">
      {score && <ExtraRow label="Score le + probable" value={score} />}
      {xgLabel && <ExtraRow label="xG attendus" value={xgLabel} />}
      {prediction.prob_btts_yes != null && (
        <ExtraRow label="Les 2 marquent" value={`${toPct(prediction.prob_btts_yes)}%`} />
      )}
      {prediction.prob_over_2_5 != null && (
        <ExtraRow label="+2,5 buts" value={`${toPct(prediction.prob_over_2_5)}%`} />
      )}
      {prediction.confidence != null && (
        <ExtraRow label="Confiance" value={`${toPct(prediction.confidence)}%`} />
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="sheet-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="sheet-empty">{text}</div>;
}

function Skeleton({ lines }: { lines: number }) {
  return (
    <div className="sk-block">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="sk-line" />
      ))}
    </div>
  );
}

function ProbaBar({
  label,
  pct,
  variant,
}: {
  label: string;
  pct: number | null;
  variant: "home" | "draw" | "away";
}) {
  const safe = pct ?? 0;
  return (
    <div className={`proba ${variant}`}>
      <div className="proba-head">
        <span>{label}</span>
        <b className="num">{pct != null ? `${pct}%` : "—"}</b>
      </div>
      <div className="proba-bar">
        <i style={{ width: `${Math.max(0, Math.min(100, safe))}%` }} />
      </div>
    </div>
  );
}

function ExtraRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="extra-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function WdlChips({ s }: { s?: FormStats | null }) {
  if (!s) return <span className="form-empty">—</span>;
  return (
    <span className="wdl">
      <span className="wdl-chip W" title="Victoires">
        <span className="wdl-ic">✓</span>
        {s.wins ?? 0}
      </span>
      <span className="wdl-chip D" title="Nuls">
        <span className="wdl-ic">=</span>
        {s.draws ?? 0}
      </span>
      <span className="wdl-chip L" title="Défaites">
        <span className="wdl-ic">✕</span>
        {s.losses ?? 0}
      </span>
    </span>
  );
}

function FormCompare({
  home,
  away,
  homeLabel,
  awayLabel,
}: {
  home: FormStats | null | undefined;
  away: FormStats | null | undefined;
  homeLabel: string;
  awayLabel: string;
}) {
  const goals = (s?: FormStats | null) =>
    s ? `${s.goals_scored ?? 0} – ${s.goals_conceded ?? 0}` : "—";
  const xg = (s?: FormStats | null) =>
    s && (s.xg_for != null || s.xg_against != null)
      ? `${num(s.xg_for, 1)} – ${num(s.xg_against, 1)}`
      : "—";
  const cs = (s?: FormStats | null) =>
    s?.clean_sheet_pct != null ? `${toPct(s.clean_sheet_pct)}%` : "—";

  type Row = { label: string; h: React.ReactNode; a: React.ReactNode };
  const rows: Row[] = [
    { label: "Résultats", h: <WdlChips s={home} />, a: <WdlChips s={away} /> },
    { label: "Buts (pour/contre)", h: <b className="num">{goals(home)}</b>, a: <b className="num">{goals(away)}</b> },
  ];
  if ((home?.xg_for ?? home?.xg_against) != null || (away?.xg_for ?? away?.xg_against) != null) {
    rows.push({ label: "xG (pour/contre)", h: <b className="num">{xg(home)}</b>, a: <b className="num">{xg(away)}</b> });
  }
  if (home?.clean_sheet_pct != null || away?.clean_sheet_pct != null) {
    rows.push({ label: "Clean sheets", h: <b className="num">{cs(home)}</b>, a: <b className="num">{cs(away)}</b> });
  }

  return (
    <div className="form-table">
      <div className="form-table-head">
        <span />
        <span>{homeLabel}</span>
        <span>{awayLabel}</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="form-table-row">
          <span className="lbl">{r.label}</span>
          <span className="cell">{r.h}</span>
          <span className="cell">{r.a}</span>
        </div>
      ))}
    </div>
  );
}
