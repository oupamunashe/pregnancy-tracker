# Deploying: GitHub → Supabase → Vercel

## 1. GitHub
Create an **empty** repository (no README/.gitignore/licence) at https://github.com/new — e.g. `pregnancy-tracker`, private is fine.
```bash
git remote add origin https://github.com/<you>/pregnancy-tracker.git
git push -u origin main
```

## 2. Supabase
1. https://supabase.com/dashboard → **New project** (pick a region near you, e.g. `eu-west`/`af-south` if offered).
2. **SQL Editor → New query** → paste all of `supabase/migrations/0001_init.sql` → **Run**. (Creates 16 tables, indexes, and owner-only Row Level Security.)
3. **Authentication → Sign In / Providers**: make sure **Email** is enabled (magic-link sign-in is what the app uses).
4. **Authentication → URL Configuration**: set **Site URL** to your Vercel URL (after step 3 below) and add `https://<your-app>.vercel.app/**` and `http://localhost:3000/**` to **Redirect URLs**.
5. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
6. Locally: `cp .env.example .env.local` and paste the two values.

> The anon key is meant to be public — Row Level Security (`user_id = auth.uid()`) is what protects the data.
> Never put the `service_role` key in this app or in Vercel's `NEXT_PUBLIC_*` variables.

## 3. Vercel
```bash
npx vercel login                       # opens the browser
npx vercel link                        # create/link the project
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production      # paste value (repeat for preview + development)
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel --prod
```
Or import the GitHub repo at https://vercel.com/new (Framework: Next.js, no build overrides) and add the two env vars under **Settings → Environment Variables**; every push to `main` then redeploys.

`NEXT_PUBLIC_*` values are inlined at build time, so **redeploy after changing them**.

## How sync behaves
- Local-first: the app works fully offline/without an account; nothing leaves the device until you sign in (Settings → Cloud sync).
- After sign-in, each profile is reconciled by `updatedAt` (last write wins per profile); edits auto-sync ~2.5 s later.
- A profile deleted in Settings is also deleted from the cloud. Theme + custom diaper images sync too.
