import { describe, expect, it } from "vitest";
import { ProfileDataSchema } from "./schemas";
import { seedProfileData } from "./templates";
import { fromRow, TABLES, toRow, ts } from "./sync-map";

describe("sync mapping", () => {
  it("converts camelCase store items to snake_case rows and back", () => {
    const item = { id: "a_1", title: "Dating scan", week: 8, dateOverride: "", providerId: "", isScan: true, done: false, notes: "", fileLink: "" };
    const row = toRow(item, "p_1", 3);
    expect(row).toMatchObject({ profile_id: "p_1", position: 3, date_override: "", provider_id: "", is_scan: true, file_link: "" });
    expect(fromRow(row)).toEqual(item);
  });

  it("drops undefined fields and keeps nulls / jsonb values", () => {
    const row = toRow({ id: "n_1", ratings: [8, null], checks: { r1: true }, custom: undefined } as { id: string }, "p", 0);
    expect("custom" in row).toBe(false);
    expect(row.ratings).toEqual([8, null]);
    expect(row.checks).toEqual({ r1: true });
  });

  it("round-trips an entire seeded profile through rows and the Zod schema", () => {
    const data = seedProfileData();
    const raw: Record<string, unknown> = { photoAsked: data.photoAsked };
    for (const { key } of TABLES) {
      raw[key] = (data[key] as { id: string }[]).map((it, i) => fromRow(toRow(it, "p", i)));
    }
    expect(ProfileDataSchema.parse(raw)).toEqual(data);
  });

  it("covers every list in ProfileData", () => {
    const lists = Object.keys(seedProfileData()).filter((k) => k !== "photoAsked").sort();
    expect(TABLES.map((t) => t.key).sort()).toEqual(lists);
  });

  it("compares timestamps safely", () => {
    expect(ts("2026-10-17T10:00:00.000Z")).toBeGreaterThan(ts("2026-10-17T09:00:00.000Z"));
    expect(ts(undefined)).toBe(0);
  });
});
