/* A tiny in-memory stand-in for the Supabase client: public.docs + doc_set / doc_merge, plus a Realtime channel you can poke. */
import { merge, clone } from '../../src/data/merge';

interface Row { collection: string; id: string; data: any; version: number }

export class FakeSupabase {
  rows = new Map<string, Row>();
  online = true;
  calls: string[] = [];
  private handlers: ((p: any) => void)[] = [];
  private subscribed: ((s: string) => void) | null = null;

  private net<T>(fn: () => T): Promise<T> { return this.online ? Promise.resolve(fn()) : Promise.reject(new TypeError('Failed to fetch')); }
  private key = (c: string, id: string) => c + '/' + id;
  private emit(eventType: string, row: Row | null, old?: Row) { this.handlers.forEach(h => h({ eventType, new: row ? clone(row) : {}, old: old ? { collection: old.collection, id: old.id } : {} })); }

  rpc = (fn: string, a: any) => this.net(() => {
    this.calls.push(fn);
    const k = this.key(a.p_collection, a.p_id), cur = this.rows.get(k);
    const data = fn === 'doc_set' ? clone(a.p_data) : merge(cur ? clone(cur.data) : {}, a.p_patch);
    const row = { collection: a.p_collection, id: a.p_id, data, version: (cur?.version || 0) + 1 };
    this.rows.set(k, row); this.emit(cur ? 'UPDATE' : 'INSERT', row);
    return { data: row.version, error: null };
  });

  from = (table: string) => {
    if (table !== 'docs') throw new Error('unexpected table ' + table);
    const self = this;
    return {
      select: () => {
        const f: any = { _c: null as string[] | null, _eq: {} as Record<string, string>, _like: null as [string, string] | null };
        f.in = (_col: string, vals: string[]) => { f._c = vals; return f; };
        f.eq = (k: string, v: string) => { f._eq[k] = v; return f; };
        f.like = (k: string, pat: string) => { f._like = [k, pat]; return f; };
        const run = () => self.net(() => {
          const out = [...self.rows.values()].filter(r => (!f._c || f._c.includes(r.collection)) && Object.entries(f._eq).every(([k, v]) => (r as any)[k] === v) && (!f._like || String((r as any)[f._like[0]]).startsWith(f._like[1].replace(/%$/, ''))));
          return { data: clone(out), error: null };
        });
        f.maybeSingle = () => run().then(r => ({ data: r.data[0] ?? null, error: null }));
        f.then = (res: any, rej: any) => run().then(res, rej);
        return f;
      },
      delete: () => {
        const f: any = { _eq: {} as Record<string, string> };
        f.eq = (k: string, v: string) => { f._eq[k] = v; return f; };
        f.then = (res: any, rej: any) => self.net(() => {
          const k = self.key(f._eq.collection, f._eq.id), old = self.rows.get(k);
          self.rows.delete(k); if (old) self.emit('DELETE', null, old);
          return { error: null };
        }).then(res, rej);
        return f;
      },
    };
  };

  channel = (_name: string) => {
    const ch: any = {};
    ch.on = (_t: string, _f: any, cb: (p: any) => void) => { this.handlers.push(cb); return ch; };
    ch.subscribe = (cb: (s: string) => void) => { this.subscribed = cb; setTimeout(() => cb('SUBSCRIBED'), 0); return ch; };
    return ch;
  };
  removeChannel = (_c: any) => { this.handlers = []; };

  /** Another phone writes a document (goes through doc_merge, firing Realtime). */
  async remoteMerge(collection: string, id: string, patch: any) { return this.rpc('doc_merge', { p_collection: collection, p_id: id, p_patch: patch }); }
}
