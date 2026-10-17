/* Database layer: paths, writes (always doc_merge-style patches, so two phones editing at once both survive) and subscriptions.
     gestations/<profileId>            → { nickname, lmp, notes, icon, status, createdAt }
     preg_lists/<profileId>~<listKey>     → { items: { <itemId>: item | null } }      (null = deleted tombstone)
   Lists are maps keyed by item id (not arrays) because doc_merge merges objects key by key but REPLACES arrays. */
import { BUDGET_SEED, NURSERY_SEED, PREP_GROUPS, PREP_SEED, SUPPLY_SEED } from '../core/content';
import { uid } from '../core/format';
import { hooks } from '../core/hooks';
import { S, lsSet } from '../core/state';
import { LIST_KEYS, type ListKey, type Profile, type WithId } from '../core/types';

import { assertCollection } from './adapter';

const queues: Record<string, Promise<unknown>> = {};
/** Writes to the same document run one after another. */
function enqueue<T>(path: string, fn: () => Promise<T>): Promise<T> {
  const p = (queues[path] || Promise.resolve()).then(fn, fn);
  queues[path] = p.catch(() => {});
  return p;
}
export async function dbWrite(path: string, op: 'set' | 'update' | 'delete', data?: any) {
  try { assertCollection(path); } catch (e: any) { hooks.toast(e.message, 'bad'); throw e; }
  if (!S.db) { hooks.toast('Not connected – check your internet connection.', 'bad'); throw new Error('offline'); }
  if (!S.canWrite) { hooks.toast('You have view-only access.', 'bad'); throw new Error('readonly'); }
  return enqueue(path, async () => {
    try { await (S.db as any).doc(path)[op](data); }
    catch (e: any) { hooks.toast('Could not save: ' + (e?.message || e?.code || 'unknown error'), 'bad'); throw e; }
  });
}

export const listPath = (pid: string, key: ListKey) => `preg_lists/${pid}~${key}`;
export const listDocId = (pid: string, key: ListKey) => `${pid}~${key}`;

/** Live items of a list for a profile, newest-first helpers left to callers. Tombstones (null) are skipped. */
export function items<T = any>(pid: string, key: ListKey): WithId<T>[] {
  const m = S.lists[listDocId(pid, key)]?.items || {};
  return Object.entries(m).filter(([, v]) => v).map(([id, v]) => ({ id, ...(v as any) }));
}

export const putItem = (pid: string, key: ListKey, id: string, patch: any) => dbWrite(listPath(pid, key), 'update', { items: { [id]: patch } });
export const delItem = (pid: string, key: ListKey, id: string) => dbWrite(listPath(pid, key), 'update', { items: { [id]: null } });

export const saveProfile = (id: string, patch: Partial<Profile>) => dbWrite('gestations/' + id, 'update', patch);

/** Creates a profile and seeds its prep checklists in one merge write. */
export async function createProfile(p: { nickname: string; lmp: string; notes?: string; icon?: string }): Promise<string> {
  const id = uid();
  await dbWrite('gestations/' + id, 'update', { nickname: p.nickname.trim(), lmp: p.lmp, notes: p.notes || '', icon: p.icon || '🌸', status: 'active', createdAt: Date.now() });
  const prep: Record<string, any> = {};
  for (const g of PREP_GROUPS) PREP_SEED[g.id].forEach((text, i) => { prep[`s-${g.id}-${i}`] = { text, group: g.id, done: false }; });
  await dbWrite(listPath(id, 'prep'), 'update', { items: prep });
  await seedPlanners(id);
  setActive(id);
  return id;
}
/** Starter content for the planner lists (also offered as a button when a list is empty). */
export const seedBudget = (pid: string) => dbWrite(listPath(pid, 'budget'), 'update', { items: Object.fromEntries(BUDGET_SEED.map(([category, item, est], i) => ['s' + i, { category, item, est, actual: null, status: 'Planned' }])) });
export const seedNursery = (pid: string) => dbWrite(listPath(pid, 'nursery'), 'update', { items: Object.fromEntries(NURSERY_SEED.map(([text, todo], i) => ['s' + i, { text, todo, status: 'To buy', est: null, done: false }])) });
export const seedSupplies = (pid: string) => dbWrite(listPath(pid, 'supplies'), 'update', { items: Object.fromEntries(SUPPLY_SEED.map(([group, text, need], i) => ['s' + i, { group, text, need, have: 0 }])) });
export async function seedPlanners(pid: string) { await seedBudget(pid); await seedNursery(pid); await seedSupplies(pid); }

export const setActive = (id: string) => { S.activeId = id; lsSet('pt_active', id); S.ver++; hooks.scheduleRender(); };

export async function deleteProfile(id: string) {
  for (const k of LIST_KEYS) await dbWrite(listPath(id, k), 'delete');
  await dbWrite('gestations/' + id, 'delete');
}

/** Subscribes the in-memory state to both collections (live: every change from either phone arrives here). */
export function subscribe() {
  const db = S.db!;
  const onErr = (what: string) => (e: any) => { console.warn(what, e); if (e?.code === 'revoked') { S.offline = true; hooks.render(); } };
  db.collection('gestations').onSnapshot(snap => {
    const next: Record<string, Profile> = {};
    snap.docs.forEach(d => { if (d.exists) next[d.id] = d.data(); });
    S.profiles = next; S.loaded.profiles = true; S.ver++; hooks.scheduleRender();
  }, onErr('profiles'));
  db.collection('preg_lists').onSnapshot(snap => {
    const next: Record<string, any> = {};
    snap.docs.forEach(d => { if (d.exists) next[d.id] = d.data(); });
    S.lists = next; S.loaded.lists = true; S.ver++; hooks.scheduleRender();
  }, onErr('lists'));
}
