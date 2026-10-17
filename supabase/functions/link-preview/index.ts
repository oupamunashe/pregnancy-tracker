// Supabase Edge Function: link-preview
// Given a page URL (e.g. a Pinterest pin) returns its preview image + title, so the vision board can show a real picture.
// A browser can't read other sites' pages (CORS) and Pinterest only serves og:image to server-side requests, so this runs in YOUR project.
//
// Security: the caller must be signed in AND a member (public.is_member()); only https URLs to public hosts are fetched (SSRF guard,
// re-checked after redirects); the response is size- and time-limited; only { image, title, site } is returned.
// Deploy:  supabase functions deploy link-preview        (CLI: https://supabase.com/docs/guides/functions)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { isBlockedHost, parsePreview, safeUrl } from './parse.ts';

/** Best-effort DNS-rebinding guard: a public-looking hostname must not resolve to a private/loopback address. */
async function resolvesPublic(host: string): Promise<boolean> {
  try {
    const ips = [...await Deno.resolveDns(host, 'A').catch(() => []), ...await Deno.resolveDns(host, 'AAAA').catch(() => [])];
    return ips.every((ip) => !isBlockedHost(ip));
  } catch { return true; }   // resolver unavailable: the hostname check above still applies
}

const ALLOWED_ORIGINS = ['https://oupamunashe.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173'];
const MAX_BYTES = 600_000, TIMEOUT_MS = 8_000;

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin',
});
const json = (body: unknown, status: number, origin: string | null) => new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405, origin);

  // 1. members only
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'Sign in first' }, 401, origin);
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: member } = await sb.rpc('is_member');
  if (member !== true) return json({ error: 'Not a member' }, 403, origin);

  // 2. validate the URL
  let target: URL | null = null;
  try { target = safeUrl(String((await req.json())?.url ?? '')); } catch { /* bad body */ }
  if (!target) return json({ error: 'Only https links to public sites are supported' }, 400, origin);

  try {
    // 3. fetch like a link-unfurling bot (this is what makes Pinterest return its og:image tags); follow a few redirects manually so each hop is checked
    let url = target, res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      if (!(await resolvesPublic(url.hostname))) return json({ error: 'Blocked address' }, 400, origin);
      res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Twitterbot/1.0)', Accept: 'text/html,application/xhtml+xml' } });
      const loc = res.headers.get('Location');
      if (res.status >= 300 && res.status < 400 && loc) { const next = safeUrl(new URL(loc, url).href); if (!next) return json({ error: 'Redirect to a blocked address' }, 400, origin); url = next; continue; }
      break;
    }
    if (!res || !res.ok || !(res.headers.get('Content-Type') || '').includes('html')) return json({ error: 'No preview available' }, 422, origin);

    // 4. read at most MAX_BYTES
    const reader = res.body!.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    while (size < MAX_BYTES) { const { done, value } = await reader.read(); if (done || !value) break; chunks.push(value); size += value.length; }
    await reader.cancel().catch(() => {});
    const bytes = new Uint8Array(size); let at = 0; for (const c of chunks) { bytes.set(c, at); at += c.length; }
    const html = new TextDecoder().decode(bytes);
    return json(parsePreview(html, url.href), 200, origin);
  } catch {
    return json({ error: 'Could not load that page' }, 502, origin);
  }
});
