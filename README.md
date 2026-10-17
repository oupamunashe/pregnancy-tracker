# Pregnancy Tracker (Vite SPA · PWA · Supabase)

Vanilla TypeScript + Vite, built as an installable PWA and published to GitHub Pages by GitHub Actions. Same architecture as the
Pa-Nashe tracker: Supabase Auth (email + password) → `public.members` allow-list → `public.docs` documents written with `doc_merge`,
an IndexedDB **outbox** for offline edits, and a **Realtime** channel so both phones see each other's changes live.

**Views:** Home (progress wheel, countdown) · Weekly milestones · Symptom logger · Kick counter · Contraction timer (5-1-1 guide) ·
Prep checklists (hospital bags ×3, admin) · **Budget** · **Baby names** (each partner votes + hearts on their own phone; both hearts = match) · **Nursery** (planner + vision board) · **Photo milestones** (bump + scans, private bucket) · **Daycare & caregivers** (comparison, ratings, visit log) · **Supplies & diapers** (needs list, diaper log, nappy stock forecast, SA size calculator) · **Medical care** (providers + appointment log with vitals, notes and carried-over questions) · **Events & photography** (baby shower / gender reveal planner with RSVP guest list, budget, tasks and registry links; photographer directory for maternity, birth and newborn shoots) · Settings · **Customizable menu** (each partner picks and orders up to 7 modules for the tab bar and sidebar; the rest live under one expandable **More** item). The layout editor lives in **Settings → Navigation & Menu Layout**.

## Layout
```
src/auth/auth.ts        Supabase client (VITE_* env), sign-in helpers, members allow-list check
src/data/supabase.ts    DocStore on public.docs: doc_merge writes, outbox, Realtime, version-guarded reads
src/data/offline.ts     IndexedDB: cached docs + outbox (one DB per user; wiped on sign-out)
src/data/db.ts          paths + write helpers + subscribe()  (gestations/<id>, preg_lists/<id>~<list>)
src/data/memory.ts      in-memory store for tests / demo
src/core/               gestation engine, calc (kicks, 5-1-1, symptoms), content, state, types
src/ui/                 shell, actions (event delegation), sheets, sign-in, views/*
supabase/migrations/    0003_pregnancy_collections.sql  (widens docs.collection; run after Pa-Nashe's 0001_init.sql)
tests/unit/             vitest: engine, merge, calc, SupabaseAdapter (offline outbox, realtime) with a fake Supabase
```

## Data model (in `public.docs`)
| collection | id | data |
|---|---|---|
| `gestations` | `<profileId>` | `{ nickname, lmp, notes, icon, status, createdAt }` |
| `preg_lists` | `<profileId>~<weekly\|symptoms\|kicks\|contractions\|prep\|budget\|names\|nursery\|vision\|photos\|daycares\|supplies\|diapers>` | `{ items: { <itemId>: item \| null } }` |

Lists are **maps keyed by item id**, not arrays: `doc_merge` merges objects key by key but replaces arrays, so two phones adding
items (or tapping kicks) at once never overwrite each other. `null` is a deletion tombstone. Anything two people edit at once is stored per person (`votes: { P, M }`, `fav: { P, M }`, `ratings: { P, M }`) so each phone writes only its own key. **Navigation prefs** live in `config/preg-nav` as `{ P: { tabs: [...] }, M: { tabs: [...] } }` — one key per person, so each phone writes only its own menu. `config` is shared with the Pa-Nashe tracker, so this app only ever fetches, caches or applies `config` documents whose id starts with `preg-`. New lists: `providers`, `appointments`, `photographers`, `events` (events keep their guests, tasks, expenses and links as nested maps). Photos live in the private `files` storage bucket (members-only, created by Pa-Nashe's 0001); documents keep just the file id. The diaper log keeps its stock settings in a reserved `_stock` item.

## Setup
1. Supabase: Pa-Nashe `0001_init.sql` already applied (members, docs, doc_merge, Realtime) → run `supabase/migrations/0003_pregnancy_collections.sql` in the SQL editor.
2. `cp .env.example .env.local` and fill `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (anon **public** key only).
3. `npm install && npm run check` — verifies env, logged-out access is blocked, both logins, membership and a `doc_merge` write.
4. `npm run dev` (`--host`, so phones on the Wi-Fi can open `http://<ip>:5173/pregnancy-tracker/`), or `npm run dev:demo` for a login-free demo with sample data (`?today=2026-12-20` to simulate a date).
5. Deploy: repo **Settings → Pages → Source: GitHub Actions**, add secrets `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, push to `main`.

`npm test` · `npm run typecheck` · `npm run build` (→ `dist/`, base path `/pregnancy-tracker/`).

*Planning tool, not medical advice.*
