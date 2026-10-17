import { describe, expect, it } from "vitest";
import {
  computeEdd, daysToEdd, formatLong, gestationalAge, isValidISO, parseDate, postpartumDate, progressOf,
  taskStatus, toISO, trimesterLabel, trimesterOf, weekDate,
} from "./gestation";

const lmp = parseDate("2026-09-17");

describe("gestational engine", () => {
  it("computes EDD = LMP + 280 days", () => {
    expect(formatLong(computeEdd(lmp))).toBe("24 June 2027");
  });

  it("computes gestational age in weeks and days", () => {
    expect(gestationalAge(lmp, parseDate("2026-10-17"))).toEqual({ totalDays: 30, weeks: 4, days: 2 });
    expect(gestationalAge(lmp, parseDate("2026-09-17"))).toEqual({ totalDays: 0, weeks: 0, days: 0 });
    expect(gestationalAge(lmp, parseDate("2027-06-24"))).toEqual({ totalDays: 280, weeks: 40, days: 0 });
  });

  it("handles dates before the LMP", () => {
    const ga = gestationalAge(lmp, parseDate("2026-09-10"));
    expect(ga.totalDays).toBe(-7);
    expect(trimesterLabel(ga)).toBe("Not started yet");
  });

  it("is DST-safe across a spring/autumn boundary", () => {
    const l = parseDate("2026-03-01"); // spans EU/US DST changes
    expect(gestationalAge(l, parseDate("2026-11-30")).totalDays).toBe(274);
    expect(toISO(computeEdd(l))).toBe("2026-12-06");
  });

  it("dates items as LMP + week × 7", () => {
    expect(toISO(weekDate(lmp, 12))).toBe("2026-12-10");
    expect(toISO(weekDate(lmp, 40))).toBe(toISO(computeEdd(lmp)));
  });

  it("dates postpartum steps from the EDD", () => {
    expect(toISO(postpartumDate(computeEdd(lmp), 42))).toBe("2027-08-05");
  });

  it("assigns trimesters at the boundaries", () => {
    expect([0, 13, 14, 27, 28, 40].map(trimesterOf)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it("clamps progress and counts down to the EDD", () => {
    expect(progressOf(-5)).toBe(0);
    expect(progressOf(140)).toBe(0.5);
    expect(progressOf(400)).toBe(1);
    expect(daysToEdd(computeEdd(lmp), parseDate("2026-10-17"))).toBe(250);
    expect(daysToEdd(computeEdd(lmp), parseDate("2027-06-26"))).toBe(-2);
  });

  it("derives task status from the current week", () => {
    expect(taskStatus({ week: 3, done: true }, 4)).toBe("Done");
    expect(taskStatus({ week: 3, done: false }, 4)).toBe("Overdue");
    expect(taskStatus({ week: 4, done: false }, 4)).toBe("This week");
    expect(taskStatus({ week: 5, done: false }, 4)).toBe("Upcoming");
  });

  it("validates ISO dates", () => {
    expect(isValidISO("2026-09-17")).toBe(true);
    expect(isValidISO("17/09/2026")).toBe(false);
    expect(isValidISO("")).toBe(false);
  });
});
