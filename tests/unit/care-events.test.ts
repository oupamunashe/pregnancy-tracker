import { describe, expect, it } from 'vitest';
import { carriedQuestions, daysUntil, liveMap, rsvpTally, splitAppts, weekAtDate } from '../../src/core/calc';
import { parseDate } from '../../src/core/gestation';

const ap = (date: string, status: any, extra: any = {}): any => ({ title: 't', type: 'Prenatal visit', date, status, at: 1, ...extra });

describe('care hub', () => {
  it('splits upcoming (soonest first) from completed (newest first), using time as a tiebreak', () => {
    const r = splitAppts([ap('2026-11-10', 'Scheduled'), ap('2026-10-01', 'Completed'), ap('2026-11-02', 'Scheduled', { time: '14:00' }), ap('2026-11-02', 'Scheduled', { time: '09:00' }), ap('2026-09-01', 'Completed')]);
    expect(r.upcoming.map(a => a.date + (a.time || ''))).toEqual(['2026-11-0209:00', '2026-11-0214:00', '2026-11-10']);
    expect(r.past.map(a => a.date)).toEqual(['2026-10-01', '2026-09-01']);
  });
  it('carries the questions from the latest completed visit forward', () => {
    expect(carriedQuestions([ap('2026-09-01', 'Completed', { questions: 'old' }), ap('2026-10-01', 'Completed', { questions: ' Ask about iron ' }), ap('2026-11-01', 'Scheduled', { questions: 'x' })])).toBe('Ask about iron');
    expect(carriedQuestions([ap('2026-10-01', 'Completed')])).toBe('');
  });
  it('works out the pregnancy week and days to go for a date', () => {
    expect(weekAtDate(parseDate('2026-09-17'), '2026-12-10')).toBe(12); expect(daysUntil('2026-10-20', parseDate('2026-10-17'))).toBe(3);
  });
});

describe('events planner', () => {
  it('tallies RSVPs and head-count (a "Yes" brings their plus-ones)', () => {
    const t = rsvpTally([{ name: 'A', rsvp: 'Yes', plus: 2 }, { name: 'B', rsvp: 'Yes' }, { name: 'C', rsvp: 'No', plus: 3 }, { name: 'D', rsvp: 'Maybe' }, { name: 'E', rsvp: 'Pending' }]);
    expect(t).toEqual({ yes: 2, no: 1, maybe: 1, pending: 1, heads: 4, invited: 5 });
  });
  it('nested maps hide deleted (null) entries', () => expect(liveMap({ a: { x: 1 }, b: null, c: { x: 3 } }).map(v => v.id)).toEqual(['a', 'c']));
});
