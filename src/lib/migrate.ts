import { NURSERY_SEED } from "./templates";
import { uid } from "./utils";

/** Fills collections that earlier prototype revisions didn't have (e.g. nursery items used to live in `checklists`). */
export function migrateRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const s = raw as Record<string, unknown>;
  const data = (s.data ?? {}) as Record<string, Record<string, unknown>>;
  for (const d of Object.values(data)) {
    if (!d || typeof d !== "object" || d.nursery) continue;
    const old = ((d.checklists as { list: string; text: string; done: boolean }[]) ?? []);
    d.nursery = NURSERY_SEED.map(([text, todo]) => {
      const prev = old.find((c) => c.list === "nursery" && c.text.toLowerCase() === text.toLowerCase());
      return { id: uid("u_"), text, todo, status: prev?.done ? "Set up" : "To buy", done: !!prev?.done, link: "" };
    });
    d.checklists = old.filter((c) => c.list !== "nursery");
  }
  return s;
}
