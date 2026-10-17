import { z } from "zod";

/**
 * Zod schemas are the single source of truth for types AND for validating what comes out of localStorage / imports.
 * Fields carry defaults so data saved by earlier prototype revisions still loads.
 * Child records live under `data[profileId]`, so they don't repeat a profileId.
 */
const id = z.string().min(1);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const CATEGORIES = ["Prenatal", "Finance", "Doctor", "Exercise"] as const;
export const URGENCIES = ["High", "Medium", "Low"] as const;
export const PROVIDER_ROLES = ["OB/GYN", "Midwife", "Sonographer", "Specialist", "Hospital", "Paediatrician", "Doula", "Other"] as const;
export const BUDGET_STATUSES = ["Planned", "In Registry", "Obtained"] as const;
export const NURSERY_STATUSES = ["To buy", "Ordered", "Delivered", "Assembled", "Set up"] as const;
export const BAG_LISTS = ["bag-parent", "bag-partner", "bag-baby"] as const;
export const PHOTO_KINDS = ["maternity", "newborn", "combined"] as const;
export const ADVICE_SECTIONS = ["tips", "hospital", "postpartum"] as const;

export const ProfileSchema = z.object({
  id, nickname: z.string().min(1), lmp: isoDate, notes: z.string().default(""),
  status: z.enum(["active", "archived"]).default("active"),
  icon: z.string().default("🌸"),                       // an emoji or an image URL
  parentLabels: z.tuple([z.string(), z.string()]).default(["Me", "Partner"]),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().optional(),                      // bumped on every change; drives cloud-sync conflict resolution
});

export const TaskSchema = z.object({
  id, title: z.string(), week: z.number().int().min(0).max(42),
  category: z.enum(CATEGORIES), urgency: z.enum(URGENCIES), done: z.boolean().default(false), custom: z.boolean().optional(),
});
export const ProviderSchema = z.object({
  id, name: z.string().default(""), role: z.enum(PROVIDER_ROLES).default("Other"),
  phone: z.string().default(""), email: z.string().default(""), address: z.string().default(""),
});
export const AppointmentSchema = z.object({
  id, title: z.string(), week: z.number().int().min(0).max(42), dateOverride: z.string().default(""),
  providerId: z.string().default(""), isScan: z.boolean().default(false), done: z.boolean().default(false),
  notes: z.string().default(""), fileLink: z.string().default(""),
});
export const ChecklistItemSchema = z.object({ id, list: z.enum(BAG_LISTS), text: z.string(), done: z.boolean().default(false) });
export const NurseryItemSchema = z.object({
  id, text: z.string(), todo: z.string().default(""), status: z.enum(NURSERY_STATUSES).default("To buy"),
  done: z.boolean().default(false), link: z.string().default(""),
});
export const SwatchSchema = z.object({ id, name: z.string(), hex });
export const VisionItemSchema = z.object({
  id, image: z.string().default(""), notes: z.string().default(""), swatches: z.array(z.string()).default([]),
});
export const BudgetItemSchema = z.object({
  id, category: z.string(), item: z.string(), estimated: z.number().default(0), actual: z.number().nullable().default(null),
  status: z.enum(BUDGET_STATUSES).default("Planned"), link: z.string().default(""),
});
export const NameRuleSchema = z.object({ id, label: z.string() });
export const BabyNameSchema = z.object({
  id, name: z.string(), meaning: z.string().default(""), origin: z.string().default(""),
  checks: z.record(z.string(), z.boolean()).default({}),
  ratings: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  notes: z.string().default(""),
});
export const AdviceNoteSchema = z.object({ id, section: z.enum(ADVICE_SECTIONS), text: z.string() });
export const PostpartumStepSchema = z.object({ id, offsetDays: z.number().int(), title: z.string(), done: z.boolean().default(false) });
export const PhotographerSchema = z.object({
  id, kind: z.enum(PHOTO_KINDS), name: z.string(), portfolio: z.string().default(""), contact: z.string().default(""),
  price: z.number().nullable().default(null), length: z.string().default(""), images: z.string().default(""), notes: z.string().default(""),
});
export const DaycareSchema = z.object({
  id, name: z.string(), address: z.string().default(""), hours: z.string().default(""), fee: z.number().nullable().default(null),
  notes: z.string().default(""), contact: z.string().default(""),
});

export const ProfileDataSchema = z.object({
  tasks: z.array(TaskSchema).default([]),
  providers: z.array(ProviderSchema).default([]),
  appointments: z.array(AppointmentSchema).default([]),
  checklists: z.array(ChecklistItemSchema).default([]),
  nursery: z.array(NurseryItemSchema).default([]),
  palette: z.array(SwatchSchema).default([]),
  vision: z.array(VisionItemSchema).default([]),
  budget: z.array(BudgetItemSchema).default([]),
  nameRules: z.array(NameRuleSchema).default([]),
  names: z.array(BabyNameSchema).default([]),
  advice: z.array(AdviceNoteSchema).default([]),
  postpartum: z.array(PostpartumStepSchema).default([]),
  photographers: z.array(PhotographerSchema).default([]),
  photoAsked: z.record(z.string(), z.boolean()).default({}),
  daycares: z.array(DaycareSchema).default([]),
});

export const DEFAULT_THEME = { primary: "#00A693", bg: "#D7CFC2", accent: "#C5A57D", highlight: "#B5996D" };
export const ThemeSchema = z.object({
  primary: hex.default(DEFAULT_THEME.primary), bg: hex.default(DEFAULT_THEME.bg),
  accent: hex.default(DEFAULT_THEME.accent), highlight: hex.default(DEFAULT_THEME.highlight),
});

export const AppStateSchema = z.object({
  version: z.literal(1).default(1),
  activeId: z.string().nullable().default(null),
  profiles: z.array(ProfileSchema).default([]),
  data: z.record(z.string(), ProfileDataSchema).default({}),
  diaperWeight: z.string().default(""),
  diaperImages: z.record(z.string(), z.string()).default({}),   // "Brand|Size" → custom image URL / data URI
  theme: ThemeSchema.default(DEFAULT_THEME),
  settingsUpdatedAt: z.string().optional(),               // last time theme / diaper images changed (cloud sync)
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type NurseryItem = z.infer<typeof NurseryItemSchema>;
export type Swatch = z.infer<typeof SwatchSchema>;
export type VisionItem = z.infer<typeof VisionItemSchema>;
export type BudgetItem = z.infer<typeof BudgetItemSchema>;
export type NameRule = z.infer<typeof NameRuleSchema>;
export type BabyName = z.infer<typeof BabyNameSchema>;
export type AdviceNote = z.infer<typeof AdviceNoteSchema>;
export type PostpartumStep = z.infer<typeof PostpartumStepSchema>;
export type Photographer = z.infer<typeof PhotographerSchema>;
export type Daycare = z.infer<typeof DaycareSchema>;
export type ProfileData = z.infer<typeof ProfileDataSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type AppState = z.infer<typeof AppStateSchema>;

/** Keys of ProfileData that hold arrays of `{ id }` records (everything except `photoAsked`). */
export type ListKey = { [K in keyof ProfileData]: ProfileData[K] extends Array<{ id: string }> ? K : never }[keyof ProfileData];
export type ListItem<K extends ListKey> = ProfileData[K][number];
