# Private setup — GitHub (private) + Supabase + your home Wi-Fi

No Vercel, no public website. The app runs on one computer at home; your phones/tablets open it over the Wi-Fi.
Supabase stores the shared data; only the two allow-listed email addresses can read or write it.

## 1. Private GitHub repo
1. https://github.com/new → name `pregnancy-tracker`, choose **Private**, leave README / .gitignore / licence **unticked** → Create.
2. In a terminal:
   ```bash
   cd "/Users/NationBuilder/Downloads/WORKSPACE/Claude Code EG/pregnancy-tracker"
   git remote add origin https://github.com/<your-username>/pregnancy-tracker.git
   git push -u origin main
   ```
   When asked to sign in, use your GitHub username and a **personal access token** (GitHub → Settings → Developer settings → Fine-grained tokens → repo access: this repo, *Contents: Read and write*), not your password.
3. Check the repo shows a 🔒 **Private** badge. `.env.local` is git-ignored, so keys never get uploaded.

## 2. Supabase (the shared, locked-down database)
1. https://supabase.com/dashboard → **New project** → set a strong database password.
2. **SQL Editor → New query** → paste **all** of `supabase/migrations/0001_init.sql` → **Run**. Then a second new query with all of `supabase/migrations/0002_realtime.sql` → **Run** (turns on live sync).
3. Open `supabase/seed_allowlist.sql`, replace the two placeholder emails with yours and your wife's, paste into a new query → **Run**.
   *Do this before creating the users* — account creation is refused for any email not on this list.
4. **Authentication → Sign In / Providers (or Settings)**: turn **OFF** "Allow new users to sign up".
5. **Authentication → Users → Add user** → *Create new user* → enter your email + a password → tick **Auto Confirm User**. Repeat for your wife.
6. **Authentication → URL Configuration**: Site URL `http://localhost:3000`; add these **Redirect URLs** (needed only for the magic-link option):
   `http://localhost:3000/**` and `http://<laptop-ip>:3000/**` (see step 3 for the IP).
7. **Project Settings → API**: copy **Project URL** and the **anon public** key. (Never use `service_role` here.)
8. Create `.env.local` in the project folder:
   ```bash
   cp .env.example .env.local     # then paste the two values into it
   ```

### Why this is private
- **Row Level Security is on for all 16 tables.** The only policy lets a request through if the signed-in user's email is in `private.allowed_emails`.
- Anyone not logged in gets "permission denied"; a logged-in stranger sees zero rows and can't write.
- Sign-ups are closed twice over: the dashboard switch (step 4) **and** a database trigger on `auth.users`.
- The anon key in the browser is harmless on its own — without a valid household login it can't read anything.

## 3. Run it at home and open it on phones
```bash
npm install
npm run build && npm run start:lan     # stable, recommended  (or: npm run dev:lan  for live-reload development)
npm run ip                             # prints this computer's Wi-Fi address, e.g. 192.168.1.23
```
Both `*:lan` scripts bind to `0.0.0.0:3000`, so other devices on the network can reach it.

On each phone/tablet (same Wi-Fi): open `http://<that-ip>:3000`. The app opens on a **login screen** — sign in with your email + password. Your data then loads automatically, and edits appear on the other device within a moment (Supabase Realtime), in both directions.

**Tips**
- macOS will ask "Allow incoming network connections for node?" the first time → **Allow**. (Otherwise System Settings → Network → Firewall.)
- The laptop must be on, awake and on Wi-Fi for the phones to load the app. Give it a fixed address in your router (DHCP reservation) so the URL doesn't change.
- Use your phone's **Add to Home Screen** for an app-like icon.
- It's plain `http` on your own network — fine at home; don't port-forward it to the internet.
- Each device keeps a local copy (works if the laptop is off once the page has loaded); cloud sync only needs internet to reach Supabase.
- If you change `.env.local`, restart the server (the values are baked in at build time: re-run `npm run build`).

## Login gate
When the Supabase variables are set, the app shows nothing but the login screen until a registered household member signs in (every page, including direct links). There is no sign-up form, and sign-ups are refused by Supabase itself.
**Sign out** (Settings → Private cloud sync) first saves your changes, then removes this device's local copy. The gate is an app-level lock: it keeps the app closed to anyone without a login, while the real protection of the data is Row Level Security in Supabase. Keep the laptop/phones locked with their own passcodes too.

## How sync works (and its one limitation)
- Local-first: each device works without a connection. After sign-in, each pregnancy profile is reconciled with Supabase by its `updatedAt` — **newest edit wins per profile**. Edits push ~2.5 s after you make them; the other device receives them live through Realtime (with a pull on focus and every minute as a safety net). A profile deleted on one device disappears from the other.
- If you both edit the *same profile* within the same minute, the later save replaces the earlier one for that profile. For two people planning together this is rarely an issue; tell me if you want per-field merging.
- Deleting a profile in Settings deletes the cloud copy too. Theme + custom diaper images are per person and sync to your own account.

## Resetting a password / fixing "Invalid login credentials"
Common causes: a typo, the user was never confirmed, or the account was created without a password. In Supabase → **SQL Editor** run this
(replace the email and the new password; use a long, unique password):
```sql
update auth.users
set encrypted_password = extensions.crypt('NEW-PASSWORD-HERE', extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where email = lower('person@example.com');
```
Run it once per person. Then **clear the query** (it contains the password) and don't paste it anywhere.
Alternative: Authentication → Users → ⋯ → *Send password recovery* (needs working email delivery), or delete the user and *Add user → Create new user* with **Auto Confirm User** ticked.

To see each account's state: `select email, email_confirmed_at, encrypted_password is not null as has_password from auth.users;`
(Both emails must also exist in `private.allowed_emails`.)

**Test both logins safely on your computer** (nothing is printed or stored; passwords are typed hidden):
```bash
npm run check:supabase
```
It checks `.env.local`, that logged-out access is blocked, then signs in each account and confirms it can read the database.

> `supabase/seed_allowlist.sql` now holds your real emails locally. Keep them out of git:
> `git update-index --skip-worktree supabase/seed_allowlist.sql`

## Live HTTPS link (accessible from anywhere)
> Trade-off: this makes the **login page** public on the internet. Your data is still protected by Supabase login + Row Level Security
> (a stranger sees only the sign-in form; the app code is not secret). Use strong passwords. If you'd rather keep everything private, skip this and use the home Wi-Fi setup above.

### Option A — GitHub Pages (workflow included: `.github/workflows/deploy.yml`)
**Needs GitHub Pro/Team** — on a free account Pages only works for *public* repos, and this repo must stay private.
1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Repo → **Settings → Secrets and variables → Actions → New repository secret**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same values as `.env.local`; never the service_role key).
3. Push to `main` (or Actions → *Deploy to GitHub Pages* → Run workflow). The URL will be `https://<username>.github.io/pregnancy-tracker/`.

### Option B — Vercel (free plan works with a private repo)
https://vercel.com/new → import `oupamunashe/pregnancy-tracker` → add the same two environment variables → Deploy. (Or CLI: `npx vercel login`, `npx vercel link`, `npx vercel env add …`, `npx vercel --prod`.) No extra config needed.

### After you have the live URL (either option)
Supabase → **Authentication → URL Configuration**: set **Site URL** to the live URL and add it (with `/**`) under **Redirect URLs**. Then on each phone: open the link → sign in → **Add to Home Screen**.
Realtime works the same on the live site because it connects straight to Supabase (`wss://<project>.supabase.co`), so edits on one phone appear on the other within a moment.
