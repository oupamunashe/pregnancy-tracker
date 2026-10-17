import { describe, expect, it } from "vitest";
import { DIAPER_BRANDS, matchBrands, parseWeight, rangeText } from "./diaper";

const labels = (kg: number, brand: string) =>
  matchBrands(kg).find((b) => b.brand.brand === brand)!.matches.map((m) => m.size.label);

describe("diaper calculator", () => {
  it("parses weights with comma or dot", () => {
    expect(parseWeight("5,5")).toBe(5.5);
    expect(parseWeight("")).toBeNull();
    expect(parseWeight("-2")).toBeNull();
  });

  it("matches overlapping ranges (inclusive bounds)", () => {
    expect(labels(9.5, "Pampers")).toEqual(["Size 3", "Size 4"]);
    expect(labels(9.5, "Clicks Made 4 Baby")).toEqual(["Size 4 / Maxi"]);
    expect(labels(6, "Huggies")).toEqual(["Size 1", "Size 2", "Size 3"]);
  });

  it("supports open-ended top sizes", () => {
    expect(labels(20, "Pampers")).toEqual(["Size 6"]);
    expect(labels(16, "Huggies")).toEqual(["Size 5"]);
    expect(rangeText({ min: 13, max: null })).toBe("13+ kg");
  });

  it("marks one best fit when sizes overlap, none when only one fits", () => {
    const pampers = matchBrands(9.5).find((b) => b.brand.brand === "Pampers")!;
    expect(pampers.matches.filter((m) => m.best)).toHaveLength(1);
    const clicks = matchBrands(9.5).find((b) => b.brand.brand === "Clicks Made 4 Baby")!;
    expect(clicks.matches.some((m) => m.best)).toBe(false);
  });

  it("reports the nearest size when nothing fits", () => {
    const lovies = matchBrands(1).find((b) => b.brand.brand === "Lovies")!;
    expect(lovies.matches).toHaveLength(0);
    expect(lovies.nearest.label).toBe("Size 2 / Mini");
  });

  it("gives every size a default image, using an SVG placeholder where there is no retailer photo", () => {
    const all = DIAPER_BRANDS.flatMap((b) => b.sizes.map((s) => ({ brand: b.brand, ...s })));
    expect(all.every((s) => s.image.length > 0)).toBe(true);
    const placeholders = all.filter((s) => s.placeholder).map((s) => `${s.brand} ${s.label}`);
    expect(placeholders).toEqual([
      "Pampers Size 4+", "Clicks Made 4 Baby Size 1–2 / Newborn", "Clicks Made 4 Baby Size 3 / Midi",
      "Clicks Made 4 Baby Size 4 / Maxi", "Clicks Made 4 Baby Size 5 / Junior", "Clicks Made 4 Baby Size 6 / X-Large",
    ]);
    expect(all.filter((s) => s.placeholder).every((s) => s.image.startsWith("data:image/svg+xml"))).toBe(true);
    expect(all.filter((s) => !s.placeholder).every((s) => s.image.startsWith("https://"))).toBe(true);
  });
});
