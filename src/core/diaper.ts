/* South African diaper sizes by brand + matching by weight. Default pack photos are Checkers Sixty60 catalogue images;
   sizes without a verified photo (Clicks Made 4 Baby, Pampers 4+) fall back to a generated SVG placeholder. */
const img = (id: string) => `https://catalog.sixty60.co.za/v2/files/${id}?width=600&height=600`;
export interface DiaperSize { label: string; min: number; max: number | null; image: string }
export interface DiaperBrand { brand: string; color: string; sizes: DiaperSize[] }
type Seed = [string, number, number | null, string?];
const brand = (brand: string, color: string, seeds: Seed[]): DiaperBrand => ({ brand, color, sizes: seeds.map(([label, min, max, image]) => ({ label, min, max, image: image || '' })) });

export const DIAPER_BRANDS: DiaperBrand[] = [
  brand('Pampers', '#00a0c6', [['Size 1', 2, 5, img('6a5f798874fc8960841df1e0')], ['Size 2', 3, 8, img('6a5f8dc206d7ee90f1a256f9')], ['Size 3', 6, 10, img('6a5f8d6af7988085b9db1dfc')],
    ['Size 4', 9, 14, img('6a5f8270b8312eaf144f4531')], ['Size 4+', 10, 15], ['Size 5', 11, 16, img('6a5f797e69ca11798f7abd27')], ['Size 6', 13, null, img('6a5f7a3b74fc8960841df2f3')]]),
  brand('Huggies', '#1b5faa', [['Size 0', 0, 4, img('6a625a80d482e8b662dfac03')], ['Size 1', 0, 6, img('6a5deb39077bd8f2e5a5cf18')], ['Size 2', 5, 7, img('6a5de76ca9c3dc7c6784f8b2')],
    ['Size 3', 6, 10, img('6a5de77af1d8354aeab343e3')], ['Size 4', 8, 14, img('6a5f79580b77cc3f88fa0b05')], ['Size 5', 15, null, img('6a5de775adeaba570f944acd')]]),
  brand('Clicks Made 4 Baby', '#e2231a', [['Size 1–2 / Newborn', 2, 4], ['Size 3 / Midi', 4, 9], ['Size 4 / Maxi', 8, 12], ['Size 5 / Junior', 11, 13], ['Size 6 / X-Large', 12, null]]),
  brand('Lovies', '#7b3fa0', [['Size 2 / Mini', 3, 6, img('6a5de787740c7cdb1e19dd40')], ['Size 3 / Midi', 4, 9, img('6a5f7a9278dbbdb2a4007943')], ['Size 4 / Maxi', 7, 18, img('6a5f7a0378dbbdb2a4007856')], ['Size 5 / Junior', 12, 25, img('6a5de76a740c7cdb1e19dd13')]]),
];
export const rangeText = (s: Pick<DiaperSize, 'min' | 'max'>) => (s.max === null ? `${s.min}+ kg` : `${s.min}–${s.max} kg`);
export const parseWeight = (v: string): number | null => { const n = parseFloat(String(v).replace(',', '.')); return Number.isNaN(n) || n <= 0 ? null : n; };
const mid = (s: DiaperSize) => (s.max === null ? s.min + 3 : (s.min + s.max) / 2);
const dist = (s: DiaperSize, kg: number) => Math.min(Math.abs(kg - s.min), Math.abs(kg - (s.max ?? s.min)));

export function matchBrands(kg: number) {
  return DIAPER_BRANDS.map(b => {
    const hit = b.sizes.filter(s => kg >= s.min && (s.max === null || kg <= s.max));
    const best = hit.length > 1 ? hit.reduce((a, c) => (Math.abs(mid(c) - kg) < Math.abs(mid(a) - kg) ? c : a)) : null;
    return { brand: b, matches: hit.map(size => ({ size, best: size === best })), nearest: [...b.sizes].sort((a, c) => dist(a, kg) - dist(c, kg))[0] };
  });
}

/** Self-contained SVG pack illustration (data URI): never a broken link. */
export function placeholderImage(brandName: string, size: string, color: string): string {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const b = brandName.length > 18 ? brandName.replace('Clicks ', '') : brandName, z = size.length > 16 ? size.split(' / ')[1] ?? size : size;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><rect x="34" y="22" width="132" height="156" rx="16" fill="${color}"/>`
    + `<path d="M62 84h76v14c0 24-16 36-38 36S62 122 62 98z" fill="#fff"/><circle cx="100" cy="112" r="7" fill="${color}"/>`
    + `<text x="100" y="42" font-family="Arial" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">${esc(b)}</text>`
    + `<text x="100" y="160" font-family="Arial" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">${esc(z)}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
