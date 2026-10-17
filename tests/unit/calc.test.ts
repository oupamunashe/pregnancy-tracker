import { describe, expect, it } from 'vitest';
import { activeKick, contractionAdvice, contractionRows, kickCount, secondsToGoal, symptomSummary } from '../../src/core/calc';

const MIN = 60000;
describe('kick counter', () => {
  const s: any = { id: 'a', start: 0, end: null, goal: 3, taps: { t1: 60000, t2: 120000, t3: 300000, t4: null } };
  it('counts live taps only (tombstones ignored) and time to goal', () => { expect(kickCount(s)).toBe(3); expect(secondsToGoal(s)).toBe(300); expect(secondsToGoal({ ...s, goal: 5 })).toBeNull(); });
  it('finds the running session', () => expect(activeKick([{ ...s, end: 5 }, { ...s, id: 'b', start: 9 }])?.id).toBe('b'));
});
describe('contraction timer', () => {
  const mk = (startMin: number, lenSec = 70) => ({ id: 'c' + startMin, start: startMin * MIN, end: startMin * MIN + lenSec * 1000 });
  it('computes durations and gaps between starts, newest first', () => {
    const rows = contractionRows([mk(0), mk(5), mk(9)]);
    expect(rows.map(r => r.intervalSec)).toEqual([240, 300, null]); expect(rows[0].durationSec).toBe(70);
  });
  it('flags the 5-1-1 pattern after an hour of regular contractions', () => {
    const list = Array.from({ length: 14 }, (_, i) => mk(i * 5));          // every 5 min for 65 min, ~70 s long
    expect(contractionAdvice(list, 66 * MIN).level).toBe('go');
  });
  it('does not flag short or irregular runs', () => {
    expect(contractionAdvice([mk(0), mk(10)], 11 * MIN).level).toBe('none');
    expect(contractionAdvice(Array.from({ length: 6 }, (_, i) => mk(i * 12, 40)), 61 * MIN).level).toBe('none');
  });
});
describe('symptom summary', () => {
  it('counts the last 7 days, most frequent first', () => {
    const l: any[] = [{ id: '1', d: '2026-10-16', kind: 'Nausea' }, { id: '2', d: '2026-10-15', kind: 'Nausea' }, { id: '3', d: '2026-10-14', kind: 'Fatigue' }, { id: '4', d: '2026-09-01', kind: 'Nausea' }];
    expect(symptomSummary(l, '2026-10-17')).toEqual([['Nausea', 2], ['Fatigue', 1]]);
  });
});
