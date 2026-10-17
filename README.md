# Pregnancy Tracker

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Zustand · Zod · date-fns · Vitest

Every date in the app is derived from the active profile's LMP (`EDD = LMP + 280 days`, task date = `LMP + week × 7`).
Data lives in `localStorage` under `pregtracker.v1` (same shape as the prototype, so prototype data loads and is migrated).

## Run
```bash
npm install
npm run dev        # http://localhost:3000
npm test           # gestational engine, diaper calculator, schemas + migration
npm run typecheck
npm run build && npm start
```

## Layout
```
src/app/(app)/<module>/page.tsx   dashboard · todo · appointments · budget · nursery · checklists · names · advice
                                  photography · daycare · diaper · settings
src/lib/engine/gestation.ts       pure date maths (tested)
src/lib/diaper.ts                 SA diaper brands, sizes, default pack images, matching logic (tested)
src/lib/schemas.ts                Zod schemas = TypeScript types = validation of stored/imported data
src/lib/templates.ts              week-relative seed data for new profiles
src/lib/store.ts                  Zustand store + localStorage persistence (validated on load)
src/lib/migrate.ts                upgrades older saved data
src/components/                   AppShell (header/nav/More menu), ThemeApplier, ProfileIcon, ui primitives
```

## Notes
- **Theme:** Settings → Theme & Appearance writes `--color-primary / --color-bg / --color-accent / --color-highlight`; all Tailwind brand colours resolve through those variables.
- **Diaper images:** defaults are Checkers Sixty60 catalogue links; override per brand/size in Settings → Diaper Images. Clicks Made 4 Baby and Pampers 4+ have no default image yet.
- **Simulate today:** footer date box, handy for testing any week.
- **Not medical advice.** A planning tool only.
