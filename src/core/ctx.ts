import { computeEdd, daysToEdd, gestationalAge, parseDate, progressOf, startOfDay, weekDate } from './gestation';
import { activeProfile } from './state';
import { S } from './state';

/** The active profile with every derived gestational value; null before a profile exists. */
export function ctx() {
  const a = activeProfile();
  if (!a) return null;
  const lmp = parseDate(a.p.lmp), today = S.ui.today ? parseDate(S.ui.today) : startOfDay(new Date());
  const edd = computeEdd(lmp), ga = gestationalAge(lmp, today);
  return { id: a.id, p: a.p, lmp, edd, today, ga, daysToGo: daysToEdd(edd, today), progress: progressOf(ga.totalDays), dateOfWeek: (w: number) => weekDate(lmp, w) };
}
export type Ctx = NonNullable<ReturnType<typeof ctx>>;
