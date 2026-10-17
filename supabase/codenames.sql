-- Nom de code (Codenames) : parties partagées en temps réel.
-- À exécuter dans Supabase > SQL Editor. Ré-exécutable sans risque.
--
-- Principe de sécurité : la grille des couleurs (« clé ») n'est JAMAIS lisible par l'API.
--  - codenames_games   : état public d'une partie (mots, cartes retournées, tour, gagnant), diffusé en temps réel
--  - codenames_secrets : clé + jeton espion, sans aucun droit pour le public
-- Toutes les écritures passent par des fonctions security definer qui valident leurs entrées.
-- Retourner une carte est fait par la base : seule elle connaît la couleur.

create table if not exists public.codenames_games (
  id            text primary key check (id ~ '^[a-z0-9]{10}$'),
  lang          text not null check (lang in ('fr', 'en')),
  words         text[] not null check (array_length(words, 1) = 25),
  starting_team text not null check (starting_team in ('red', 'blue')),
  current_team  text not null check (current_team in ('red', 'blue')),
  revealed      jsonb not null default '{}'::jsonb,   -- { "index (0-24)": "red" | "blue" | "neutral" | "assassin" }
  winner        text check (winner in ('red', 'blue')),
  round         int not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.codenames_secrets (
  game_id   text primary key references public.codenames_games (id) on delete cascade,
  key       text[] not null check (array_length(key, 1) = 25),
  spy_token text not null
);

create index if not exists codenames_games_updated on public.codenames_games (updated_at);

alter table public.codenames_games enable row level security;
alter table public.codenames_secrets enable row level security;

-- Lecture publique de l'état des parties (nécessaire au temps réel) ; aucune écriture directe.
drop policy if exists "lecture des parties" on public.codenames_games;
create policy "lecture des parties" on public.codenames_games
  for select to anon, authenticated using (true);
-- codenames_secrets : aucune policy => illisible et non modifiable via l'API.

revoke all on public.codenames_games from anon, authenticated;
revoke all on public.codenames_secrets from anon, authenticated;
grant select on public.codenames_games to anon, authenticated;

-- Temps réel : diffusion des changements de codenames_games
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'codenames_games') then
    alter publication supabase_realtime add table public.codenames_games;
  end if;
end;
$$;

-- ---------- Fonctions internes ----------

-- 25 mots distincts, non vides, 24 caractères maximum
create or replace function public.codenames_clean_words(p_words text[])
returns text[]
language plpgsql
immutable
set search_path = public
as $$
declare
  cleaned text[];
begin
  if p_words is null or array_length(p_words, 1) <> 25 then
    raise exception 'il faut exactement 25 mots' using errcode = '22023';
  end if;
  select array_agg(btrim(w) order by ord) into cleaned from unnest(p_words) with ordinality as t(w, ord);
  if exists (select 1 from unnest(cleaned) w where w is null or char_length(w) not between 1 and 24) then
    raise exception 'mot invalide' using errcode = '22023';
  end if;
  if (select count(distinct lower(w)) from unnest(cleaned) w) <> 25 then
    raise exception 'mots en double' using errcode = '22023';
  end if;
  return cleaned;
end;
$$;

-- Clé aléatoire : 9 cartes pour l'équipe qui commence, 8 pour l'autre, 7 neutres, 1 assassin
create or replace function public.codenames_new_key(p_start text)
returns text[]
language sql
volatile
set search_path = public
as $$
  select array_agg(r order by random())
  from unnest(
    array_fill(p_start, array[9])
    || array_fill(case p_start when 'red' then 'blue' else 'red' end, array[8])
    || array_fill('neutral'::text, array[7])
    || array['assassin']
  ) as r;
$$;

revoke all on function public.codenames_clean_words(text[]) from public, anon, authenticated;
revoke all on function public.codenames_new_key(text) from public, anon, authenticated;

-- ---------- Fonctions appelées par l'application ----------

