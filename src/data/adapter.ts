/* The storage surface the UI uses (same shape as the Pa-Nashe tracker's DocStore). */
export interface DocSnap { id: string; exists: boolean; data(): any }
export interface QuerySnap { docs: DocSnap[] }
export type Unsub = () => void;
/** Every value public.docs.collection accepts in this Supabase project (a CHECK constraint rejects anything else). */
export const ALLOWED_COLLECTIONS = ['config', 'months', 'milestones', 'logs', 'tools', 'prep', 'preg_lists', 'gestations'] as const;
/** The collections THIS app reads/writes: profiles, their lists (symptoms, kicks, budget, names, …) and its menu preferences. */
export type Collection = 'gestations' | 'preg_lists' | 'config';
export const COLLECTIONS: Collection[] = ['gestations', 'preg_lists', 'config'];
/** `config` is shared with the Pa-Nashe tracker (config/main, config/catalog …), so this app only touches documents with this id prefix. */
export const CONFIG_PREFIX = 'preg-';
export const NAV_DOC = 'config/' + CONFIG_PREFIX + 'nav';
/** Is this a document this app owns? (config docs belonging to another app are never fetched, cached or applied.) */
export const ownsPath = (path: string): boolean => { const [c, ...rest] = path.split('/'); return COLLECTIONS.includes(c as Collection) && (c !== 'config' || rest.join('/').startsWith(CONFIG_PREFIX)); };

/** Throws a clear error BEFORE any network call if a path's collection isn't one the database accepts. */
export function assertCollection(path: string): void {
  const c = path.split('/')[0];
  if (!(ALLOWED_COLLECTIONS as readonly string[]).includes(c) || path.indexOf('/') < 1 || path.endsWith('/')) {
    throw Object.assign(new Error(`“${path}” isn’t a valid document path. Allowed collections: ${ALLOWED_COLLECTIONS.join(', ')}.`), { code: 'invalid_collection' });
  }
}

export interface DocRef {
  set(body: any): Promise<void>;      // full replace (creates)
  update(patch: any): Promise<void>;  // server-side deep merge of nested maps; arrays replaced; null stored as a tombstone
  delete(): Promise<void>;
}
export interface StoreStatus { online: boolean; pending: number; flushing: boolean }
export interface DocStore {
  doc(path: string): DocRef;
  collection(name: Collection): { onSnapshot(next: (s: QuerySnap) => void, error?: (e: any) => void): Unsub };
  onStatus?(fn: (st: StoreStatus) => void): Unsub;
}
