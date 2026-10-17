/* Turning whatever someone pastes into the vision board into something that can be SHOWN:
     1. a direct image link (…jpg / …png / Pinterest's i.pinimg.com CDN …)            → used as is
     2. any other link that loads as a picture (probed in the browser, no third party)  → used as is
     3. a page (a Pinterest pin, a shop page…) → ask the app's own private link-preview function for its og:image
     4. otherwise                                                                     → a tidy link card (never an empty frame)
   A browser can't read another site's HTML (CORS), so step 3 needs the Supabase Edge Function in supabase/functions/link-preview. */
import { esc } from '../core/format';

export interface Preview { image?: string; title?: string; site?: string }
export interface Resolved { url: string; image?: string; source?: string; title?: string; via: 'direct' | 'probe' | 'preview' | 'none' }

const IMG_EXT = /\.(?:jpe?g|png|gif|webp|avif|bmp|svg)(?:$|[?#])/i;
const IMG_HOST = /(?:^|\.)(?:pinimg\.com|images\.unsplash\.com|i\.imgur\.com|picsum\.photos)$/i;

/** Trims, adds https:// to a bare domain, and accepts only http(s) URLs. Returns null for anything else. */
export function normalizeUrl(raw: string): string | null {
  let s = (raw || '').trim();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s.replace(/^\/+/, '');
  try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null; } catch { return null; }
}
export const hostOf = (url: string): string => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };
export const looksLikeImage = (url: string): boolean => { try { const u = new URL(url); return IMG_EXT.test(u.pathname + u.search) || IMG_HOST.test(u.hostname); } catch { return false; } };
/** A Pinterest pin PAGE (pinterest.com/pin/123…, any country domain) or a pin.it short link — an HTML page, never an image. */
export function isPinterestPage(url: string): boolean {
  try { const u = new URL(url); return u.hostname === 'pin.it' || (/(?:^|\.)pinterest\.[a-z.]+$/i.test(u.hostname) && /^\/pin\//i.test(u.pathname)); } catch { return false; }
}
/** Pinterest serves thumbnails at /236x/, /474x/, /564x/ …; the 736x copy is the largest that is always available. */
export const upgradePinimg = (url: string): string => url.replace(/(https?:\/\/i\.pinimg\.com\/)(?:\d{2,4}x(?:\d{2,4})?|60x60_RS)\//i, '$1736x/');

export interface Deps { probe: (url: string) => Promise<boolean>; preview?: (url: string) => Promise<Preview | null> }

/** See the numbered steps above. Never throws; `via: 'none'` means "show a link card". */
export async function resolveLink(raw: string, deps: Deps): Promise<Resolved | null> {
  const url = normalizeUrl(raw);
  if (!url) return null;
  if (looksLikeImage(url)) return { url, image: url, via: 'direct' };
  const page = isPinterestPage(url);
  if (!page && await deps.probe(url).catch(() => false)) return { url, image: url, via: 'probe' };
  const pv = await (deps.preview?.(url) ?? Promise.resolve(null)).catch(() => null);
  if (pv?.image) return { url, image: upgradePinimg(pv.image), source: url, title: pv.title, via: 'preview' };
  return { url, source: url, title: pv?.title, via: 'none' };
}

/** Browser-side: does this URL load as an image? (an <img> can load cross-origin images; an HTML page just errors) */
export const probeImage = (url: string, ms = 6000): Promise<boolean> => new Promise(resolve => {
  const img = new Image(), done = (ok: boolean) => { clearTimeout(t); img.onload = img.onerror = null; resolve(ok); }, t = setTimeout(() => done(false), ms);
  img.onload = () => done(true); img.onerror = () => done(false); img.referrerPolicy = 'no-referrer'; img.src = url;
});

/** The tidy card shown instead of a picture (a pin, a shop page, a broken image link…). */
export function linkCard(url: string, title?: string, opts: { retryId?: string } = {}): string {
  const pin = isPinterestPage(url) || /pinterest\.|pinimg\.com|pin\.it/i.test(url);
  return `<div class="linkcard"><div class="lc-ico" aria-hidden="true">${pin ? '📌' : '🔗'}</div>
    <div class="lc-body"><b>${esc(title || (pin ? 'Pinterest pin' : hostOf(url)))}</b><div class="small muted">${esc(hostOf(url))}</div>
    <div class="row-gap tight"><a class="btn sm" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open link ↗</a>${opts.retryId ? `<button class="btn sm ghost" data-a="vision-retry" data-id="${esc(opts.retryId)}">Fetch picture</button>` : ''}</div></div></div>`;
}
