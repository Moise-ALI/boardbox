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

-- v2 : thème (ids de undercover/themes.js) et langue de la paire
alter table public.undercover_pairs add column if not exists theme text not null default 'animaux';
alter table public.undercover_pairs add column if not exists lang text not null default 'fr';
alter table public.undercover_pairs drop constraint if exists undercover_pairs_theme_format;
alter table public.undercover_pairs add constraint undercover_pairs_theme_format check (theme ~ '^[a-z0-9-]{2,30}$');
alter table public.undercover_pairs drop constraint if exists undercover_pairs_lang_check;
alter table public.undercover_pairs add constraint undercover_pairs_lang_check check (lang in ('fr', 'en'));

-- Une même paire (dans un sens ou dans l'autre) ne peut exister qu'une fois par langue
drop index if exists public.undercover_pairs_unique;
create unique index undercover_pairs_unique
  on public.undercover_pairs (lang, least(lower(btrim(word_a)), lower(btrim(word_b))), greatest(lower(btrim(word_a)), lower(btrim(word_b))));
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

-- Droits de base de l'API (les policies ci-dessus filtrent ensuite ligne par ligne).
-- Supabase accorde par défaut TOUS les droits à anon/authenticated sur les nouvelles tables :
-- on les retire explicitement (double sécurité si une policy était un jour mal écrite).
revoke all on public.undercover_pairs from anon, authenticated;
grant select, insert on public.undercover_pairs to anon;
grant select, insert, update, delete on public.undercover_pairs to authenticated;
revoke all on public.admins from anon, authenticated;

-- v3 : anti-saturation. Le public peut proposer sans compte : on plafonne la file d'attente
-- (au-delà, les propositions sont refusées jusqu'à ce que l'admin fasse du tri).
-- security definer : le comptage doit voir toutes les lignes en attente, que la RLS cache au public.
create or replace function public.undercover_limit_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending'
     and (select count(*) from public.undercover_pairs where status = 'pending') >= 300 then
    raise exception 'file d''attente pleine' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.undercover_limit_pending() from public, anon, authenticated;
drop trigger if exists undercover_limit_pending on public.undercover_pairs;
create trigger undercover_limit_pending
  before insert on public.undercover_pairs
  for each row execute function public.undercover_limit_pending();

-- ---------------------------------------------------------------------------
-- À exécuter séparément, en remplaçant par TON e-mail (ne pas le committer) :
-- insert into public.admins (email) values ('ton-email@exemple.com') on conflict do nothing;
