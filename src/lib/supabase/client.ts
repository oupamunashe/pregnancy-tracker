import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Tidies values pasted into env files / CI secrets: trims whitespace, strips wrapping quotes and trailing slashes / API suffixes. */
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim();
const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/(rest|auth|realtime)\/v1\/?$/, "").replace(/\/+$/, "");
const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const URL_RE = /^https:\/\/[a-z0-9]+\.supabase\.co$/;
const problem = !url
  ? "NEXT_PUBLIC_SUPABASE_URL is missing. It must be set at BUILD time (.env.local for local builds; a repository secret for the GitHub Actions deploy)."
  : !URL_RE.test(url)
    ? `NEXT_PUBLIC_SUPABASE_URL looks wrong ("${url.slice(0, 40)}"). Expected https://<project-ref>.supabase.co`
    : !anonKey
      ? "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. It must be set at BUILD time."
      : null;

if (problem && typeof window !== "undefined") {
  // Visible in the browser console so a bad deploy is obvious instead of a cryptic "Failed to fetch".
  console.error(`[pregnancy-tracker] Supabase is not configured: ${problem} The app is running in local-only mode.`);
}

export const isSyncConfigured = (): boolean => !problem;
export const supabaseHost = (): string => (URL_RE.test(url) ? new URL(url).host : "(not configured)");

let client: SupabaseClient | null = null;

/** Browser Supabase client, or null when the env vars aren't set/valid (the app then runs fully local). */
export function getSupabase(): SupabaseClient | null {
  if (problem || typeof window === "undefined") return null;
  client ??= createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}
