import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

/**
 * Gestational engine — the single source of truth for every date in the app.
 * All inputs/outputs are date-only values ("YYYY-MM-DD") handled as LOCAL calendar dates,
 * so there is never a UTC/timezone drift.
 */

export const PREGNANCY_DAYS = 280;

export type Trimester = 1 | 2 | 3;
export type TaskStatus = "Done" | "Overdue" | "This week" | "Upcoming";

export interface GestationalAge {
  /** Total days since LMP (negative before LMP). */
  totalDays: number;
  weeks: number;
  days: number;
}

export const parseDate = (iso: string): Date => parseISO(iso);
export const toISO = (d: Date): string => format(d, "yyyy-MM-dd");
export const formatLong = (d: Date): string => format(d, "d MMMM yyyy");
export const isValidISO = (iso: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(parseISO(iso).getTime());

export function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** EDD = LMP + 280 days. */
export const computeEdd = (lmp: Date): Date => addDays(lmp, PREGNANCY_DAYS);

/** Date for week N of the pregnancy: LMP + N × 7 days (tasks, scans, check-ins). */
export const weekDate = (lmp: Date, week: number): Date => addDays(lmp, week * 7);

/** Date for a postpartum step: EDD + offset days. */
export const postpartumDate = (edd: Date, offsetDays: number): Date => addDays(edd, offsetDays);

export function gestationalAge(lmp: Date, today: Date): GestationalAge {
  const totalDays = differenceInCalendarDays(today, lmp);
  if (totalDays < 0) return { totalDays, weeks: 0, days: 0 };
  return { totalDays, weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

export const trimesterOf = (week: number): Trimester => (week <= 13 ? 1 : week <= 27 ? 2 : 3);

/** 0..1, clamped. */
export const progressOf = (totalDays: number): number => Math.max(0, Math.min(1, totalDays / PREGNANCY_DAYS));

/** Days until the EDD (negative once past it). */
export const daysToEdd = (edd: Date, today: Date): number => differenceInCalendarDays(edd, today);

export function taskStatus(task: { week: number; done: boolean }, currentWeek: number): TaskStatus {
  if (task.done) return "Done";
  if (task.week < currentWeek) return "Overdue";
  if (task.week === currentWeek) return "This week";
  return "Upcoming";
}

export function trimesterLabel(ga: GestationalAge): string {
  if (ga.totalDays < 0) return "Not started yet";
  if (ga.weeks > 42) return "Past 42 weeks";
  return `Trimester ${trimesterOf(ga.weeks)}`;
}
