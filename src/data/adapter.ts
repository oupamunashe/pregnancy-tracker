/* The storage surface the UI uses (same shape as the Pa-Nashe tracker's DocStore). */
export interface DocSnap { id: string; exists: boolean; data(): any }
export interface QuerySnap { docs: DocSnap[] }
export type Unsub = () => void;
/** Every value public.docs.collection accepts in this Supabase project (a CHECK constraint rejects anything else). */
export const ALLOWED_COLLECTIONS = ['config', 'months', 'milestones', 'logs', 'tools', 'prep', 'preg_lists', 'gestations'] as const;
/** The two collections THIS app owns: pregnancy profiles, and their lists (symptoms, kicks, budget, names, …). */
export type Collection = 'gestations' | 'preg_lists';
export const COLLECTIONS: Collection[] = ['gestations', 'preg_lists'];

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
