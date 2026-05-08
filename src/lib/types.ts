export type MatchStatus = "open" | "live" | "finished";

export type Match = {
  id: string;
  group: string;
  day: number;
  kickoff_utc: string;
  city?: string;
  home: string; // 3-letter code
  away: string;
  home_name?: string; // English name from API, used as fallback
  away_name?: string;
  home_flag?: string; // flag URL from API
  away_flag?: string;
  home_team_id?: string;
  away_team_id?: string;
  venue?: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  minute?: string | null;
};

export type Player = {
  id: string;
  name: string;
  color: string;
  paid: boolean;
  created_at: string;
};

export type Prediction = {
  id: string;
  player_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
};

export type ScoredPlayer = Player & {
  pts: number;
  exact: number;
  good: number;
};
