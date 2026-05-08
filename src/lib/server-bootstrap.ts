import "server-only";
import { pollLiveMatches, refreshAllFixtures } from "./sync";

let started = false;

const POLL_MS = 60_000;
const REFRESH_MS = 60 * 60_000;

/**
 * Lance les jobs de fond une seule fois au démarrage du serveur Node.
 *
 * - Refresh complet des fixtures au boot, puis toutes les heures (cache fixtures).
 * - Poll des matchs live toutes les 60s. Le job lui-même décide s'il y a quelque
 *   chose à mettre à jour (cf. sync.pollLiveMatches), donc on tourne en boucle
 *   sans condition externe.
 *
 * Sur Vercel/serverless, instrumentation.ts fait son job mais setInterval ne
 * survit pas à l'invocation. Utiliser Vercel Cron (vercel.json) pour appeler
 * /api/cron/refresh et /api/cron/poll en prod.
 */
export function startBackgroundJobs() {
  if (started) return;
  started = true;

  refreshAllFixtures()
    .then((r) => console.log(`[sync] bootstrap fixtures: ${r.count}`))
    .catch((e) => console.error("[sync] refresh failed", e));

  setInterval(() => {
    refreshAllFixtures().catch((e) => console.error("[sync] hourly refresh failed", e));
  }, REFRESH_MS);

  setInterval(() => {
    pollLiveMatches()
      .then((r) => {
        if (r.updated > 0) console.log(`[sync] live updated: ${r.updated}`);
      })
      .catch((e) => console.error("[sync] poll failed", e));
  }, POLL_MS);

  console.log("[sync] background jobs started (poll 60s · refresh 1h)");
}
