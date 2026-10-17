// Validates the two Supabase variables (used by the deploy workflow and runnable locally). Never prints the key.
//   NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… node scripts/verify-supabase-env.mjs
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const problems = [];

if (!url) problems.push("NEXT_PUBLIC_SUPABASE_URL is empty/missing.");
else {
  if (url !== url.trim() || /\s/.test(url)) problems.push("NEXT_PUBLIC_SUPABASE_URL contains spaces or a line break — re-paste it without surrounding whitespace.");
  if (/^["']|["']$/.test(url.trim())) problems.push("NEXT_PUBLIC_SUPABASE_URL is wrapped in quotes — remove them.");
  if (!/^https:\/\/[a-z0-9]{15,25}\.supabase\.co$/.test(url.trim().replace(/^["']|["']$/g, "")))
    problems.push("NEXT_PUBLIC_SUPABASE_URL must be exactly https://<project-ref>.supabase.co — no trailing slash, no /rest/v1 or /auth/v1 suffix.");
}
if (!key) problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is empty/missing.");
else {
  let role = "?";
  try { role = JSON.parse(Buffer.from(key.trim().split(".")[1], "base64url").toString()).role; } catch { /* not a JWT */ }
  if (role === "service_role") problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is the service_role key — NEVER ship that. Use the 'anon public' key.");
  else if (role !== "anon") problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY isn't a valid anon key (expected the long 'anon public' JWT from Project Settings → API).");
  if (key !== key.trim() || /\s/.test(key)) problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY contains spaces or a line break — re-paste it.");
}

if (problems.length) {
  for (const p of problems) console.error(`::error::${p}`);
  process.exit(1);
}
console.log(`Supabase env OK → project host: ${new URL(url.trim()).host}`);
