# La Poule 2026

Pronostics Coupe du Monde 2026 — Next.js + Supabase + [BSD Sports Data](https://sports.bzzoiro.com/docs/).

## Règles
- Mise fixe : **10 €** par joueur. Cagnotte = `nb joueurs × 10€`.
- **+1 pt** : bon résultat (V/N/D)
- **+3 pts** : score exact
- Le 1er du classement empoche tout.

## Architecture des données

```
BSD API  ──[server only, jamais le client]──▶  Supabase (matches/players/predictions)
                                                       │
                                              Realtime │ (WebSocket)
                                                       ▼
                                                  clients React
```

- **Aucun appel à BSD depuis le navigateur.** La clé `BSD_API_KEY` reste côté serveur.
- **Un seul job serveur** poll BSD `/live/?tz=Europe/Paris` toutes les **60 s** pour les matchs en cours. Les écritures partent en Supabase.
- **Fixtures** (matchs non commencés) : fetch initial au démarrage via `/events/?league=…&date_from=…&date_to=…&tz=Europe/Paris`, puis re-sync toutes les **heures**.
- **Clients** : abonnés via **Supabase Realtime** aux tables `matches`, `players`, `predictions`. Aucun polling côté browser.

### Endpoints BSD utilisés

| Endpoint | Usage | Cache |
|---|---|---|
| `GET /api/leagues/` | Découverte de la ligue WC2026 (ID) | 24 h |
| `GET /api/events/?league=…&date_from=2026-06-11&date_to=2026-07-01&tz=Europe/Paris` | Fixtures phase de poules | 1 h (job serveur) |
| `GET /api/live/?tz=Europe/Paris` | Scores live | 60 s (job serveur) |
| `GET /api/predictions/?event=<id>` | Probas ML V/N/D | 30 min — exposé via `/api/predictions/[eventId]` |
| `GET /api/leagues/<id>/standings/` | Classement des groupes | 1 h — exposé via `/api/standings` |
| `GET /api/player-stats/?league=<id>&season=<id>&ordering=-goals` | Top buteurs | 1 h — exposé via `/api/top-scorers` |
| `GET /api/broadcasts/?event=<id>` | Chaînes TV | 1 h — exposé via `/api/broadcasts/[eventId]` |

## Setup

```bash
cp .env.local.example .env.local
# Renseigner :
#   WC2026_API_KEY
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY  (clé publishable)
#   SUPABASE_SERVICE_ROLE_KEY      (clé secret — uniquement côté serveur)
#   CRON_SECRET                    (utilisé par /api/cron/*)
npm install
npm run dev
```

### Supabase
Exécuter `supabase/schema.sql` dans le SQL Editor. Crée :
- `players` / `predictions` / `matches`
- RLS + policies
- `alter publication supabase_realtime add table ...` pour les 3 tables

### Vérifier que ça tourne
- Au démarrage de `next dev`, tu dois voir dans la console serveur :
  ```
  [sync] background jobs started (poll 60s · refresh 1h)
  [sync] bootstrap fixtures: 72
  ```
- Dans la table `matches` Supabase : 72 lignes de phase de poules.
- Dans le navigateur : aucune requête vers wc2026api ; uniquement WebSocket vers Supabase.

## Jobs de fond

`instrumentation.ts` (Next.js standard) lance `startBackgroundJobs()` côté serveur Node :
- Refresh complet des fixtures au boot, puis toutes les heures.
- Poll des matchs live toutes les 60 s — n'écrit en Supabase que pour les matchs `live` ou la transition `live→finished`.

### En production (Vercel / serverless)
`setInterval` ne survit pas entre les invocations. Utiliser **Vercel Cron** (déjà configuré dans `vercel.json`) :
- `GET /api/cron/refresh` → toutes les heures
- `GET /api/cron/poll` → toutes les minutes

Les deux endpoints exigent le header `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron l'envoie automatiquement quand `CRON_SECRET` est dans les env vars Vercel).

## Tester avant le Mondial
BSD ne fournit pas de match factice de test. Pour valider le pipeline live :
1. Insérer manuellement un match `live` dans Supabase (`update matches set status='live', home_score=1, away_score=0 where id='…'`).
2. Vérifier dans le navigateur (avec un client connecté) que la "Live hero" apparaît dans le Salon — preuve que Realtime fonctionne de bout en bout.
3. Pour tester `pollLiveMatches` réellement : appeler `/api/cron/poll` avec le bon header `Authorization: Bearer ${CRON_SECRET}` et regarder les logs serveur.

## Stack
- Next.js 14 App Router · TypeScript · Tailwind · Supabase JS (Realtime)

## Structure
- `instrumentation.ts` — bootstrap des jobs serveur (Next.js)
- `src/lib/server-bootstrap.ts` — `setInterval` poll/refresh
- `src/lib/sync.ts` — `refreshAllFixtures` + `pollLiveMatches`
- `src/lib/bsd.ts` — client BSD API (server only) + normalizer events → `Match`
- `src/lib/match-utils.ts` — helpers partagés (isLocked)
- `src/lib/supabase-admin.ts` — client Supabase service_role (server only)
- `src/lib/supabase.ts` — client Supabase anon (browser)
- `src/lib/store.ts` — hooks Realtime `usePlayers` / `usePredictions`
- `src/hooks/useMatches.ts` — Realtime sur `matches`
- `src/app/api/cron/{refresh,poll}/route.ts` — endpoints cron
- `src/app/api/predictions/[eventId]/route.ts` — proxy ML predictions (cache 30 min)
- `src/app/api/standings/route.ts` — proxy classement (cache 1 h)
- `src/app/api/top-scorers/route.ts` — proxy top buteurs (cache 1 h)
- `src/app/api/broadcasts/[eventId]/route.ts` — proxy chaînes TV (cache 1 h)
- `src/components/screens/*` — Onboard / Home / Bets / Rank / Me
- `src/lib/scoring.ts` — barème +1 / +3
