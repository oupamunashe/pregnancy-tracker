/* Customizable navigation: up to 10 primary slots = Home + up to 7 chosen modules + More + Settings.
   The chosen modules (and their order) are saved per person in config/preg-nav, so Piepie and Munny each keep their own menu on every device. */
import type { Who } from './types';

export interface Module { id: string; icon: string; label: string; short: string }
/** Every module that can sit in the tab bar or in the More drawer. Home, More and Settings are fixed and not listed. */
export const MODULES: Module[] = [
  { id: 'weeks', icon: '📅', label: 'Weekly milestones', short: 'Weeks' },
  { id: 'care', icon: '🩺', label: 'Medical care & appointments', short: 'Care' },
  { id: 'events', icon: '🎉', label: 'Events & photography', short: 'Events' },
  { id: 'symptoms', icon: '📝', label: 'Symptom logger', short: 'Symptoms' },
  { id: 'kicks', icon: '👣', label: 'Kick counter', short: 'Kicks' },
  { id: 'contractions', icon: '⏱', label: 'Contraction timer', short: 'Timer' },
  { id: 'prep', icon: '🧳', label: 'Prep checklists', short: 'Prep' },
  { id: 'budget', icon: '💰', label: 'Budget', short: 'Budget' },
  { id: 'names', icon: '👶', label: 'Baby names', short: 'Names' },
  { id: 'nursery', icon: '🛏', label: 'Nursery', short: 'Nursery' },
  { id: 'photos', icon: '📸', label: 'Photo milestones', short: 'Photos' },
  { id: 'daycare', icon: '🏫', label: 'Daycare & caregivers', short: 'Daycare' },
  { id: 'supplies', icon: '🧷', label: 'Supplies & diapers', short: 'Supplies' },
];
export const MODULE_IDS = MODULES.map(m => m.id);
export const byId = (id: string) => MODULES.find(m => m.id === id);

export const MAX_SLOTS = 10, FIXED_SLOTS = 3, MAX_TABS = MAX_SLOTS - FIXED_SLOTS;   // Home, More, Settings are fixed → 7 chosen
export const DEFAULT_TABS = ['weeks', 'care', 'kicks', 'contractions', 'symptoms', 'prep', 'budget'];

/** Cleans a saved list: known modules only, no duplicates, at most 7. An empty/invalid pref falls back to the defaults. */
export function sanitizeTabs(tabs: unknown): string[] {
  if (!Array.isArray(tabs)) return [...DEFAULT_TABS];
  const out: string[] = [];
  for (const t of tabs) if (typeof t === 'string' && MODULE_IDS.includes(t) && !out.includes(t) && out.length < MAX_TABS) out.push(t);
  return out.length ? out : [...DEFAULT_TABS];
}
/** The tab list this person should see: their saved pick, else the defaults. */
export function tabsFor(cfg: Record<string, any> | undefined, who: Who | null): string[] {
  const nav = cfg?.['preg-nav'];
  return sanitizeTabs(who && nav ? (nav[who] as { tabs?: unknown } | undefined)?.tabs : undefined);
}

export interface NavLayout { bar: string[]; tabs: string[]; overflow: string[] }
/** bar = the primary slots in order (home, chosen…, more, settings); overflow = modules living in the More drawer. */
export function layout(tabs: string[]): NavLayout {
  const t = sanitizeTabs(tabs);
  return { bar: ['home', ...t, 'more', 'settings'], tabs: t, overflow: MODULE_IDS.filter(id => !t.includes(id)) };
}

export type Edit = { ok: true; tabs: string[] } | { ok: false; error: string };
export function addTab(tabs: string[], id: string): Edit {
  if (!MODULE_IDS.includes(id)) return { ok: false, error: 'Unknown module.' };
  if (tabs.includes(id)) return { ok: true, tabs };
  if (tabs.length >= MAX_TABS) return { ok: false, error: `The tab bar holds ${MAX_TABS} modules plus Home, More and Settings — remove one first.` };
  return { ok: true, tabs: [...tabs, id] };
}
export const removeTab = (tabs: string[], id: string): string[] => tabs.filter(t => t !== id);
export function moveTab(tabs: string[], id: string, dir: -1 | 1): string[] {
  const i = tabs.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= tabs.length) return tabs;
  const next = [...tabs]; [next[i], next[j]] = [next[j], next[i]]; return next;
}
