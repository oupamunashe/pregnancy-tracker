-- Pregnancy Tracker — private household schema (derived from src/lib/schemas.ts)
--
-- PRIVACY MODEL
--   * Only emails listed in private.allowed_emails (you + your partner) can read or write ANYTHING.
--   * Row Level Security is ON for every table; the only policy requires private.is_household_member(),
--     which checks the signed-in user's verified email against that allowlist.
--   * Both of you see the same data (this is a shared household database, not one-copy-per-user).
--   * A trigger on auth.users also refuses to create accounts for any email that isn't on the list.
--   * Anonymous (not-logged-in) requests can't touch any table at all.
--
-- Run this whole file once in Supabase → SQL Editor, THEN run seed_allowlist.sql (after editing the emails).
-- Client-generated text ids (e.g. "t_ab12cd3") are the primary keys; `position` preserves list order.

-- 1. Allowlist (private schema: not exposed through the API) ---------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists private.allowed_emails (
  email text primary key check (email = lower(email))
);
alter table private.allowed_emails enable row level security;   -- no policies => unreadable from the API

create or replace function private.is_household_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from private.allowed_emails a
    where a.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;
revoke all on function private.is_household_member() from public, anon;
grant execute on function private.is_household_member() to authenticated;

-- Defence in depth: block account creation for anyone not on the list
create or replace function private.block_unlisted_signups() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from private.allowed_emails where email = lower(coalesce(new.email, ''))) then
    raise exception 'Sign-ups are restricted to this household.';
  end if;
  return new;
end;
$$;
drop trigger if exists block_unlisted_signups on auth.users;
create trigger block_unlisted_signups before insert on auth.users
  for each row execute function private.block_unlisted_signups();

-- 2. Data tables ------------------------------------------------------------------------------------
create table if not exists public.profiles (
  id            text        primary key,
  created_by    uuid        default auth.uid(),
  nickname      text        not null,
  lmp           date        not null,                       -- Last Menstrual Period; EDD = lmp + 280 days (computed in the app)
  notes         text        not null default '',
  status        text        not null default 'active' check (status in ('active', 'archived')),
  icon          text        not null default '🌸',          -- emoji or image URL
  parent_labels jsonb       not null default '["Me","Partner"]',
  photo_asked   jsonb       not null default '{}',          -- photographer-question check-offs
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()          -- set by the client; drives last-write-wins sync
);

-- personal (per-user) appearance settings
create table if not exists public.user_settings (
  user_id       uuid        primary key default auth.uid() references auth.users(id) on delete cascade,
  theme         jsonb       not null default '{}',
  diaper_images jsonb       not null default '{}',          -- "Brand|Size" -> custom image URL / data URI
  updated_at    timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  title text not null,
  week int not null check (week between 0 and 42),          -- date = LMP + week * 7
  category text not null check (category in ('Prenatal', 'Finance', 'Doctor', 'Exercise')),
  urgency text not null check (urgency in ('High', 'Medium', 'Low')),
  done boolean not null default false,
  custom boolean not null default false
);

create table if not exists public.providers (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  name text not null default '',
  role text not null default 'Other' check (role in ('OB/GYN', 'Midwife', 'Sonographer', 'Specialist', 'Hospital', 'Paediatrician', 'Doula', 'Other')),
  phone text not null default '', email text not null default '', address text not null default ''
);

create table if not exists public.appointments (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  title text not null,
  week int not null check (week between 0 and 42),
  date_override text not null default '',                   -- '' = auto (LMP + week * 7), else YYYY-MM-DD
  provider_id text not null default '',                     -- soft reference to providers.id
  is_scan boolean not null default false,
  done boolean not null default false,
  notes text not null default '',
  file_link text not null default ''
);

create table if not exists public.checklist_items (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  list text not null check (list in ('bag-parent', 'bag-partner', 'bag-baby')),   -- hospital bag lists
  "text" text not null,
  done boolean not null default false
);

create table if not exists public.nursery_items (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  "text" text not null,
  todo text not null default '',
  status text not null default 'To buy' check (status in ('To buy', 'Ordered', 'Delivered', 'Assembled', 'Set up')),
  done boolean not null default false,
  link text not null default ''
);

create table if not exists public.swatches (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  name text not null,                                       -- nursery colour palette
  hex text not null check (hex ~* '^#[0-9a-f]{6}$')
);

create table if not exists public.vision_items (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  image text not null default '',                           -- URL or (small) data URI
  notes text not null default '',
  swatches jsonb not null default '[]'                      -- array of hex strings
);

create table if not exists public.budget_items (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  category text not null, item text not null,
  estimated numeric not null default 0,
  actual numeric,                                           -- null until purchased
  status text not null default 'Planned' check (status in ('Planned', 'In Registry', 'Obtained')),
  link text not null default ''
);

create table if not exists public.name_rules (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  label text not null
);

create table if not exists public.baby_names (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  name text not null,
  meaning text not null default '', origin text not null default '',
  checks jsonb not null default '{}',                       -- { name_rules.id: boolean }
  ratings jsonb not null default '[null,null]',             -- [parent 1, parent 2], each 1–10 or null
  notes text not null default ''
);

create table if not exists public.advice_notes (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  section text not null check (section in ('tips', 'hospital', 'postpartum')),
  "text" text not null
);

create table if not exists public.postpartum_steps (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  offset_days int not null,                                 -- date = EDD + offset_days
  title text not null,
  done boolean not null default false
);

create table if not exists public.photographers (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  kind text not null check (kind in ('maternity', 'newborn', 'combined')),
  name text not null,
  portfolio text not null default '', contact text not null default '',
  price numeric, length text not null default '', images text not null default '', notes text not null default ''
);

create table if not exists public.daycares (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid(),
  position int not null default 0,
  name text not null,
  address text not null default '', hours text not null default '',
  fee numeric,                                              -- monthly fee in ZAR
  notes text not null default '', contact text not null default ''
);

-- 3. Indexes + Row Level Security -----------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'tasks',
    'providers',
    'appointments',
    'checklist_items',
    'nursery_items',
    'swatches',
    'vision_items',
    'budget_items',
    'name_rules',
    'baby_names',
    'advice_notes',
    'postpartum_steps',
    'photographers',
    'daycares'
  ] loop
    execute format('create index if not exists %I on public.%I (profile_id, position)', t || '_profile_idx', t);
  end loop;

  foreach t in array array[
    'profiles',
    'tasks',
    'providers',
    'appointments',
    'checklist_items',
    'nursery_items',
    'swatches',
    'vision_items',
    'budget_items',
    'name_rules',
    'baby_names',
    'advice_notes',
    'postpartum_steps',
    'photographers',
    'daycares'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "household members only" on public.%I', t);
    execute format(
      'create policy "household members only" on public.%I for all to authenticated using (private.is_household_member()) with check (private.is_household_member())', t);
  end loop;
end $$;

alter table public.user_settings enable row level security;
drop policy if exists "own settings, household members only" on public.user_settings;
create policy "own settings, household members only" on public.user_settings for all to authenticated
  using (user_id = (select auth.uid()) and private.is_household_member())
  with check (user_id = (select auth.uid()) and private.is_household_member());

-- Nothing is readable by the anon role: no policy grants it access, and RLS is on everywhere.
revoke all on all tables in schema public from anon;
