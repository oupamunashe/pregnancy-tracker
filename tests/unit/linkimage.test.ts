import { describe, expect, it } from 'vitest';
import { hostOf, isPinterestPage, linkCard, looksLikeImage, normalizeUrl, resolveLink, upgradePinimg } from '../../src/ui/linkimage';
import { isBlockedHost, metaTags, parsePreview, safeUrl } from '../../supabase/functions/link-preview/parse';

const never = async () => false;

describe('link classification', () => {
  it('normalizes pasted text and rejects non-web schemes', () => {
    expect(normalizeUrl('  pinterest.com/pin/123/ ')).toBe('https://pinterest.com/pin/123/');
    expect(normalizeUrl('http://example.com/a.jpg')).toBe('http://example.com/a.jpg');
    expect(normalizeUrl('javascript:alert(1)')).toBeNull(); expect(normalizeUrl('data:text/html,x')).toBeNull(); expect(normalizeUrl('')).toBeNull(); expect(normalizeUrl('ftp://x.com/a.png')).toBeNull();
  });
  it('spots direct image links by extension or image CDN', () => {
    expect(looksLikeImage('https://x.com/a/b.JPG?w=800')).toBe(true); expect(looksLikeImage('https://i.pinimg.com/736x/ab/cd/ef.jpg')).toBe(true);
    expect(looksLikeImage('https://images.unsplash.com/photo-123?auto=format')).toBe(true); expect(looksLikeImage('https://www.pinterest.com/pin/123/')).toBe(false); expect(looksLikeImage('https://example.com/page')).toBe(false);
  });
  it('recognises Pinterest pin pages on any country domain, and pin.it short links', () => {
    expect(isPinterestPage('https://www.pinterest.com/pin/99360735500167749/')).toBe(true); expect(isPinterestPage('https://za.pinterest.com/pin/1/')).toBe(true); expect(isPinterestPage('https://pin.it/abc123')).toBe(true);
    expect(isPinterestPage('https://www.pinterest.com/someuser/board/')).toBe(false); expect(isPinterestPage('https://notpinterest.com/pin/1')).toBe(false);
  });
  it('upgrades Pinterest thumbnails to the 736x copy', () => {
    expect(upgradePinimg('https://i.pinimg.com/236x/a7/66/56/x.jpg')).toBe('https://i.pinimg.com/736x/a7/66/56/x.jpg');
    expect(upgradePinimg('https://i.pinimg.com/564x/a7/x.jpg')).toBe('https://i.pinimg.com/736x/a7/x.jpg'); expect(upgradePinimg('https://example.com/236x/x.jpg')).toBe('https://example.com/236x/x.jpg');
  });
  it('hostOf drops www', () => expect(hostOf('https://www.pinterest.com/pin/1/')).toBe('pinterest.com'));
});

describe('resolveLink: always ends with something showable', () => {
  it('direct image → used as is, no network', async () => expect(await resolveLink('https://x.com/a.png', { probe: never })).toMatchObject({ image: 'https://x.com/a.png', via: 'direct' }));
  it('a page URL that happens to load as a picture is accepted (probe)', async () => expect(await resolveLink('https://cdn.example.com/render?id=7', { probe: async () => true })).toMatchObject({ image: 'https://cdn.example.com/render?id=7', via: 'probe' }));
  it('a Pinterest pin → the preview function supplies the real picture (upgraded) and the pin link is kept as the source', async () => {
    const r = await resolveLink('https://www.pinterest.com/pin/123/', { probe: async () => { throw new Error('must not probe a pin page'); }, preview: async () => ({ image: 'https://i.pinimg.com/236x/aa/bb.jpg', title: 'Nursery ideas' }) });
    expect(r).toEqual({ url: 'https://www.pinterest.com/pin/123/', image: 'https://i.pinimg.com/736x/aa/bb.jpg', source: 'https://www.pinterest.com/pin/123/', title: 'Nursery ideas', via: 'preview' });
  });
  it('no preview service / it fails → a link card instead of an empty frame', async () => {
    expect(await resolveLink('https://www.pinterest.com/pin/123/', { probe: never })).toEqual({ url: 'https://www.pinterest.com/pin/123/', source: 'https://www.pinterest.com/pin/123/', title: undefined, via: 'none' });
    expect(await resolveLink('https://shop.example.com/cot', { probe: never, preview: async () => { throw new Error('boom'); } })).toMatchObject({ source: 'https://shop.example.com/cot', via: 'none' });
    expect((await resolveLink('https://shop.example.com/cot', { probe: never, preview: async () => ({ title: 'Oak cot' }) }))?.title).toBe('Oak cot');   // title alone is still useful
  });
  it('junk input → null', async () => expect(await resolveLink('not a link at all ::', { probe: never })).toBeNull());
  it('the link card escapes hostile text and offers a retry only when asked', () => {
    const c = linkCard('https://evil.example/"><script>', '<img onerror=x>', {});
    expect(c).not.toContain('<script>'); expect(c).not.toContain('<img onerror'); expect(c).not.toContain('vision-retry');
    expect(linkCard('https://www.pinterest.com/pin/1/', undefined, { retryId: 'v1' })).toContain('data-id="v1"');
  });
});

