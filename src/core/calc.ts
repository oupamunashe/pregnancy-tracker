/* Pure calculations for the kick counter, contraction timer and symptom summary (unit-tested). */
import type { Contraction, KickSession, Symptom, WithId } from './types';

export const KICK_GOAL = 10;
export const kickCount = (s: KickSession) => Object.values(s.taps || {}).filter(v => v != null).length;
/** Seconds from the first tap to the goal-th tap (the figure doctors ask about: "10 movements in how long?"), or null. */
export function secondsToGoal(s: KickSession): number | null {
  const t = Object.values(s.taps || {}).filter((v): v is number => v != null).sort((a, b) => a - b);
  return t.length >= s.goal ? Math.round((t[s.goal - 1] - s.start) / 1000) : null;
}
export const activeKick = (list: WithId<KickSession>[]) => [...list].filter(s => s.end == null).sort((a, b) => b.start - a.start)[0] || null;

export interface ContractionRow extends WithId<Contraction> { durationSec: number | null; intervalSec: number | null }
/** Newest first, with each contraction's length and the gap since the previous one STARTED. */
export function contractionRows(list: WithId<Contraction>[]): ContractionRow[] {
  const asc = [...list].sort((a, b) => a.start - b.start);
  return asc.map((c, i) => ({ ...c, durationSec: c.end != null ? Math.round((c.end - c.start) / 1000) : null, intervalSec: i ? Math.round((c.start - asc[i - 1].start) / 1000) : null })).reverse();
}

export interface Advice { level: 'none' | 'building' | 'go'; text: string }
/** 5-1-1: contractions ≤5 min apart, each lasting ≥1 min, for at least 1 hour. Information only — not medical advice. */
export function contractionAdvice(list: WithId<Contraction>[], now: number): Advice {
  const done = list.filter(c => c.end != null).sort((a, b) => a.start - b.start);
  const recent = done.filter(c => c.start >= now - 75 * 60 * 1000);
  if (recent.length < 4) return { level: 'none', text: 'Keep timing — you need several contractions to see a pattern.' };
  const intervals = recent.slice(1).map((c, i) => (c.start - recent[i].start) / 1000);
  const avgInt = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const avgDur = recent.reduce((a, c) => a + (c.end! - c.start) / 1000, 0) / recent.length;
  const spanMin = (recent[recent.length - 1].start - recent[0].start) / 60000;
  if (avgInt <= 300 && avgDur >= 60 && spanMin >= 60) return { level: 'go', text: 'This matches the 5-1-1 pattern (≈5 min apart, ≈1 min long, for an hour). Call your midwife/doctor or head to the hospital as advised.' };
  if (avgInt <= 420 && avgDur >= 45) return { level: 'building', text: 'Getting regular and closer together. Keep timing — 5-1-1 is the usual point to call.' };
  return { level: 'none', text: 'Not yet a 5-1-1 pattern. Keep timing; call your provider any time you are worried.' };
}

