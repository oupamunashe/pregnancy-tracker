import type { ListKey } from "./schemas";

/** Maps each profile list in the store to its Supabase table (see supabase/migrations/0001_init.sql). */
export const TABLES: { key: ListKey; table: string }[] = [
  { key: "tasks", table: "tasks" },
  { key: "providers", table: "providers" },
  { key: "appointments", table: "appointments" },
  { key: "checklists", table: "checklist_items" },
  { key: "nursery", table: "nursery_items" },
  { key: "palette", table: "swatches" },
  { key: "vision", table: "vision_items" },
  { key: "budget", table: "budget_items" },
  { key: "nameRules", table: "name_rules" },
  { key: "names", table: "baby_names" },
  { key: "advice", table: "advice_notes" },
  { key: "postpartum", table: "postpartum_steps" },
  { key: "photographers", table: "photographers" },
  { key: "daycares", table: "daycares" },
];

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Store item → DB row. Column names are the snake_case of the field names; arrays/objects go into jsonb columns as-is. */
export function toRow(item: { id: string }, userId: string, profileId: string, position: number): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId, profile_id: profileId, position };
  for (const [k, v] of Object.entries(item)) if (v !== undefined) row[toSnake(k)] = v;
  return row;
}

/** DB row → store item (drops the bookkeeping columns). */
export function fromRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === "user_id" || k === "profile_id" || k === "position") continue;
    out[toCamel(k)] = v;
  }
  return out;
}

export const ts = (iso: string | undefined | null): number => (iso ? Date.parse(iso) : 0) || 0;
