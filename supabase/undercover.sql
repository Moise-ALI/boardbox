-- Undercover : associations proposées par la communauté, validées par un admin.
-- À exécuter une fois dans Supabase > SQL Editor. Ré-exécutable sans risque.
-- L'e-mail de l'admin n'est PAS dans ce fichier (dépôt public) : il s'ajoute à part,
-- voir la fin du fichier.

-- Admins : identifiés par l'e-mail vérifié de leur session Supabase Auth
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- aucune policy : la table n'est lisible par personne via l'API

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Paires de mots
create table if not exists public.undercover_pairs (
  id          bigint generated always as identity primary key,
  word_a      text not null check (char_length(btrim(word_a)) between 1 and 30),
  word_b      text not null check (char_length(btrim(word_b)) between 1 and 30),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  check (lower(btrim(word_a)) <> lower(btrim(word_b)))
);

-- Une même paire (dans un sens ou dans l'autre) ne peut exister qu'une fois
create unique index if not exists undercover_pairs_unique
  on public.undercover_pairs (least(lower(btrim(word_a)), lower(btrim(word_b))), greatest(lower(btrim(word_a)), lower(btrim(word_b))));
create index if not exists undercover_pairs_status on public.undercover_pairs (status);

alter table public.undercover_pairs enable row level security;

drop policy if exists "lecture des paires validees" on public.undercover_pairs;
create policy "lecture des paires validees" on public.undercover_pairs
  for select to anon, authenticated
  using (status = 'approved' or public.is_admin());

drop policy if exists "proposer une paire" on public.undercover_pairs;
create policy "proposer une paire" on public.undercover_pairs
  for insert to anon, authenticated
  with check (status = 'pending' and reviewed_at is null);

drop policy if exists "ajout direct par admin" on public.undercover_pairs;
create policy "ajout direct par admin" on public.undercover_pairs
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "moderation par admin" on public.undercover_pairs;
create policy "moderation par admin" on public.undercover_pairs
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "suppression par admin" on public.undercover_pairs;
create policy "suppression par admin" on public.undercover_pairs
  for delete to authenticated
  using (public.is_admin());

-- Droits de base de l'API (les policies ci-dessus filtrent ensuite ligne par ligne)
grant select, insert on public.undercover_pairs to anon;
grant select, insert, update, delete on public.undercover_pairs to authenticated;

-- ---------------------------------------------------------------------------
-- À exécuter séparément, en remplaçant par TON e-mail (ne pas le committer) :
-- insert into public.admins (email) values ('ton-email@exemple.com') on conflict do nothing;
