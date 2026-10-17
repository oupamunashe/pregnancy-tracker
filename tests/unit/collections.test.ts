import { describe, expect, it } from 'vitest';
import { ALLOWED_COLLECTIONS, COLLECTIONS, assertCollection } from '../../src/data/adapter';
import { createProfile, delItem, deleteProfile, listPath, putItem, saveNav, saveProfile } from '../../src/data/db';
import { MemoryAdapter } from '../../src/data/memory';
import { LIST_KEYS } from '../../src/core/types';
import { S } from '../../src/core/state';

const collectionOf = (path: string) => path.split('/')[0];

describe('collection names (public.docs CHECK constraint)', () => {
  it('the two collections this app owns are on the allowed list', () => {
    expect([...ALLOWED_COLLECTIONS].sort()).toEqual(['config', 'gestations', 'logs', 'milestones', 'months', 'preg_lists', 'prep', 'tools']);
    COLLECTIONS.forEach(c => expect(ALLOWED_COLLECTIONS).toContain(c));
  });

  it('every save handler writes only to allowed collections', async () => {
    const db = new MemoryAdapter(); Object.assign(S, { db, canWrite: true });
    const id = await createProfile({ nickname: 'Test', lmp: '2026-09-17' });         // profile doc + seeded prep/budget/nursery/supplies
    await saveProfile(id, { nickname: 'Renamed' });
    for (const k of LIST_KEYS) { await putItem(id, k, 'x1', { a: 1 }); await delItem(id, k, 'x1'); }   // every list the UI can write
    await saveNav('P', ['kicks', 'care']);                                              // menu preference → config/preg-nav
    await deleteProfile(id);
    const paths = db.writes.map(w => w[1] as string);
    expect(paths.length).toBeGreaterThan(30);
    expect(new Set(paths.map(collectionOf))).toEqual(new Set(['gestations', 'preg_lists', 'config']));
    expect(paths.filter(p => collectionOf(p) === 'config')).toEqual(['config/preg-nav']);   // never touches Pa-Nashe's config/main etc.
    paths.forEach(p => expect(ALLOWED_COLLECTIONS).toContain(collectionOf(p)));
  });

  it('every list path lives in preg_lists, profile docs in gestations', () => {
    LIST_KEYS.forEach(k => expect(listPath('p1', k)).toBe(`preg_lists/p1~${k}`));
  });

  it('rejects a disallowed or malformed path before any network call', () => {
    expect(() => assertCollection('gestations/p1')).not.toThrow();
    expect(() => assertCollection('preg_lists/p1~kicks')).not.toThrow();
    expect(() => assertCollection('preg_profiles/p1')).toThrow(/Allowed collections/);   // the old name would be refused by the database
    expect(() => assertCollection('evil/x')).toThrow(/valid document path/);
    expect(() => assertCollection('gestations')).toThrow();
    expect(() => assertCollection('gestations/')).toThrow();
  });
});
