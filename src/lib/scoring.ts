import type { Match, Prediction, Player, ScoredPlayer } from "./types";

export function pointsForPrediction(
  pred: { home_score: number; away_score: number },
  match: Pick<Match, "home_score" | "away_score" | "status">
): number {
  if (match.status !== "finished" || match.home_score == null || match.away_score == null) return 0;
  if (pred.home_score === match.home_score && pred.away_score === match.away_score) return 3;
  const predOutcome = Math.sign(pred.home_score - pred.away_score);
  const realOutcome = Math.sign(match.home_score - match.away_score);
  return predOutcome === realOutcome ? 1 : 0;
}

export function scorePlayers(
  players: Player[],
  predictions: Prediction[],
  matches: Match[]
): ScoredPlayer[] {
  const matchById = new Map(matches.map((m) => [m.id, m]));
  return players
    .map((p) => {
      const mine = predictions.filter((pr) => pr.player_id === p.id);
      let pts = 0;
      let exact = 0;
      let good = 0;
      for (const pr of mine) {
        const m = matchById.get(pr.match_id);
        if (!m) continue;
        const got = pointsForPrediction(pr, m);
        pts += got;
        if (got === 3) exact++;
        else if (got === 1) good++;
      }
      return { ...p, pts, exact, good };
    })
    .sort((a, b) => b.pts - a.pts || b.exact - a.exact);
}
