/* Pure helpers for the link-preview Edge Function (kept free of Deno APIs so they are unit-tested with Vitest). */

/** Hostnames / IPs the function must never fetch (SSRF guard): loopback, private ranges, link-local (cloud metadata), .local/.internal. */
export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!h || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.lan') || !h.includes('.') && !h.includes(':')) return true;
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (h.includes(':')) return h === '::1' || h === '::' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80') || h.startsWith('::ffff:');   // IPv6 loopback / ULA / link-local / mapped v4
  return false;
}

/** A URL the function is willing to fetch: https only, no credentials, not a blocked host. */
export function safeUrl(raw: string): URL | null {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || isBlockedHost(u.hostname)) return null;
  return u;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", '#x27': "'", nbsp: ' ' };
const decode = (s: string) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
  const k = e.toLowerCase();
  if (ENTITIES[k] !== undefined) return ENTITIES[k];
  if (k.startsWith('#x')) return String.fromCodePoint(parseInt(k.slice(2), 16));
  if (k.startsWith('#')) return String.fromCodePoint(parseInt(k.slice(1), 10));
  return m;
});

/** All <meta ...> tags as { key (property|name|itemprop, lowercased) → content }. First occurrence wins. */
export function metaTags(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attr = (n: string) => tag.match(new RegExp(`\\b${n}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
    const key = (attr('property') || attr('name') || attr('itemprop')), content = attr('content');
    const k = (key?.[1] ?? key?.[2] ?? '').toLowerCase(), c = content?.[1] ?? content?.[2];
    if (k && c !== undefined && !(k in out)) out[k] = decode(c).trim();
  }
  return out;
}

export interface Preview { image?: string; title?: string; site?: string }
/** Reads og:image / twitter:image, a title and the site name. The image is resolved against the page URL and must be http(s). */
export function parsePreview(html: string, pageUrl: string): Preview {
  const m = metaTags(html);
  const raw = m['og:image:secure_url'] || m['og:image'] || m['twitter:image'] || m['twitter:image:src'] || m['image'] || '';
  let image: string | undefined;
  if (raw) { try { const u = new URL(raw, pageUrl); if (u.protocol === 'https:' || u.protocol === 'http:') image = u.href; } catch { /* ignore */ } }
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const title = (m['og:title'] || m['twitter:title'] || (titleTag ? decode(titleTag).trim() : '') || undefined)?.slice(0, 200);
  return { image, title: title || undefined, site: (m['og:site_name'] || undefined)?.slice(0, 80) };
}
