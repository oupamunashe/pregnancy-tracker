-- Pregnancy Tracker · data collections on the shared Pa-Nashe backend
--
-- The app stores its data in public.docs through doc_merge, exactly like the Pa-Nashe tracker, and uses the same
-- public.members allow-list (public.is_member()) for access. Prerequisite: Pa-Nashe's 0001_init.sql
-- (members, docs, doc_set, doc_merge, jsonb_deep_merge, is_member, Realtime) has already been run in this project.
--
-- All this file does is widen the allowed values of docs.collection so two more collections are accepted:
--     preg_profiles  id = <profileId>                 → { nickname, lmp, notes, icon, status, createdAt }
--     preg_lists     id = <profileId>~<listKey>       → { items: { <itemId>: item | null } }
--   listKey ∈ weekly | symptoms | kicks | contractions | prep
-- It is purely additive: the Pa-Nashe collections (config, months, milestones) keep working unchanged, and the new rows
-- get the same RLS (members only) and Realtime as every other row in public.docs. Safe to re-run.

do $$
declare c record;
begin
  if to_regclass('public.docs') is null or to_regprocedure('public.doc_merge(text,text,jsonb)') is null or to_regprocedure('public.is_member()') is null then
    raise exception 'Run the Pa-Nashe 0001_init.sql first (public.docs, public.members, doc_merge, is_member are missing).';
  end if;

  -- drop whatever CHECK currently restricts docs.collection (its generated name can differ), then add the widened one
  for c in
    select conname from pg_constraint
    where conrelid = 'public.docs'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%collection%'
  loop
    execute format('alter table public.docs drop constraint %I', c.conname);
  end loop;

  alter table public.docs add constraint docs_collection_check
    check (collection in ('config', 'months', 'milestones', 'preg_profiles', 'preg_lists'));
end $$;
