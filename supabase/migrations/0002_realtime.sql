-- Live sync between devices: publish row changes through Supabase Realtime.
-- Realtime respects Row Level Security, so only signed-in, allow-listed household members receive any change event.
-- Run after 0001_init.sql. Safe to re-run.

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'tasks', 'providers', 'appointments', 'checklist_items', 'nursery_items', 'swatches', 'vision_items',
    'budget_items', 'name_rules', 'baby_names', 'advice_notes', 'postpartum_steps', 'photographers', 'daycares'
  ] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
