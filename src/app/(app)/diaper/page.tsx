"use client";

import { Card, Chip, Input } from "@/components/ui";
import { DiaperImage } from "@/components/DiaperImage";
import { matchBrands, parseWeight, rangeText, sizeKey } from "@/lib/diaper";
import { useStore } from "@/lib/store";

export default function DiaperPage() {
  const weight = useStore((s) => s.diaperWeight);
  const setWeight = useStore((s) => s.setDiaperWeight);
  const overrides = useStore((s) => s.diaperImages);
  const kg = parseWeight(weight);
  const results = kg === null ? [] : matchBrands(kg);

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-br from-rose-100 to-[var(--surface-card)]">
        <h2 className="font-bold text-lg">Diaper size calculator <Chip tone="brass">South Africa</Chip></h2>
        <label className="th block mt-3" htmlFor="wt">Baby&apos;s current weight (kg)</label>
        <div className="flex items-center gap-2 mt-1 max-w-xs">
          <Input id="wt" className="!text-xl !font-bold" type="number" min={0} max={40} step={0.1} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 5.5" />
          <span className="font-bold text-rose-700">kg</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Sizes overlap between brands — a &quot;best fit&quot; badge marks the size where your baby sits closest to the middle of the range. Always check the pack.</p>
      </Card>

      {kg === null ? (
        <Card className="text-center text-gray-500 py-6">Enter a weight to see matching sizes.</Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map(({ brand, matches, nearest }) => (
            <Card key={brand.brand} className="overflow-hidden">
              <div className="px-4 py-2 font-bold text-white" style={{ background: brand.color }}>{brand.brand}</div>
              <div className="p-4 space-y-3">
                {matches.map(({ size, best }) => (
                  <div key={size.label} className={`flex items-center gap-4 border border-honey-400 rounded-xl p-3 ${best ? "ring-2 ring-brass-400" : ""}`}>
                    <DiaperImage src={overrides[sizeKey(brand.brand, size.label)] || size.image} alt={`${brand.brand} ${size.label} pack`} color={brand.color} />
                    <div className="flex-1 min-w-0">
                      <div className="th" style={{ color: brand.color }}>{brand.brand}</div>
                      <div className="font-bold">{size.label}</div>
                      <Chip tone="soft" className="mt-1">{rangeText(size)}</Chip>
                      {best && <Chip tone="brass" className="ml-1">★ Best fit</Chip>}
                    </div>
                  </div>
                ))}
                {!matches.length && <p className="text-sm text-gray-500">No size in this range for {kg} kg. Nearest: {nearest.label} ({rangeText(nearest)}).</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