/** Symptom counts for the last `days` days, most frequent first. */
export function symptomSummary(list: WithId<Symptom>[], todayISO: string, days = 7): [string, number][] {
  const from = new Date(todayISO); from.setDate(from.getDate() - days);
  const lo = from.toISOString().slice(0, 10), m: Record<string, number> = {};
  list.filter(s => s.d >= lo).forEach(s => { m[s.kind] = (m[s.kind] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

/* ---------- budget ---------- */
import type { BabyName, BudgetItem, Daycare, DiaperEntry, PerPerson } from './types';
export interface BudgetTotals { est: number; actual: number; variance: number; obtained: number }
/** `variance` compares actual with the estimate of ONLY the items already bought (so unbought items don't look like savings). */
export function budgetTotals(list: BudgetItem[]): BudgetTotals {
  const est = list.reduce((s, b) => s + (b.est || 0), 0), actual = list.reduce((s, b) => s + (b.actual ?? 0), 0);
  const bought = list.filter(b => b.actual != null);
  return { est, actual, variance: actual - bought.reduce((s, b) => s + (b.est || 0), 0), obtained: list.filter(b => b.status === 'Obtained').length };
}
export const groupBy = <T>(list: T[], key: (t: T) => string): [string, T[]][] => { const m = new Map<string, T[]>(); list.forEach(t => { const k = key(t); m.set(k, [...(m.get(k) || []), t]); }); return [...m.entries()]; };
export const money = (n: number) => 'R ' + Math.round(n).toLocaleString('en-ZA').replace(/ /g, ' ');

/* ---------- names ---------- */
const nums = (v: PerPerson<number> | undefined) => [v?.P, v?.M].filter((x): x is number => typeof x === 'number' && x > 0);
export const nameAvg = (n: Pick<BabyName, 'votes'>): number => { const r = nums(n.votes); return r.length ? r.reduce((a, b) => a + b, 0) / r.length : 0; };
/** Both partners hearted it. */
export const nameMatch = (n: Pick<BabyName, 'fav'>): boolean => !!n.fav?.P && !!n.fav?.M;
export const nameFavs = (n: Pick<BabyName, 'fav'>): number => (n.fav?.P ? 1 : 0) + (n.fav?.M ? 1 : 0);
/** Matches first, then single favourites, then by average score, then alphabetical. */
export function rankNames<T extends BabyName>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(nameMatch(b)) - Number(nameMatch(a)) || nameFavs(b) - nameFavs(a) || nameAvg(b) - nameAvg(a) || a.name.localeCompare(b.name));
}
/** Both rated and the scores are far apart — worth talking about. */
export const nameDisagree = (n: Pick<BabyName, 'votes'>): boolean => nums(n.votes).length === 2 && Math.abs((n.votes!.P as number) - (n.votes!.M as number)) >= 4;

/* ---------- daycare ---------- */
export const careRating = (d: Pick<Daycare, 'ratings'>): number => { const r = nums(d.ratings); return r.length ? r.reduce((a, b) => a + b, 0) / r.length : 0; };
export const liveVisits = (d: Pick<Daycare, 'visits'>) => Object.entries(d.visits || {}).filter(([, v]) => v).map(([id, v]) => ({ id, ...(v as any) })).sort((a, b) => b.d.localeCompare(a.d));

/* ---------- diaper log ---------- */
const dayKey = (ms: number) => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
export interface DiaperDay { d: string; wet: number; dirty: number; both: number; total: number }
/** Per-day counts for the last `days` days (oldest → newest, including empty days). A "both" nappy counts once. */
export function diaperDays(list: DiaperEntry[], now: number, days = 7): DiaperDay[] {
  const out: DiaperDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dayKey(now - i * 86400000), day = list.filter(e => dayKey(e.at) === d);
    out.push({ d, wet: day.filter(e => e.kind === 'wet').length, dirty: day.filter(e => e.kind === 'dirty').length, both: day.filter(e => e.kind === 'both').length, total: day.length });
  }
  return out;
}
/** Average nappies per day over the most recent days that actually have entries (up to 3, ignoring today's partial count when older days exist). */
export function avgPerDay(days: DiaperDay[]): number {
  const full = days.slice(0, -1).filter(d => d.total > 0).slice(-3), use = full.length ? full : days.filter(d => d.total > 0).slice(-1);
  return use.length ? use.reduce((a, d) => a + d.total, 0) / use.length : 0;
}
export const daysOfNappiesLeft = (stock: number, perDay: number): number | null => (perDay > 0 && stock >= 0 ? Math.floor(stock / perDay) : null);

/** Nappies left = the stock count you set, minus nappies logged since you set it. */
export function nappiesRemaining(stock: { stock: number; at?: number } | undefined, list: DiaperEntry[]): number | null {
  if (!stock || typeof stock.stock !== 'number') return null;
  return Math.max(0, stock.stock - list.filter(e => e.at >= (stock.at || 0)).length);
}

/* ---------- care hub ---------- */
import type { Appointment, Guest } from './types';
import { diffDays, parseDate } from './gestation';
/** Appointments not yet completed, soonest first; completed ones, newest first. */
export const splitAppts = <T extends Appointment>(list: T[]) => ({
  upcoming: list.filter(a => a.status !== 'Completed').sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))),
  past: list.filter(a => a.status === 'Completed').sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''))),
});
/** Questions noted on the most recent completed visit — to ask at the NEXT one. */
export const carriedQuestions = <T extends Appointment>(list: T[]): string => splitAppts(list).past.find(a => (a.questions || '').trim())?.questions?.trim() || '';
export const weekAtDate = (lmp: Date, iso: string): number => Math.floor(diffDays(parseDate(iso), lmp) / 7);
export const daysUntil = (iso: string, today: Date): number => diffDays(parseDate(iso), today);

/* ---------- events ---------- */
export const rsvpTally = (guests: Guest[]) => {
  const yes = guests.filter(g => g.rsvp === 'Yes');
  return { yes: yes.length, no: guests.filter(g => g.rsvp === 'No').length, maybe: guests.filter(g => g.rsvp === 'Maybe').length, pending: guests.filter(g => g.rsvp === 'Pending').length, heads: yes.reduce((s, g) => s + 1 + Math.max(0, g.plus || 0), 0), invited: guests.length };
};
export const liveMap = <T>(m: Record<string, T | null> | undefined): (T & { id: string })[] => Object.entries(m || {}).filter(([, v]) => v).map(([id, v]) => ({ id, ...(v as any) }));