-- Crée une partie. Renvoie le code de la salle et le jeton espion (à ne transmettre qu'aux espions).
create or replace function public.codenames_create(p_lang text, p_words text[])
returns table (game_id text, spy_token text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id    text;
  v_token text;
  v_start text := case when random() < 0.5 then 'red' else 'blue' end;
  v_words text[] := public.codenames_clean_words(p_words);
begin
  if p_lang not in ('fr', 'en') then
    raise exception 'langue invalide' using errcode = '22023';
  end if;
  -- Ménage : les parties inactives depuis 3 jours sont supprimées (avec leur clé)
  delete from public.codenames_games where updated_at < now() - interval '3 days';
  -- Anti-saturation : création publique sans compte, on plafonne
  if (select count(*) from public.codenames_games) >= 1000 then
    raise exception 'trop de parties en cours' using errcode = 'P0001';
  end if;

  v_id := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.codenames_games (id, lang, words, starting_team, current_team)
  values (v_id, p_lang, v_words, v_start, v_start);
  insert into public.codenames_secrets (game_id, key, spy_token)
  values (v_id, public.codenames_new_key(v_start), v_token);

  return query select v_id, v_token;
end;
$$;

-- Clé des couleurs : uniquement avec le bon jeton espion
create or replace function public.codenames_key(p_id text, p_token text)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  k text[];
begin
  select s.key into k from public.codenames_secrets s where s.game_id = p_id and s.spy_token = p_token;
  if k is null then
    raise exception 'accès espion refusé' using errcode = '42501';
  end if;
  return k;
end;
$$;

-- Retourne une carte (n'importe quel joueur de la salle) : la base révèle sa couleur,
-- gère le passage de tour et la victoire.
create or replace function public.codenames_reveal(p_id text, p_index int)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  g     public.codenames_games;
  k     text[];
  role  text;
  other text;
  left_red int;
  left_blue int;
begin
  if p_index is null or p_index < 0 or p_index > 24 then
    raise exception 'carte invalide' using errcode = '22023';
  end if;
  select * into g from public.codenames_games where id = p_id for update;
  if not found then
    raise exception 'partie introuvable' using errcode = 'P0002';
  end if;
  if g.winner is not null or g.revealed ? p_index::text then
    return; -- partie finie ou carte déjà retournée : rien à faire
  end if;

  select s.key into k from public.codenames_secrets s where s.game_id = p_id;
  role := k[p_index + 1];
  other := case g.current_team when 'red' then 'blue' else 'red' end;
  g.revealed := g.revealed || jsonb_build_object(p_index::text, role);

  select count(*) filter (where r = 'red'  and not (g.revealed ? (i - 1)::text)),
         count(*) filter (where r = 'blue' and not (g.revealed ? (i - 1)::text))
    into left_red, left_blue
    from unnest(k) with ordinality as t(r, i);

  if role = 'assassin' then
    g.winner := other;                       -- l'équipe qui touche l'assassin perd
  elsif left_red = 0 then
    g.winner := 'red';                       -- tous les agents rouges trouvés
  elsif left_blue = 0 then
    g.winner := 'blue';
  elsif role <> g.current_team then
    g.current_team := other;                 -- neutre ou agent adverse : fin du tour
  end if;

  update public.codenames_games
     set revealed = g.revealed, current_team = g.current_team, winner = g.winner, updated_at = now()
   where id = p_id;
end;
$$;

-- Fin du tour volontaire (« on passe »)
create or replace function public.codenames_end_turn(p_id text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update public.codenames_games
     set current_team = case current_team when 'red' then 'blue' else 'red' end, updated_at = now()
   where id = p_id and winner is null;
  if not found and not exists (select 1 from public.codenames_games where id = p_id) then
    raise exception 'partie introuvable' using errcode = 'P0002';
  end if;
end;
$$;

-- Nouvelle manche dans la même salle (réservée aux espions) : nouveaux mots, nouvelle clé.
-- Les liens restent valables : tout le monde passe à la nouvelle grille en temps réel.
create or replace function public.codenames_new_round(p_id text, p_token text, p_words text[])
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_words text[] := public.codenames_clean_words(p_words);
  v_start text := case when random() < 0.5 then 'red' else 'blue' end;
begin
  if not exists (select 1 from public.codenames_secrets where game_id = p_id and spy_token = p_token) then
    raise exception 'accès espion refusé' using errcode = '42501';
  end if;
  update public.codenames_secrets set key = public.codenames_new_key(v_start) where game_id = p_id;
  update public.codenames_games
     set words = v_words, starting_team = v_start, current_team = v_start, revealed = '{}'::jsonb,
         winner = null, round = round + 1, updated_at = now()
   where id = p_id;
end;
$$;

revoke all on function public.codenames_create(text, text[]) from public;
revoke all on function public.codenames_key(text, text) from public;
revoke all on function public.codenames_reveal(text, int) from public;
revoke all on function public.codenames_end_turn(text) from public;
revoke all on function public.codenames_new_round(text, text, text[]) from public;
grant execute on function public.codenames_create(text, text[]) to anon, authenticated;
grant execute on function public.codenames_key(text, text) to anon, authenticated;
grant execute on function public.codenames_reveal(text, int) to anon, authenticated;
grant execute on function public.codenames_end_turn(text) to anon, authenticated;
grant execute on function public.codenames_new_round(text, text, text[]) to anon, authenticated;
