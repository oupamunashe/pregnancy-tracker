import { describe, expect, it } from 'vitest';
import { avgPerDay, budgetTotals, careRating, daysOfNappiesLeft, diaperDays, groupBy, liveVisits, nameAvg, nameDisagree, nameMatch, rankNames } from '../../src/core/calc';
import { matchBrands, parseWeight, placeholderImage } from '../../src/core/diaper';

describe('budget', () => {
  const b: any[] = [{ category: 'Gear', item: 'Pram', est: 6500, actual: 7000, status: 'Obtained' }, { category: 'Gear', item: 'Seat', est: 3200, actual: null, status: 'Planned' }, { category: 'Nursery', item: 'Cot', est: 3500, actual: 3000, status: 'Obtained' }];
  it('totals and variance only count bought items', () => {
    // bought: pram (est 6500, paid 7000) + cot (est 3500, paid 3000) → +500 −500 = 0; the unbought seat adds nothing
    expect(budgetTotals(b)).toEqual({ est: 13200, actual: 10000, variance: 0, obtained: 2 });
  });
  it('groups by category in first-seen order', () => expect(groupBy(b, x => x.category).map(([k, v]) => [k, v.length])).toEqual([['Gear', 2], ['Nursery', 1]]));
});

describe('baby names (each partner writes only their own key)', () => {
  const mk = (name: string, votes: any, fav: any): any => ({ name, votes, fav, at: 1 });
  it('averages only given votes and detects a match', () => {
    expect(nameAvg(mk('A', { P: 8, M: 6 }, {}))).toBe(7); expect(nameAvg(mk('B', { P: 9, M: null }, {}))).toBe(9); expect(nameAvg(mk('C', {}, {}))).toBe(0);
    expect(nameMatch(mk('A', {}, { P: true, M: true }))).toBe(true); expect(nameMatch(mk('A', {}, { P: true, M: false }))).toBe(false);
  });
  it('ranks matches first, then favourites, then score', () => {
    const r = rankNames([mk('Zed', { P: 10 }, {}), mk('Match', { P: 5, M: 5 }, { P: true, M: true }), mk('Fav', { P: 6 }, { M: true })]);
    expect(r.map(x => x.name)).toEqual(['Match', 'Fav', 'Zed']);
  });
  it('flags big disagreements', () => { expect(nameDisagree(mk('A', { P: 9, M: 3 }, {}))).toBe(true); expect(nameDisagree(mk('A', { P: 9, M: 8 }, {}))).toBe(false); });
});

describe('daycare', () => {
  it('averages ratings and lists visits newest first, skipping tombstones', () => {
    expect(careRating({ ratings: { P: 8, M: 6 } })).toBe(7);
    expect(liveVisits({ visits: { a: { d: '2026-10-01' }, b: { d: '2026-11-01' }, c: null } }).map(v => v.id)).toEqual(['b', 'a']);
  });
});

describe('diaper log', () => {
  const T = new Date(2026, 9, 17, 12).getTime(), H = 3600000, D = 86400000;
  const e = (ms: number, kind = 'wet'): any => ({ at: ms, kind });
  it('counts per day (a "both" nappy is one nappy) and fills empty days', () => {
    const days = diaperDays([e(T), e(T - H, 'dirty'), e(T - 2 * H, 'both'), e(T - D)], T, 3);
    expect(days.map(d => d.total)).toEqual([0, 1, 3]); expect(days[2]).toMatchObject({ wet: 1, dirty: 1, both: 1 });
  });
  it('averages the last full days and projects how long the stock lasts', () => {
    const days = diaperDays([...Array(8).fill(0).map((_, i) => e(T - D + i * H)), ...Array(10).fill(0).map((_, i) => e(T - 2 * D + i * H)), e(T)], T, 7);
    expect(avgPerDay(days)).toBe(9); expect(daysOfNappiesLeft(40, 9)).toBe(4); expect(daysOfNappiesLeft(40, 0)).toBeNull();
  });
});

describe('diaper sizes', () => {
  it('matches overlapping SA brand ranges with a best fit', () => {
    const p = matchBrands(9.5).find(b => b.brand.brand === 'Pampers')!;
    expect(p.matches.map(m => m.size.label)).toEqual(['Size 3', 'Size 4']); expect(p.matches.filter(m => m.best)).toHaveLength(1);
    expect(matchBrands(20).find(b => b.brand.brand === 'Pampers')!.matches.map(m => m.size.label)).toEqual(['Size 6']);
    expect(parseWeight('5,5')).toBe(5.5); expect(parseWeight('')).toBeNull();
  });
  it('produces a self-contained placeholder image', () => expect(placeholderImage('Clicks Made 4 Baby', 'Size 3 / Midi', '#e2231a')).toMatch(/^data:image\/svg\+xml/));
});
