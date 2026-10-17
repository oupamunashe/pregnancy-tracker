/* The storage surface the UI uses (same shape as the Pa-Nashe tracker's DocStore). */
export interface DocSnap { id: string; exists: boolean; data(): any }
export interface QuerySnap { docs: DocSnap[] }
export type Unsub = () => void;
/** public.docs.collection values used by this app (the Pa-Nashe tracker uses config | months | milestones in the same table). */
export type Collection = 'preg_profiles' | 'preg_lists';
export const COLLECTIONS: Collection[] = ['preg_profiles', 'preg_lists'];

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
