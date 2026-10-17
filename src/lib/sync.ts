"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { create } from "zustand";
import { ProfileDataSchema, ThemeSchema, type Profile, type ProfileData } from "./schemas";
import { useStore } from "./store";
import { fromRow, toRow, TABLES, ts } from "./sync-map";
import { getSupabase, isSyncConfigured, supabaseHost } from "./supabase/client";

/**
 * Local-first cloud sync for a PRIVATE two-person household: Supabase RLS only admits allow-listed emails, and both people
 * share the same rows.
 *
 * Local-first cloud sync. localStorage stays the source of truth for the UI; when the user signs in,
 * each profile is reconciled with Supabase using last-write-wins on `updatedAt` (profile granularity):
 *   local newer  → push (upsert rows, delete rows removed locally)
 *   remote newer → pull (validated with Zod, then replaces the local profile)
 * Nothing leaves the device until the user signs in.
 */

interface SyncStatus {
  configured: boolean;
  email: string | null;
  syncing: boolean;
  lastSynced: string | null;
  error: string | null;
  /** The stored session has been checked (so the UI knows whether to show the login screen). */
  authChecked: boolean;
  /** The first successful sync after sign-in has finished (so a new device doesn't offer onboarding before its data arrives). */
  firstSyncDone: boolean;
  /** Realtime channel is connected. */
  live: boolean;
  set: (p: Partial<Omit<SyncStatus, "set">>) => void;
}
export const useSyncStatus = create<SyncStatus>((set) => ({
  configured: isSyncConfigured(), email: null, syncing: false, lastSynced: null, error: null, authChecked: false, firstSyncDone: false, live: false, set: (p) => set(p),
}));

const CHUNK = 400;
/** Turns the browser's opaque "Failed to fetch" into something actionable. */
const explain = (message: string) =>
  /failed to fetch|networkerror|load failed|fetch failed/i.test(message)
    ? `couldn't reach Supabase (${supabaseHost()}). Check your internet connection and that the Supabase project isn't paused (Dashboard → project → Restore). If it persists, the NEXT_PUBLIC_SUPABASE_URL secret used for the build may be wrong.`
    : message;
const fail = (what: string, e: { message: string } | null) => { if (e) throw new Error(`${what}: ${explain(e.message)}`); };

async function pushProfile(sb: SupabaseClient, p: Profile, data: ProfileData) {
  const { error } = await sb.from("profiles").upsert({
    id: p.id, nickname: p.nickname, lmp: p.lmp, notes: p.notes, status: p.status, icon: p.icon,
    parent_labels: p.parentLabels, photo_asked: data.photoAsked, created_at: p.createdAt, updated_at: p.updatedAt ?? p.createdAt,
  }, { onConflict: "id" });
  fail("profile", error);

  for (const { key, table } of TABLES) {
    const items = data[key] as { id: string }[];
    const rows = items.map((it, i) => toRow(it, p.id, i));
    for (let i = 0; i < rows.length; i += CHUNK) {
      const r = await sb.from(table).upsert(rows.slice(i, i + CHUNK), { onConflict: "id" });
      fail(table, r.error);
    }
    // remove rows that were deleted locally
    const del = sb.from(table).delete().eq("profile_id", p.id);
    const r = items.length ? await del.not("id", "in", `(${items.map((it) => `"${it.id}"`).join(",")})`) : await del;
    fail(`${table} cleanup`, r.error);
  }
}

async function pullProfile(sb: SupabaseClient, id: string) {
  const { data: pr, error } = await sb.from("profiles").select("*").eq("id", id).single();
  fail("profile", error);
  const lists = await Promise.all(TABLES.map(({ table }) => sb.from(table).select("*").eq("profile_id", id).order("position", { ascending: true })));
  const raw: Record<string, unknown> = { photoAsked: pr.photo_asked ?? {} };
  TABLES.forEach(({ key, table }, i) => {
    fail(table, lists[i].error);
    raw[key] = (lists[i].data ?? []).map((r) => fromRow(r as Record<string, unknown>));
  });
  const data = ProfileDataSchema.parse(raw);   // never trust remote shape blindly
  const profile: Profile = {
    id: pr.id, nickname: pr.nickname, lmp: pr.lmp, notes: pr.notes, status: pr.status, icon: pr.icon,
    parentLabels: pr.parent_labels, createdAt: pr.created_at, updatedAt: pr.updated_at,
  };
  useStore.getState().applyRemoteProfile(profile, data);
}

async function syncSettings(sb: SupabaseClient, userId: string) {
  const st = useStore.getState();
  const { data: remote, error } = await sb.from("user_settings").select("*").maybeSingle();
  fail("settings", error);
  const local = ts(st.settingsUpdatedAt);
  const rt = remote ? ts(remote.updated_at) : -1;
  if (remote && rt > local) {
    const theme = ThemeSchema.safeParse(remote.theme);
    if (theme.success) st.applyRemoteSettings(theme.data, (remote.diaper_images ?? {}) as Record<string, string>, remote.updated_at);
  } else if (local > rt && st.settingsUpdatedAt) {
    const { error: e } = await sb.from("user_settings").upsert({ user_id: userId, theme: st.theme, diaper_images: st.diaperImages, updated_at: st.settingsUpdatedAt });
    fail("settings", e);
  }
}

