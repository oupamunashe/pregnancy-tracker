// npm run check:supabase  — verifies .env.local, the two logins and Row Level Security, without printing any secret.
// Passwords are typed into the terminal (hidden) and never stored.
import fs from "node:fs";
import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Node 20 has no built-in WebSocket; supabase-js (Realtime) needs one, so provide it via `ws`.
globalThis.WebSocket ??= WebSocket;

const ok = (m) => console.log("  ✅ " + m);
const bad = (m) => console.log("  ❌ " + m);

// 1. env ---------------------------------------------------------------------------------------------
console.log("\n1) .env.local");
if (!fs.existsSync(".env.local")) { bad(".env.local not found (copy .env.example to .env.local)"); process.exit(1); }
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "", key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
if (/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)) ok("NEXT_PUBLIC_SUPABASE_URL looks valid"); else { bad("NEXT_PUBLIC_SUPABASE_URL is missing/invalid (expected https://<ref>.supabase.co)"); process.exit(1); }
let role = "?"; try { role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role; } catch { /* not a JWT */ }
if (role === "anon") ok("NEXT_PUBLIC_SUPABASE_ANON_KEY is the anon key"); else { bad(role === "service_role" ? "That is the service_role key — NEVER use it in the app. Use the anon public key." : "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing/invalid"); process.exit(1); }

const sb = createClient(url, key, { auth: { persistSession: false }, realtime: { transport: WebSocket } });

// 2. anonymous access must be denied ------------------------------------------------------------------
console.log("\n2) Not logged in → no access");
const anon = await sb.from("profiles").select("id");
if (anon.error && /fetch failed|network|ENOTFOUND|ECONN|timeout/i.test(anon.error.message)) bad(`couldn't reach Supabase (${anon.error.message}) — check your internet connection and the project URL`);
else if (anon.error || !anon.data?.length) ok(`anonymous read blocked (${anon.error ? anon.error.message : "0 rows"})`);
else bad("anonymous request returned rows — RLS is NOT protecting the data!");

// 3. each login -----------------------------------------------------------------------------------------
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
const ask = (q, hidden) => new Promise((res) => {
  if (hidden) { const w = rl._writeToOutput; rl._writeToOutput = (s) => (s.includes(q) ? w.call(rl, s) : w.call(rl, "*")); }
  rl.question(q, (a) => { rl._writeToOutput = Object.getPrototypeOf(rl)._writeToOutput; if (hidden) console.log(); res(a); });
});

for (const n of [1, 2]) {
  console.log(`\n3.${n}) Login test — account ${n} (press Enter on the email to skip)`);
  const email = (await ask("  email: ")).trim();
  if (!email) { console.log("  (skipped)"); continue; }
  const password = await ask("  password: ", true);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { bad(`sign-in failed: ${error.message}`); console.log(error.message.includes("Invalid login") ? "     → wrong password, or the user doesn't exist / isn't confirmed. See 'Resetting a password' in PRIVATE-SETUP.md." : ""); continue; }
  ok(`signed in as ${data.user.email}`);
  const prof = await sb.from("profiles").select("id", { count: "exact", head: true });
  if (prof.error) bad(`allow-listed read failed: ${prof.error.message}  → is this email in private.allowed_emails (seed_allowlist.sql)?`); else ok(`database read allowed (${prof.count} profile rows visible)`);
  await sb.auth.signOut();
}
rl.close();
console.log("\nDone.\n");
