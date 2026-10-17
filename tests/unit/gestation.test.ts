import { describe, expect, it } from 'vitest';
import { addDays, computeEdd, daysToEdd, gestationalAge, isValidISO, longDate, parseDate, progressOf, toISO, trimesterOf, weekDate } from '../../src/core/gestation';

const lmp = parseDate('2026-09-17');
describe('gestational engine', () => {
  it('EDD = LMP + 280 days', () => expect(longDate(computeEdd(lmp))).toBe('24 June 2027'));
  it('age in weeks + days', () => {
    expect(gestationalAge(lmp, parseDate('2026-10-17'))).toEqual({ totalDays: 30, weeks: 4, days: 2 });
    expect(gestationalAge(lmp, parseDate('2027-06-24'))).toEqual({ totalDays: 280, weeks: 40, days: 0 });
    expect(gestationalAge(lmp, parseDate('2026-09-10')).totalDays).toBe(-7);
  });
  it('is DST-safe', () => { const l = parseDate('2026-03-01'); expect(gestationalAge(l, parseDate('2026-11-30')).totalDays).toBe(274); expect(toISO(computeEdd(l))).toBe('2026-12-06'); });
  it('dates weeks as LMP + 7n', () => { expect(toISO(weekDate(lmp, 12))).toBe('2026-12-10'); expect(toISO(weekDate(lmp, 40))).toBe(toISO(computeEdd(lmp))); });
  it('trimesters, progress, countdown', () => {
    expect([0, 13, 14, 27, 28, 40].map(trimesterOf)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(progressOf(-5)).toBe(0); expect(progressOf(140)).toBe(0.5); expect(progressOf(999)).toBe(1);
    expect(daysToEdd(computeEdd(lmp), parseDate('2026-10-17'))).toBe(250);
  });
  it('validates ISO dates', () => { expect(isValidISO('2026-09-17')).toBe(true); expect(isValidISO('2026-02-31')).toBe(false); expect(isValidISO('')).toBe(false); expect(toISO(addDays(lmp, 1))).toBe('2026-09-18'); });
});
