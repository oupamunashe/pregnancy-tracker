/* Deep merge — mirrors public.jsonb_deep_merge in the database: objects merge key by key (recursively);
   arrays, scalars and null replace; null is kept as a tombstone ("deleted"). `undefined` is skipped like JSON does. */
export const clone = <T>(o: T): T => (o === undefined ? o : JSON.parse(JSON.stringify(o)));
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

export function merge(a: Record<string, any>, b: Record<string, any>): Record<string, any> {
  for (const k of Object.keys(b)) {
    const v = b[k];
    if (v === undefined) continue;
    if (isObj(v) && isObj(a[k])) merge(a[k], v); else a[k] = clone(v);
  }
  return a;
}
/** Non-mutating: the document after applying `patch` (creates it from the patch when missing). */
export const merged = (doc: Record<string, any> | null | undefined, patch: Record<string, any>) => (isObj(doc) ? merge(clone(doc), patch) : merge({}, patch));
