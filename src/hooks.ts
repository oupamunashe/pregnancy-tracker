"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { computeEdd, daysToEdd, gestationalAge, parseDate, progressOf, startOfToday, weekDate } from "@/lib/engine/gestation";

/** Active profile + its data + all derived gestational values. Only call inside <AppShell/> (a profile always exists there). */
export function useActive() {
  const profile = useStore((s) => s.profiles.find((p) => p.id === s.activeId)!);
  const data = useStore((s) => s.data[s.activeId!]);
  const simToday = useStore((s) => s.simToday);

  return useMemo(() => {
    const today = simToday ? parseDate(simToday) : startOfToday();
    const lmp = parseDate(profile.lmp);
    const edd = computeEdd(lmp);
    const ga = gestationalAge(lmp, today);
    return { profile, data, today, lmp, edd, ga, daysToGo: daysToEdd(edd, today), progress: progressOf(ga.totalDays), dateOfWeek: (w: number) => weekDate(lmp, w) };
  }, [profile, data, simToday]);
}
