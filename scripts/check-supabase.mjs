// npm run check — verifies .env.local, the Pa-Nashe-style backend (members, docs, doc_merge) and both logins, without printing any secret.
import fs from "node:fs";
import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
globalThis.WebSocket ??= WebSocket;   // Node 20 has no built-in WebSocket

const ok = (m) => console.log("  ✅ " + m), bad = (m) => console.log("  ❌ " + m);
console.log("\n1) .env.local");
if (!fs.existsSync(".env.local")) { bad(".env.local not found (copy .env.example)"); process.exit(1); }
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const url = env.VITE_SUPABASE_URL ?? "", key = env.VITE_SUPABASE_ANON_KEY ?? "";
if (/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)) ok("VITE_SUPABASE_URL looks valid"); else { bad("VITE_SUPABASE_URL missing/invalid (https://<ref>.supabase.co, no trailing slash)"); process.exit(1); }
let role = "?"; try { role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role; } catch {}
if (role === "anon") ok("VITE_SUPABASE_ANON_KEY is the anon key"); else { bad(role === "service_role" ? "That is the service_role key — never use it in the app." : "VITE_SUPABASE_ANON_KEY missing/invalid"); process.exit(1); }

const sb = createClient(url, key, { auth: { persistSession: false } });
console.log("\n2) Logged out → no access");
const anon = await sb.from("docs").select("id").limit(1);
if (anon.error && /fetch failed|network|ENOTFOUND|ECONN|timeout/i.test(anon.error.message)) bad(`couldn't reach Supabase (${anon.error.message}) — check your connection and that the project isn't paused`);
else if (anon.error?.code === "42P01" || /does not exist|schema cache/i.test(anon.error?.message || "")) bad("public.docs doesn't exist — run the Pa-Nashe 0001_init.sql, then supabase/migrations/0003_pregnancy_collections.sql");
else if (anon.error || !anon.data?.length) ok(`anonymous read blocked (${anon.error ? anon.error.message : "0 rows"})`);
else bad("anonymous request returned rows — RLS is NOT protecting the data!");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
const ask = (q, hidden) => new Promise((res) => {
  if (hidden) { const w = rl._writeToOutput; rl._writeToOutput = (s) => (s.includes(q) ? w.call(rl, s) : w.call(rl, "*")); }
  rl.question(q, (a) => { rl._writeToOutput = Object.getPrototypeOf(rl)._writeToOutput; if (hidden) console.log(); res(a); });
});
for (const n of [1, 2]) {
  console.log(`\n3.${n}) Login test — account ${n} (Enter on the email to skip)`);
  const email = (await ask("  email: ")).trim(); if (!email) { console.log("  (skipped)"); continue; }
  const { data, error } = await sb.auth.signInWithPassword({ email, password: await ask("  password: ", true) });
  if (error) { bad(`sign-in failed: ${error.message}`); continue; }
  ok(`signed in as ${data.user.email}`);
  const mem = await sb.from("members").select("email, person");
  if (mem.error) bad(`members read failed: ${mem.error.message}`); else if (!mem.data.some((r) => r.email.toLowerCase() === data.user.email.toLowerCase())) bad("signed in, but this email is NOT in public.members — the app will show 'This tracker is private'"); else ok(`member (${mem.data.find((r) => r.email.toLowerCase() === data.user.email.toLowerCase()).person})`);
  const w = await sb.rpc("doc_merge", { p_collection: "preg_profiles", p_id: "__check__", p_patch: { ping: Date.now() } });
  if (w.error) bad(`doc_merge failed: ${w.error.message}${/violates check/.test(w.error.message) ? "  → run migrations/0003_pregnancy_collections.sql" : ""}`);
  else { ok("write via doc_merge works (collection preg_profiles accepted)"); await sb.from("docs").delete().eq("collection", "preg_profiles").eq("id", "__check__"); }
  await sb.auth.signOut();
}
rl.close(); console.log("\nDone.\n");
