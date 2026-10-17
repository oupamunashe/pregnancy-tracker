import { describe, expect, it } from "vitest";
import { migrateRaw } from "./migrate";
import { AppStateSchema, ProfileDataSchema } from "./schemas";
import { seedProfileData } from "./templates";

describe("schemas & migration", () => {
  it("accepts freshly seeded profile data", () => {
    const parsed = ProfileDataSchema.safeParse(seedProfileData());
    expect(parsed.success).toBe(true);
    const d = seedProfileData();
    expect(d.tasks).toHaveLength(33);
    expect(d.palette.map((p) => p.hex)).toEqual(["#00A693", "#D7CFC2", "#C5A57D", "#B5996D"]);
  });

  it("fills defaults for an empty / partial state", () => {
    const s = AppStateSchema.parse({});
    expect(s.profiles).toEqual([]);
    expect(s.theme.primary).toBe("#00A693");
  });

  it("rejects malformed data", () => {
    expect(AppStateSchema.safeParse({ profiles: [{ id: "x", nickname: "n", lmp: "not-a-date" }] }).success).toBe(false);
  });

  it("migrates prototype data where nursery items lived in checklists", () => {
    const raw = {
      version: 1, activeId: "p1",
      profiles: [{ id: "p1", nickname: "Blueberry Peanut", lmp: "2026-09-17" }],
      data: { p1: { checklists: [{ id: "c1", list: "nursery", text: "Crib / cot", done: true }, { id: "c2", list: "bag-baby", text: "Wipes", done: false }] } },
    };
    const s = AppStateSchema.parse(migrateRaw(raw));
    const d = s.data.p1;
    expect(d.checklists.map((c) => c.list)).toEqual(["bag-baby"]);
    expect(d.nursery.find((n) => n.text === "Crib / cot")).toMatchObject({ done: true, status: "Set up" });
    expect(s.profiles[0].icon).toBe("🌸");
  });
});
