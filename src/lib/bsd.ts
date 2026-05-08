import "server-only";
import type { Match, MatchStatus } from "./types";
import { countryToFifa } from "./teams";
import { groupForCode } from "./wc-groups";

const BASE = "https://sports.bzzoiro.com/api";
const TZ = "Europe/Paris";

function key(): string {
  const k = process.env.BSD_API_KEY;
  if (!k) throw new Error("BSD_API_KEY missing");
  return k;
}

type FetchOpts = { revalidate?: number };

async function bsdGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  opts: FetchOpts = {}
): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Token ${key()}`, Accept: "application/json" },
    next: opts.revalidate != null ? { revalidate: opts.revalidate } : { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`BSD ${res.status} ${url.pathname}`);
  return (await res.json()) as T;
}

/* ---------- League discovery ---------- */

type BsdLeague = {
  id: number | string;
  name?: string;
  country?: string;
  current_season?: { id: number | string; name?: string; year?: number } | null;
};

type Paginated<T> = { count?: number; next?: string | null; results?: T[] } | T[];

function unwrap<T>(data: Paginated<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

let leagueCache: { id: string; seasonId: string | null; at: number } | null = null;

export async function getWorldCupLeague(): Promise<{ id: string; seasonId: string | null }> {
  if (leagueCache && Date.now() - leagueCache.at < 24 * 60 * 60_000) {
    return { id: leagueCache.id, seasonId: leagueCache.seasonId };
  }
  const envId = process.env.BSD_WORLD_CUP_LEAGUE_ID;
  const envSeason = process.env.BSD_WORLD_CUP_SEASON_ID ?? null;
  if (envId) {
    leagueCache = { id: envId, seasonId: envSeason, at: Date.now() };
    return { id: envId, seasonId: envSeason };
  }
  const list = await bsdGet<Paginated<BsdLeague>>("/leagues/", {}, { revalidate: 86400 });
  const arr = unwrap(list);
  const target =
    arr.find((l) => /world cup|coupe du monde/i.test(`${l.name ?? ""}`) && /(2026|26)/.test(`${l.name ?? ""}`)) ??
    arr.find((l) => /world cup|coupe du monde/i.test(`${l.name ?? ""}`));
  if (!target) throw new Error("BSD: World Cup league not found in /leagues/");
  const seasonId =
    typeof target.current_season === "object" && target.current_season !== null
      ? String(target.current_season.id)
      : null;
  leagueCache = { id: String(target.id), seasonId, at: Date.now() };
  return { id: String(target.id), seasonId };
}

/* ---------- Standings (used to derive group letter per team) ---------- */

type StandingRow = {
  position?: number;
  team?: string;
  team_id?: number | string;
  group?: string | null;
  group_name?: string | null;
};

type StandingsGroup = { name?: string; group?: string; group_name?: string; standings: StandingRow[] };
type StandingsResponse = {
  standings?: StandingRow[] | StandingsGroup[];
  groups?: StandingsGroup[];
};

let groupMapCache: { map: Map<string, string>; at: number } | null = null;

/**
 * Build a map: country/team-name → group letter (A..L). Uses /api/leagues/<id>/standings/.
 * Cached 1h to avoid hammering the endpoint.
 */
export async function getGroupMap(): Promise<Map<string, string>> {
  if (groupMapCache && Date.now() - groupMapCache.at < 60 * 60_000) return groupMapCache.map;
  const { id } = await getWorldCupLeague();
  const map = new Map<string, string>();
  let data: StandingsResponse;
  try {
    data = await bsdGet<StandingsResponse>(`/leagues/${id}/standings/`, {}, { revalidate: 3600 });
  } catch {
    // Standings 404 jusqu'à ce que le tournoi commence — pas grave, on a le fallback wc-groups.ts.
    groupMapCache = { map, at: Date.now() };
    return map;
  }

  // Case 1: nested groups
  const nested: StandingsGroup[] | null =
    data.groups ??
    (Array.isArray(data.standings) &&
    data.standings.length > 0 &&
    "standings" in (data.standings[0] as object)
      ? (data.standings as StandingsGroup[])
      : null);
  if (nested) {
    for (const g of nested) {
      const letter = (g.group_name ?? g.group ?? "").match(/[A-L]/i)?.[0]?.toUpperCase() ?? "";
      for (const row of g.standings ?? []) {
        if (row.team) map.set(row.team.toLowerCase(), letter);
      }
    }
  } else if (Array.isArray(data.standings)) {
    for (const row of data.standings as StandingRow[]) {
      const letter = (row.group_name ?? row.group ?? "").match(/[A-L]/i)?.[0]?.toUpperCase() ?? "";
      if (row.team) map.set(row.team.toLowerCase(), letter);
    }
  }

  groupMapCache = { map, at: Date.now() };
  return map;
}

/* ---------- Event normalization ---------- */

type BsdTeamObj = {
  id?: number | string;
  name?: string;
  short_name?: string;
  country?: string;
};

type BsdEvent = {
  id: number | string;
  league?: { id?: number | string; name?: string } | number | string;
  season?: { id?: number | string; name?: string } | number | string;
  home_team?: string;
  away_team?: string;
  home_team_obj?: BsdTeamObj | null;
  away_team_obj?: BsdTeamObj | null;
  home_team_id?: number | string | null;
  away_team_id?: number | string | null;
  event_date?: string;
  round_number?: number | null;
  status?: string;
  home_score?: number | null;
  away_score?: number | null;
  current_minute?: number | null;
  period?: string | null;
  venue?: string | null;
  stadium?: string | null;
  city?: string | null;
};

function normalizeStatus(s: string | undefined): MatchStatus {
  switch ((s ?? "").toLowerCase()) {
    case "inprogress":
    case "1st_half":
    case "halftime":
    case "2nd_half":
    case "et":
    case "live":
      return "live";
    case "finished":
    case "ft":
    case "completed":
      return "finished";
    default:
      return "open";
  }
}

function teamCode(name: string | undefined, obj: BsdTeamObj | null | undefined): string {
  // For international teams, BSD `home_team` IS the country name (e.g. "Brazil").
  // Try country from team_obj first (most reliable for national teams), then the team name itself.
  return countryToFifa(obj?.country) || countryToFifa(name) || "";
}

function deriveDayFromDate(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 1;
  const day = d.getUTCDate();
  if (day <= 17) return 1;
  if (day <= 23) return 2;
  return 3;
}

export function normalizeEvent(e: BsdEvent, groupMap?: Map<string, string>): Match {
  const kickoff_utc = e.event_date ?? new Date().toISOString();
  const homeName = e.home_team ?? e.home_team_obj?.name ?? "";
  const awayName = e.away_team ?? e.away_team_obj?.name ?? "";
  const home = teamCode(homeName, e.home_team_obj);
  const away = teamCode(awayName, e.away_team_obj);
  const day =
    typeof e.round_number === "number" && e.round_number > 0
      ? e.round_number
      : deriveDayFromDate(kickoff_utc);
  const groupFromApi =
    groupMap?.get(homeName.toLowerCase()) ?? groupMap?.get(awayName.toLowerCase()) ?? "";
  const group = groupFromApi || groupForCode(home) || groupForCode(away) || "";

  const homeId =
    e.home_team_obj?.id != null
      ? String(e.home_team_obj.id)
      : e.home_team_id != null
        ? String(e.home_team_id)
        : undefined;
  const awayId =
    e.away_team_obj?.id != null
      ? String(e.away_team_obj.id)
      : e.away_team_id != null
        ? String(e.away_team_id)
        : undefined;
  const venue = e.venue ?? e.stadium ?? undefined;
  const city = e.city ?? undefined;

  return {
    id: String(e.id),
    group,
    day,
    kickoff_utc,
    city,
    home,
    away,
    home_name: homeName,
    away_name: awayName,
    home_flag: undefined,
    away_flag: undefined,
    home_team_id: homeId,
    away_team_id: awayId,
    venue: venue ?? undefined,
    status: normalizeStatus(e.status),
    home_score: e.home_score ?? null,
    away_score: e.away_score ?? null,
    minute: e.current_minute != null ? String(e.current_minute) : null,
  };
}

/* ---------- Public fetchers ---------- */

async function fetchAllPages<T>(
  path: string,
  params: Record<string, string | number | undefined>
): Promise<T[]> {
  const collected: T[] = [];
  let offset = 0;
  const limit = 200; // max
  for (let page = 0; page < 10; page++) {
    const data = await bsdGet<Paginated<T>>(path, { ...params, limit, offset }, { revalidate: 0 });
    const arr = unwrap(data);
    collected.push(...arr);
    const hasNext = !Array.isArray(data) && data.next != null;
    if (!hasNext || arr.length < limit) break;
    offset += limit;
  }
  return collected;
}

export async function fetchGroupMatches(): Promise<Match[]> {
  const { id: league } = await getWorldCupLeague();
  let groupMap: Map<string, string>;
  try {
    groupMap = await getGroupMap();
  } catch {
    groupMap = new Map();
  }
  const events = await fetchAllPages<BsdEvent>("/events/", {
    league,
    date_from: "2026-06-11",
    date_to: "2026-07-01",
    tz: TZ,
  });
  const normalized = events.map((e) => normalizeEvent(e, groupMap));
  const dropped = normalized.filter((m) => !m.id || !m.home || !m.away);
  if (dropped.length > 0) {
    const samples = dropped.slice(0, 10).map((m) => `${m.home_name || "?"} vs ${m.away_name || "?"}`);
    console.warn(`[bsd] ${dropped.length} match(s) dropped — unmapped country names:`, samples);
  }
  return normalized
    .filter((m) => m.id && m.home && m.away)
    .sort(
      (a, b) =>
        a.day - b.day ||
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
    );
}

export async function fetchLiveMatches(): Promise<Match[]> {
  let groupMap: Map<string, string>;
  try {
    groupMap = await getGroupMap();
  } catch {
    groupMap = new Map();
  }
  const data = await bsdGet<Paginated<BsdEvent>>("/live/", { tz: TZ }, { revalidate: 0 });
  const events = unwrap(data);
  return events.map((e) => normalizeEvent(e, groupMap)).filter((m) => m.id && m.home && m.away);
}

export async function fetchPredictions(eventId: string): Promise<unknown> {
  return bsdGet<unknown>("/predictions/", { event: eventId }, { revalidate: 30 * 60 });
}

export async function fetchStandings(): Promise<unknown> {
  const { id } = await getWorldCupLeague();
  return bsdGet<unknown>(`/leagues/${id}/standings/`, {}, { revalidate: 60 * 60 });
}

export async function fetchTopScorers(): Promise<unknown> {
  const { id, seasonId } = await getWorldCupLeague();
  return bsdGet<unknown>(
    "/player-stats/",
    { league: id, season: seasonId ?? undefined, ordering: "-goals" },
    { revalidate: 60 * 60 }
  );
}

export async function fetchBroadcasts(eventId: string): Promise<unknown> {
  return bsdGet<unknown>("/broadcasts/", { event: eventId }, { revalidate: 60 * 60 });
}

/* ---------- Event details (full payload: home_form, away_form, head_to_head) ---------- */

/**
 * Full event payload including aggregate `home_form` / `away_form` stats and `head_to_head`.
 * Per BSD docs, `/api/events/{id}/` returns recent team stats (wins, draws, losses, goals,
 * xG, shot accuracy, pass rate, duel rate, clean sheet %) plus an h2h block.
 */
export async function fetchEventDetails(eventId: string): Promise<unknown> {
  return bsdGet<unknown>(`/events/${eventId}/`, { full: "true" }, { revalidate: 60 * 10 });
}
