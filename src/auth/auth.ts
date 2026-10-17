/* Supabase Auth (email + password) and the members allow-list.
   Only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY reach the browser; Row Level Security protects the data. */
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { lsGet, lsSet } from '../core/state';
import type { Who } from '../core/types';

/** Database requests give up after 20 s (weak signal, captive Wi-Fi) so the outbox treats them as offline and retries. */
export const DB_TIMEOUT_MS = 20_000;
export const timedFetch: typeof fetch = (input, init: RequestInit = {}) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (init.signal || !/\/rest\/v1\//.test(url) || typeof AbortSignal.timeout !== 'function') return fetch(input, init);
  return fetch(input, { ...init, signal: AbortSignal.timeout(DB_TIMEOUT_MS) });
};

/** Tidies pasted values: trims whitespace, strips wrapping quotes, trailing slashes and API suffixes. */
const clean = (v: unknown) => String(v ?? '').trim().replace(/^["']|["']$/g, '').trim();
export const supabaseUrl = () => clean(import.meta.env.VITE_SUPABASE_URL).replace(/\/(rest|auth|realtime)\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseKey = () => clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (client) return client;
  const url = supabaseUrl(), key = supabaseKey();
  if (!url || !key) throw new Error('This build has no Supabase settings (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Add them as GitHub secrets (or in .env.local) and rebuild.');
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)) throw new Error(`VITE_SUPABASE_URL looks wrong ("${url.slice(0, 40)}"). Expected https://<project-ref>.supabase.co`);
  // implicit flow: a reset link opened on another device than the one that asked for it still works
  client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }, global: { fetch: timedFetch } });
  return client;
}

export type Membership = { person: Who } | 'not-member' | 'unknown';
/** The `members` row for the signed-in email (the allow-list). Remembered per user so the app can open offline. */
export async function membership(session: Session): Promise<Membership> {
  const email = (session.user.email || '').toLowerCase();
  const key = 'pt_member:' + session.user.id;
  try {
    const { data, error } = await supabase().from('members').select('email, person');
    if (error) throw error;
    const row = (data || []).find(r => String(r.email).toLowerCase() === email);
    if (!row) { lsSet(key, ''); return 'not-member'; }
    lsSet(key, row.person);
    return { person: row.person as Who };
  } catch {
    const cached = lsGet(key);
    return cached === 'P' || cached === 'M' ? { person: cached } : 'unknown';
  }
}

export const appUrl = () => location.origin + import.meta.env.BASE_URL;

export function authMessage(e: any): string {
  const m = String(e?.message || e || '');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'You’re offline – connect to the internet and try again.';
  if (/invalid login credentials/i.test(m)) return 'That email and password don’t match.';
  if (/email not confirmed/i.test(m)) return 'This email hasn’t been confirmed yet.';
  if (/rate limit|too many/i.test(m)) return 'Too many tries – wait a few minutes and try again.';
  if (/should be different/i.test(m)) return 'Choose a password you haven’t used here before.';
  if (/password/i.test(m) && /(short|least|weak)/i.test(m)) return 'That password is too short or too simple.';
  if (/failed to fetch|network/i.test(m)) return 'Couldn’t reach the server – check your connection, and that the Supabase project isn’t paused.';
  return m || 'Something went wrong.';
}
