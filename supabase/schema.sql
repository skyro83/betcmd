-- La Poule 2026 — Supabase schema
create extension if not exists "pgcrypto";

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#C8102E',
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  match_id text not null,
  home_score int not null check (home_score >= 0),
  away_score int not null check (away_score >= 0),
  created_at timestamptz not null default now(),
  unique (player_id, match_id)
);

create index if not exists predictions_match_idx on predictions(match_id);
create index if not exists predictions_player_idx on predictions(player_id);

-- Cache server-side des matchs WC2026. Source de vérité unique pour les clients.
-- Alimentée par le job serveur (sync.ts) — jamais par les clients.
create table if not exists matches (
  id text primary key,
  match_number int,
  round text not null default 'group',
  group_name text,
  day int not null default 1,
  kickoff_utc timestamptz not null,
  city text,
  home_code text not null,
  away_code text not null,
  home_name text,
  away_name text,
  home_flag text,
  away_flag text,
  status text not null default 'open' check (status in ('open','live','finished')),
  home_score int,
  away_score int,
  minute text,
  updated_at timestamptz not null default now()
);

create index if not exists matches_status_idx on matches(status);
create index if not exists matches_day_idx on matches(day);

-- RLS : pas d'auth (identification par nom). Les écritures dans matches passent
-- par le service_role côté serveur uniquement.
alter table players enable row level security;
alter table predictions enable row level security;
alter table matches enable row level security;

drop policy if exists "players anon all" on players;
create policy "players anon all" on players
  for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "predictions anon all" on predictions;
create policy "predictions anon all" on predictions
  for all to anon, authenticated
  using (true) with check (true);

-- Lecture seule pour les clients sur matches.
drop policy if exists "matches anon read" on matches;
create policy "matches anon read" on matches
  for select to anon, authenticated using (true);

-- Realtime : publier les trois tables sur la publication supabase_realtime.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table matches;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'predictions'
  ) then
    alter publication supabase_realtime add table predictions;
  end if;
end $$;
