/**
 * South African diaper size data. Each size: [label, minKg, maxKg | null (open-ended), default image].
 * Default pack shots are Checkers Sixty60 catalogue images. Sizes without a verified photo (Clicks Made 4 Baby, Pampers 4+)
 * default to a generated SVG pack placeholder; users can paste a real link in Settings → Diaper Images.
 */
import { placeholderImage } from "./templates";

const img = (id: string) => `https://catalog.sixty60.co.za/v2/files/${id}?width=600&height=600`;

export interface DiaperSize {
  label: string; min: number; max: number | null;
  /** Always non-empty: a retailer photo, or a generated SVG placeholder (see `placeholder`). */
  image: string;
  /** True when `image` is the generated placeholder rather than a real pack shot. */
  placeholder: boolean;
}
export interface DiaperBrand { brand: string; color: string; sizes: DiaperSize[] }

type SizeSeed = [label: string, min: number, max: number | null, image?: string];
const brand = (name: string, color: string, seeds: SizeSeed[]): DiaperBrand => ({
  brand: name, color,
  sizes: seeds.map(([label, min, max, image]) => ({
    label, min, max, image: image || placeholderImage(name, label, color), placeholder: !image,
  })),
});

export const DIAPER_BRANDS: DiaperBrand[] = [
  brand("Pampers", "#00a0c6", [
    ["Size 1", 2, 5, img("6a5f798874fc8960841df1e0")], ["Size 2", 3, 8, img("6a5f8dc206d7ee90f1a256f9")],
    ["Size 3", 6, 10, img("6a5f8d6af7988085b9db1dfc")], ["Size 4", 9, 14, img("6a5f8270b8312eaf144f4531")],
    ["Size 4+", 10, 15], ["Size 5", 11, 16, img("6a5f797e69ca11798f7abd27")], ["Size 6", 13, null, img("6a5f7a3b74fc8960841df2f3")],
  ]),
  brand("Huggies", "#1b5faa", [
    ["Size 0", 0, 4, img("6a625a80d482e8b662dfac03")], ["Size 1", 0, 6, img("6a5deb39077bd8f2e5a5cf18")],
    ["Size 2", 5, 7, img("6a5de76ca9c3dc7c6784f8b2")], ["Size 3", 6, 10, img("6a5de77af1d8354aeab343e3")],
    ["Size 4", 8, 14, img("6a5f79580b77cc3f88fa0b05")], ["Size 5", 15, null, img("6a5de775adeaba570f944acd")],
  ]),
  brand("Clicks Made 4 Baby", "#e2231a", [
    ["Size 1–2 / Newborn", 2, 4], ["Size 3 / Midi", 4, 9], ["Size 4 / Maxi", 8, 12], ["Size 5 / Junior", 11, 13], ["Size 6 / X-Large", 12, null],
  ]),
  brand("Lovies", "#7b3fa0", [
    ["Size 2 / Mini", 3, 6, img("6a5de787740c7cdb1e19dd40")], ["Size 3 / Midi", 4, 9, img("6a5f7a9278dbbdb2a4007943")],
    ["Size 4 / Maxi", 7, 18, img("6a5f7a0378dbbdb2a4007856")], ["Size 5 / Junior", 12, 25, img("6a5de76a740c7cdb1e19dd13")],
  ]),
];

export const sizeKey = (brand: string, label: string) => `${brand}|${label}`;
export const rangeText = (s: Pick<DiaperSize, "min" | "max">) => (s.max === null ? `${s.min}+ kg` : `${s.min}–${s.max} kg`);
export const fitsWeight = (s: DiaperSize, kg: number) => kg >= s.min && (s.max === null || kg <= s.max);

/** Parses "5,5" or "5.5"; returns null for empty / non-positive input. */
export function parseWeight(input: string): number | null {
  const n = parseFloat(input.replace(",", "."));
  return Number.isNaN(n) || n <= 0 ? null : n;
}

const midpoint = (s: DiaperSize) => (s.max === null ? s.min + 3 : (s.min + s.max) / 2);
const distance = (s: DiaperSize, kg: number) => Math.min(Math.abs(kg - s.min), Math.abs(kg - (s.max ?? s.min)));

export interface BrandMatch { brand: DiaperBrand; matches: { size: DiaperSize; best: boolean }[]; nearest: DiaperSize }

/** Matches a weight to every brand's sizes; the size whose range midpoint is closest gets `best` when several overlap. */
export function matchBrands(kg: number): BrandMatch[] {
  return DIAPER_BRANDS.map((brand) => {
    const hit = brand.sizes.filter((s) => fitsWeight(s, kg));
    const best = hit.length > 1 ? hit.reduce((a, c) => (Math.abs(midpoint(c) - kg) < Math.abs(midpoint(a) - kg) ? c : a)) : null;
    const nearest = [...brand.sizes].sort((a, c) => distance(a, kg) - distance(c, kg))[0];
    return { brand, matches: hit.map((size) => ({ size, best: size === best })), nearest };
  });
}