let running: Promise<void> | null = null;

/** Reconciles local state with Supabase. Safe to call repeatedly; concurrent calls share one run. */
export function syncNow(): Promise<void> {
  if (running) return running;
  const status = useSyncStatus.getState();
  running = (async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("Cloud sync isn't configured.");
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error("Sign in to sync.");
    status.set({ syncing: true, error: null });
    try {
      const uid = session.user.id;   // used for per-user settings only
      const { data: remote, error } = await sb.from("profiles").select("id, updated_at");
      fail("profiles", error);
      const remoteMap = new Map((remote ?? []).map((r) => [r.id as string, ts(r.updated_at as string)]));

      for (const p of useStore.getState().profiles) {
        const lt = ts(p.updatedAt ?? p.createdAt);
        const rt = remoteMap.get(p.id);
        if (rt === undefined || lt > rt) await pushProfile(sb, p, useStore.getState().data[p.id]);
        else if (rt > lt) await pullProfile(sb, p.id);
        remoteMap.delete(p.id);
      }
      for (const id of remoteMap.keys()) await pullProfile(sb, id);   // profiles that exist only in the cloud
      await syncSettings(sb, uid);
      useSyncStatus.getState().set({ lastSynced: new Date().toISOString(), firstSyncDone: true });
    } catch (e) {
      useSyncStatus.getState().set({ error: e instanceof Error ? e.message : String(e) });
      throw e;
    } finally {
      useSyncStatus.getState().set({ syncing: false });
    }
  })().finally(() => { running = null; });
  return running;
}

export async function deleteRemoteProfile(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb || !useSyncStatus.getState().email) return;
  const { error } = await sb.from("profiles").delete().eq("id", id);   // child rows cascade
  if (error) useSyncStatus.getState().set({ error: error.message });
}

export async function sendMagicLink(email: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Cloud sync isn't configured.");
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/dashboard/` } });
  fail("sign-in", error);
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Cloud sync isn't configured.");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  fail("sign-in", error);
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
  useSyncStatus.getState().set({ email: null, lastSynced: null, error: null, firstSyncDone: false, live: false });
}

/** Pushes pending changes, signs out, and removes this device's local copy so nothing stays readable while logged out. */
export async function signOutAndWipe(): Promise<void> {
  await syncNow();                       // throws if the latest changes couldn't be saved — the caller decides what to do
  await signOut();
  useStore.getState().resetAll();
}

/**
 * Tracks the auth session; while signed in it
 *  - syncs (debounced) after local edits,
 *  - listens to Supabase Realtime so the other person's changes appear live,
 *  - re-syncs when the app regains focus and once a minute (safety net if the socket drops).
 * Returns a cleanup function.
 */
export function startAutoSync(): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const status = useSyncStatus.getState;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let channel: ReturnType<SupabaseClient["channel"]> | null = null;

  const schedule = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (status().email) syncNow().catch(() => {}); }, ms);
  };

  const disconnectRealtime = () => { if (channel) { void sb.removeChannel(channel); channel = null; } status().set({ live: false }); };
  const connectRealtime = () => {
    if (channel) return;
    channel = sb.channel("household-changes");
    // a deleted profile disappears from the other device too
    channel.on("postgres_changes", { event: "DELETE", schema: "public", table: "profiles" }, (payload) => {
      const id = (payload.old as { id?: string }).id;
      if (id) useStore.getState().deleteProfile(id);
    });
    for (const { table } of [{ table: "profiles" }, ...TABLES]) {
      channel.on("postgres_changes", { event: "INSERT", schema: "public", table }, () => schedule(300));
      channel.on("postgres_changes", { event: "UPDATE", schema: "public", table }, () => schedule(300));
      if (table !== "profiles") channel.on("postgres_changes", { event: "DELETE", schema: "public", table }, () => schedule(300));
    }
    channel.subscribe((s) => status().set({ live: s === "SUBSCRIBED" }));
  };

  const onSession = (email: string | null) => {
    status().set({ email, authChecked: true });
    if (email) { connectRealtime(); schedule(0); } else disconnectRealtime();
  };
  const { data: sub } = sb.auth.onAuthStateChange((_e, session) => onSession(session?.user.email ?? null));
  void sb.auth.getSession().then(({ data }) => onSession(data.session?.user.email ?? null));

  const unsub = useStore.subscribe((s, prev) => {
    if (s.profiles !== prev.profiles || s.data !== prev.data || s.settingsUpdatedAt !== prev.settingsUpdatedAt) schedule(2500);
  });
  const refresh = () => { if (document.visibilityState === "visible") schedule(0); };
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("focus", refresh);
  const poll = setInterval(refresh, 60_000);

  return () => {
    clearTimeout(timer); clearInterval(poll); unsub(); sub.subscription.unsubscribe(); disconnectRealtime();
    document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh);
  };
}
