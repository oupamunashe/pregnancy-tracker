-- Pregnancy Tracker — initial schema (derived from src/lib/schemas.ts)
--
-- Model: every row belongs to a signed-in user (user_id = auth.uid()) and, except for
-- `profiles` and `user_settings`, to one pregnancy profile. Row Level Security restricts every
-- table to its owner, so the public anon key is safe to ship in the browser.
-- Client-generated text ids (e.g. "t_ab12cd3") are unique per user, hence the (user_id, id) keys.
-- `position` preserves the order of list items.

create table if not exists public.profiles (
  user_id       uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  id            text        not null,
  nickname      text        not null,
  lmp           date        not null,                       -- Last Menstrual Period; EDD = lmp + 280 days (computed in the app)
  notes         text        not null default '',
  status        text        not null default 'active' check (status in ('active', 'archived')),
  icon          text        not null default '🌸',          -- emoji or image URL
  parent_labels jsonb       not null default '["Me","Partner"]',
  photo_asked   jsonb       not null default '{}',          -- photographer-question check-offs
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),         -- set by the client; drives last-write-wins sync
  primary key (user_id, id)
);

create table if not exists public.user_settings (
  user_id       uuid        primary key default auth.uid() references auth.users(id) on delete cascade,
  theme         jsonb       not null default '{}',
  diaper_images jsonb       not null default '{}',          -- "Brand|Size" -> custom image URL / data URI
  updated_at    timestamptz not null default now()
);

create table if not exists public.tasks (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  title text not null,
  week int not null check (week between 0 and 42),          -- date = LMP + week * 7
  category text not null check (category in ('Prenatal', 'Finance', 'Doctor', 'Exercise')),
  urgency text not null check (urgency in ('High', 'Medium', 'Low')),
  done boolean not null default false,
  custom boolean not null default false,
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.providers (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  name text not null default '',
  role text not null default 'Other' check (role in ('OB/GYN', 'Midwife', 'Sonographer', 'Specialist', 'Hospital', 'Paediatrician', 'Doula', 'Other')),
  phone text not null default '', email text not null default '', address text not null default '',
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.appointments (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  title text not null,
  week int not null check (week between 0 and 42),
  date_override text not null default '',                   -- '' = auto (LMP + week * 7), else YYYY-MM-DD
  provider_id text not null default '',                     -- soft reference to providers.id
  is_scan boolean not null default false,
  done boolean not null default false,
  notes text not null default '',
  file_link text not null default '',
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.checklist_items (         -- hospital bag lists
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  list text not null check (list in ('bag-parent', 'bag-partner', 'bag-baby')),
  "text" text not null,
  done boolean not null default false,
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.nursery_items (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  "text" text not null,
  todo text not null default '',
  status text not null default 'To buy' check (status in ('To buy', 'Ordered', 'Delivered', 'Assembled', 'Set up')),
  done boolean not null default false,
  link text not null default '',
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.swatches (                -- nursery colour palette
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  name text not null,
  hex text not null check (hex ~* '^#[0-9a-f]{6}$'),
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.vision_items (            -- nursery vision board cards
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  image text not null default '',                           -- URL or (small) data URI
  notes text not null default '',
  swatches jsonb not null default '[]',                     -- array of hex strings
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.budget_items (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  category text not null, item text not null,
  estimated numeric not null default 0,
  actual numeric,                                           -- null until purchased
  status text not null default 'Planned' check (status in ('Planned', 'In Registry', 'Obtained')),
  link text not null default '',
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.name_rules (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  label text not null,
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.baby_names (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  name text not null,
  meaning text not null default '', origin text not null default '',
  checks jsonb not null default '{}',                       -- { name_rules.id: boolean }
  ratings jsonb not null default '[null,null]',             -- [parent 1, parent 2], each 1–10 or null
  notes text not null default '',
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.advice_notes (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  section text not null check (section in ('tips', 'hospital', 'postpartum')),
  "text" text not null,
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.postpartum_steps (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  offset_days int not null,                                 -- date = EDD + offset_days
  title text not null,
  done boolean not null default false,
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.photographers (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  kind text not null check (kind in ('maternity', 'newborn', 'combined')),
  name text not null,
  portfolio text not null default '', contact text not null default '',
  price numeric, length text not null default '', images text not null default '', notes text not null default '',
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

create table if not exists public.daycares (
  user_id uuid not null default auth.uid(), profile_id text not null, id text not null, position int not null default 0,
  name text not null,
  address text not null default '', hours text not null default '',
  fee numeric,                                              -- monthly fee in ZAR
  notes text not null default '', contact text not null default '',
  primary key (user_id, id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

-- Indexes for per-profile reads + Row Level Security (owner-only) on every table ---------------
do $$
declare t text;
begin
  foreach t in array array[
    'tasks', 'providers', 'appointments', 'checklist_items', 'nursery_items', 'swatches', 'vision_items',
    'budget_items', 'name_rules', 'baby_names', 'advice_notes', 'postpartum_steps', 'photographers', 'daycares'
  ] loop
    execute format('create index if not exists %I on public.%I (user_id, profile_id, position)', t || '_profile_idx', t);
  end loop;

  foreach t in array array[
    'profiles', 'user_settings',
    'tasks', 'providers', 'appointments', 'checklist_items', 'nursery_items', 'swatches', 'vision_items',
    'budget_items', 'name_rules', 'baby_names', 'advice_notes', 'postpartum_steps', 'photographers', 'daycares'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "owner full access" on public.%I', t);
    execute format(
      'create policy "owner full access" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;
