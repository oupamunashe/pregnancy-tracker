-- Pregnancy Tracker · data collections on the shared backend
--
-- The app stores its data in public.docs through doc_merge and uses public.members for access (Pa-Nashe's 0001_init.sql).
-- It uses two collection names:
--     gestations   id = <profileId>                 → { nickname, lmp, notes, icon, status, createdAt }
--     preg_lists   id = <profileId>~<listKey>       → { items: { <itemId>: item | null } }
--   listKey ∈ weekly | symptoms | kicks | contractions | prep | budget | names | nursery | vision | photos | daycares | supplies | diapers
--
-- This file ENSURES both names are accepted by the CHECK constraint on docs.collection. It is strictly ADDITIVE: it reads the
-- values the constraint allows today (config, months, milestones, logs, tools, prep, … whatever your project has), keeps every one,
-- and adds the two above. If both are already allowed it changes nothing. Safe to re-run. It never removes an allowed value.

do $$
declare
  c record; v text; vals text[] := array['gestations', 'preg_lists']; found boolean := false;
begin
  if to_regclass('public.docs') is null or to_regprocedure('public.doc_merge(text,text,jsonb)') is null or to_regprocedure('public.is_member()') is null then
    raise exception 'Run the Pa-Nashe 0001_init.sql first (public.docs, public.members, doc_merge, is_member are missing).';
  end if;

  for c in
    select conname, pg_get_constraintdef(oid) as def from pg_constraint
    where conrelid = 'public.docs'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%collection%'
  loop
    found := true;
    -- keep every value already allowed. The constraint text is either  ARRAY['a'::text, 'b'::text]  (original)  or  '{a,b}'::text[]  (after a re-run)
    for v in select (regexp_matches(c.def, '''([^'']+)''', 'g'))[1] loop
      if v like '{%}' then
        vals := vals || array(select trim(both '"' from trim(x)) from unnest(string_to_array(substr(v, 2, length(v) - 2), ',')) x);
      else
        vals := vals || v;
      end if;
    end loop;
    execute format('alter table public.docs drop constraint %I', c.conname);
  end loop;

  if found then
    select array_agg(distinct x order by x) into vals from unnest(vals) x;
    execute format('alter table public.docs add constraint docs_collection_check check (collection = any (%L::text[]))', vals);
  end if;   -- no constraint at all → any collection is already accepted; nothing to do
end $$;
