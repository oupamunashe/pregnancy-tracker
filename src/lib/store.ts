"use client";

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { AppStateSchema, DEFAULT_THEME, type AppState, type ListItem, type ListKey, type Profile, type ProfileData, type Theme } from "./schemas";
import { migrateRaw } from "./migrate";
import { seedProfileData } from "./templates";
import { uid } from "./utils";

export const STORAGE_KEY = "pregtracker.v1";

/** Persisted slice (identical shape to the prototype's `pregtracker.v1` entry, so prototype data loads as-is). */
type Persisted = Pick<AppState, "version" | "activeId" | "profiles" | "data" | "diaperWeight" | "diaperImages" | "theme" | "settingsUpdatedAt">;

interface Actions {
  createProfile: (input: { nickname: string; lmp: string; notes?: string; icon?: string }) => string;
  updateProfile: (id: string, patch: Partial<Omit<Profile, "id">>) => void;
  deleteProfile: (id: string) => void;
  setActive: (id: string) => void;
  add: <K extends ListKey>(key: K, item: ListItem<K>) => void;
  update: <K extends ListKey>(key: K, id: string, patch: Partial<ListItem<K>>) => void;
  remove: (key: ListKey, id: string) => void;
  patchData: (patch: Partial<ProfileData>) => void;
  setTheme: (patch: Partial<Theme>) => void;
  resetTheme: () => void;
  setDiaperWeight: (v: string) => void;
  setDiaperImage: (key: string, url: string | null) => void;
  setSimToday: (iso: string) => void;
  /** Cloud sync: replace/insert a profile exactly as stored remotely (does not bump updatedAt). */
  applyRemoteProfile: (profile: Profile, data: ProfileData) => void;
  applyRemoteSettings: (theme: Theme, diaperImages: Record<string, string>, updatedAt: string) => void;
  importState: (raw: unknown) => { ok: true } | { ok: false; error: string };
  resetAll: () => void;
}

interface Ephemeral { hydrated: boolean; simToday: string }
export type Store = Persisted & Actions & Ephemeral;

const empty = (): Persisted => ({ version: 1, activeId: null, profiles: [], data: {}, diaperWeight: "", diaperImages: {}, theme: DEFAULT_THEME });

const storage: PersistStorage<Persisted> = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      const parsed = AppStateSchema.safeParse(migrateRaw(JSON.parse(raw)));
      return parsed.success ? { state: parsed.data, version: 1 } : null;   // invalid → fall back to onboarding
    } catch { return null; }
  },
  setItem: (name, value) => { try { localStorage.setItem(name, JSON.stringify(value.state)); } catch { /* quota / private mode */ } },
  removeItem: (name) => { try { localStorage.removeItem(name); } catch { /* ignore */ } },
};

export const useStore = create<Store>()(
  persist(
    (set) => {
      const now = () => new Date().toISOString();
      const mutate = (fn: (d: ProfileData) => ProfileData) =>
        set((s) =>
          s.activeId && s.data[s.activeId]
            ? { data: { ...s.data, [s.activeId]: fn(s.data[s.activeId]) }, profiles: s.profiles.map((p) => (p.id === s.activeId ? { ...p, updatedAt: now() } : p)) }
            : s);

      return {
        ...empty(),
        hydrated: false,
        simToday: "",

        createProfile: ({ nickname, lmp, notes = "", icon = "🌸" }) => {
          const id = uid("p_");
          const profile: Profile = { id, nickname: nickname.trim(), lmp, notes, icon, status: "active", parentLabels: ["Me", "Partner"], createdAt: now(), updatedAt: now() };
          set((s) => ({ profiles: [...s.profiles, profile], data: { ...s.data, [id]: seedProfileData() }, activeId: id }));
          return id;
        },
        updateProfile: (id, patch) => set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now() } : p)) })),
        deleteProfile: (id) =>
          set((s) => {
            const profiles = s.profiles.filter((p) => p.id !== id);
            const { [id]: _removed, ...data } = s.data;
            void _removed;
            const activeId = s.activeId === id ? (profiles.find((p) => p.status === "active") ?? profiles[0])?.id ?? null : s.activeId;
            return { profiles, data, activeId };
          }),
        setActive: (id) => set({ activeId: id }),

        add: (key, item) => mutate((d) => ({ ...d, [key]: [...(d[key] as ListItem<typeof key>[]), item] })),
        update: (key, id, patch) =>
          mutate((d) => ({ ...d, [key]: (d[key] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
        remove: (key, id) => mutate((d) => ({ ...d, [key]: (d[key] as { id: string }[]).filter((x) => x.id !== id) })),
        patchData: (patch) => mutate((d) => ({ ...d, ...patch })),

        setTheme: (patch) => set((s) => ({ theme: { ...s.theme, ...patch }, settingsUpdatedAt: now() })),
        resetTheme: () => set({ theme: DEFAULT_THEME, settingsUpdatedAt: now() }),
        setDiaperWeight: (v) => set({ diaperWeight: v }),
        setDiaperImage: (key, url) =>
          set((s) => {
            const next = { ...s.diaperImages };
            if (url) next[key] = url; else delete next[key];
            return { diaperImages: next, settingsUpdatedAt: now() };
          }),
        setSimToday: (iso) => set({ simToday: iso }),
        applyRemoteProfile: (profile, data) =>
          set((s) => ({
            profiles: s.profiles.some((p) => p.id === profile.id) ? s.profiles.map((p) => (p.id === profile.id ? profile : p)) : [...s.profiles, profile],
            data: { ...s.data, [profile.id]: data },
            activeId: s.activeId ?? profile.id,
          })),
        applyRemoteSettings: (theme, diaperImages, updatedAt) => set({ theme, diaperImages, settingsUpdatedAt: updatedAt }),

        importState: (raw) => {
          const parsed = AppStateSchema.safeParse(migrateRaw(raw));
          if (!parsed.success) return { ok: false, error: "That file isn't a valid Pregnancy Tracker export." };
          set({ ...parsed.data });
          return { ok: true };
        },
        resetAll: () => { set({ ...empty() }); storage.removeItem(STORAGE_KEY); },
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,
      storage,
      skipHydration: true,   // rehydrated in <StoreHydrator/> after mount — avoids SSR/client markup mismatch
      partialize: (s): Persisted => ({ version: 1, activeId: s.activeId, profiles: s.profiles, data: s.data, diaperWeight: s.diaperWeight, diaperImages: s.diaperImages, theme: s.theme, settingsUpdatedAt: s.settingsUpdatedAt }),
    },
  ),
);
