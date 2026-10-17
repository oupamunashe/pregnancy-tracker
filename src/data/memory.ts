/* In-memory DocStore for unit tests and `npm run dev:demo` (no login, nothing leaves the browser). */
import type { Collection, DocSnap, DocStore, QuerySnap, Unsub } from './adapter';
import { clone, merge } from './merge';

export class MemoryAdapter implements DocStore {
  store: Record<string, any>;
  writes: any[] = [];
  private listeners = new Set<() => void>();
  constructor(seed: Record<string, any> = {}) { this.store = clone(seed); }

  private notify() { setTimeout(() => this.listeners.forEach(l => l()), 5); }
  private snapDoc(path: string): DocSnap {
    return { id: path.split('/').pop() as string, exists: !!this.store[path], data: () => (this.store[path] ? clone(this.store[path]) : undefined) };
  }
  doc(path: string) {
    return {
      set: async (d: any) => { this.writes.push(['set', path]); this.store[path] = clone(d); this.notify(); },
      update: async (d: any) => { this.writes.push(['update', path, d]); this.store[path] = merge(this.store[path] || {}, d); this.notify(); },
      delete: async () => { delete this.store[path]; this.notify(); },
    };
  }
  collection(name: Collection) {
    return {
      onSnapshot: (next: (s: QuerySnap) => void): Unsub => {
        const f = () => next({ docs: Object.keys(this.store).filter(p => p.startsWith(name + '/') && p.split('/').length === 2).sort().map(p => this.snapDoc(p)) });
        this.listeners.add(f); setTimeout(f, 20);
        return () => { this.listeners.delete(f); };
      },
    };
  }
}
