/* Gestational engine — every date in the app derives from the LMP.
   Dates are "YYYY-MM-DD" strings handled as LOCAL calendar dates (never via new Date("YYYY-MM-DD"), which is UTC). */
export const PREGNANCY_DAYS = 280;

export const parseDate = (iso: string): Date => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
export const toISO = (d: Date): string => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const addDays = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Whole calendar days from b to a (DST-safe). */
export const diffDays = (a: Date, b: Date): number => Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 86400000);
export const isValidISO = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s) && toISO(parseDate(s)) === s;
export const startOfDay = (n: Date): Date => new Date(n.getFullYear(), n.getMonth(), n.getDate());
export const todayDate = (): Date => startOfDay(new Date());
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const longDate = (d: Date): string => d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
export const shortDate = (d: Date): string => d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3);

export const computeEdd = (lmp: Date): Date => addDays(lmp, PREGNANCY_DAYS);
export const weekDate = (lmp: Date, week: number): Date => addDays(lmp, week * 7);

export interface GA { totalDays: number; weeks: number; days: number }
export function gestationalAge(lmp: Date, today: Date): GA {
  const totalDays = diffDays(today, lmp);
  return totalDays < 0 ? { totalDays, weeks: 0, days: 0 } : { totalDays, weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}
export const trimesterOf = (week: number): 1 | 2 | 3 => (week <= 13 ? 1 : week <= 27 ? 2 : 3);
export const progressOf = (totalDays: number): number => Math.max(0, Math.min(1, totalDays / PREGNANCY_DAYS));
export const daysToEdd = (edd: Date, today: Date): number => diffDays(edd, today);