describe('link-preview function: HTML parsing', () => {
  const pin = `<html><head><meta content="Found this on Pinterest" data-app="true" name="og:title" property="og:title"/>
    <meta content="https://i.pinimg.com/736x/a7/66/56/a76656e966b1958f568d63c3f1c05aec.jpg" data-app="true" name="og:image" property="og:image"/><title>Pin</title></head></html>`;
  it('reads a real Pinterest pin’s og tags', () => expect(parsePreview(pin, 'https://www.pinterest.com/pin/1/')).toEqual({ image: 'https://i.pinimg.com/736x/a7/66/56/a76656e966b1958f568d63c3f1c05aec.jpg', title: 'Found this on Pinterest', site: undefined }));
  it('handles attribute order, single quotes, entities, relative URLs and falls back to twitter:image / <title>', () => {
    const h = `<meta content='/img/hero.jpg?a=1&amp;b=2' name='twitter:image'><title>Oak &amp; Pine cot</title><meta property="og:site_name" content="Takealot">`;
    expect(parsePreview(h, 'https://shop.example.com/p/9')).toEqual({ image: 'https://shop.example.com/img/hero.jpg?a=1&b=2', title: 'Oak & Pine cot', site: 'Takealot' });
  });
  it('ignores non-http images (javascript:, data:) and pages with no tags', () => {
    expect(parsePreview('<meta property="og:image" content="javascript:alert(1)">', 'https://x.com').image).toBeUndefined();
    expect(parsePreview('<meta property="og:image" content="data:image/png;base64,AAAA">', 'https://x.com').image).toBeUndefined();
    expect(parsePreview('<html></html>', 'https://x.com')).toEqual({ image: undefined, title: undefined, site: undefined });
    expect(metaTags('<meta name="a" content="1"><meta name="a" content="2">')).toEqual({ a: '1' });
  });
});

describe('link-preview function: SSRF guard', () => {
  it('blocks loopback, private, link-local (cloud metadata), CGNAT and internal names', () => {
    for (const h of ['localhost', 'foo.localhost', '127.0.0.1', '10.0.0.5', '172.16.0.1', '172.31.255.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '[::1]', 'fd00::1', 'fe80::1', 'printer.local', 'db.internal', 'intranet', '::ffff:7f00:1'])
      expect(isBlockedHost(h), h).toBe(true);
  });
  it('allows ordinary public hosts', () => { for (const h of ['www.pinterest.com', 'pin.it', '8.8.8.8', '172.32.0.1', '203.0.113.9']) expect(isBlockedHost(h), h).toBe(false); });
  it('safeUrl: https only, no credentials, no blocked hosts', () => {
    expect(safeUrl('https://www.pinterest.com/pin/1/')?.hostname).toBe('www.pinterest.com');
    for (const u of ['http://example.com', 'ftp://example.com', 'file:///etc/passwd', 'https://user:pw@example.com', 'https://127.0.0.1/', 'https://169.254.169.254/latest/meta-data', 'not a url', 'javascript:alert(1)']) expect(safeUrl(u), u).toBeNull();
  });
});
