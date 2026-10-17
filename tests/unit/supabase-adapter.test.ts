import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalStore } from '../../src/data/offline';
import { SupabaseAdapter } from '../../src/data/supabase';
import { FakeSupabase } from '../helpers/fake-supabase';

const tick = (ms = 30) => new Promise(r => setTimeout(r, ms));
let fake: FakeSupabase, db: SupabaseAdapter, local: LocalStore, uidn = 0;
const snaps: Record<string, any[]> = { gestations: [], preg_lists: [], config: [] };
const latest = (c: string) => snaps[c][snaps[c].length - 1];

beforeEach(async () => {
  fake = new FakeSupabase(); local = new LocalStore('user-' + ++uidn);
  snaps.gestations = []; snaps.preg_lists = []; snaps.config = [];
  db = new SupabaseAdapter(fake as any, local);
  db.collection('gestations').onSnapshot(s => snaps.gestations.push(s));
  db.collection('preg_lists').onSnapshot(s => snaps.preg_lists.push(s));
  db.collection('config').onSnapshot(s => snaps.config.push(s));
  await db.start(); await tick();
});
afterEach(() => db.stop());

describe('SupabaseAdapter', () => {
  it('writes through doc_merge and shows the result', async () => {
    await db.doc('gestations/p1').update({ nickname: 'Blueberry Peanut', lmp: '2026-09-17' });
    await tick();
    expect(fake.calls).toContain('doc_merge');
    expect(fake.rows.get('gestations/p1')?.data.nickname).toBe('Blueberry Peanut');
    expect(latest('gestations').docs[0].data().lmp).toBe('2026-09-17');
  });

  it('ignores other apps’ rows in the shared docs table', async () => {
    await fake.remoteMerge('months', '2026-10', { y: 2026 });          // a Pa-Nashe document
    await tick(50);
    expect(snaps.preg_lists.every(s => s.docs.length === 0)).toBe(true);
    expect(snaps.gestations.every(s => s.docs.length === 0)).toBe(true);
  });

  it('queues edits while offline, shows them immediately, and replays them in order when back online', async () => {
    fake.online = false;
    await db.doc('preg_lists/p1~symptoms').update({ items: { a: { kind: 'Nausea' } } });
    await db.doc('preg_lists/p1~symptoms').update({ items: { b: { kind: 'Fatigue' } } });
    await tick();
    expect(db.pendingCount).toBe(2);
    expect(Object.keys(latest('preg_lists').docs[0].data().items)).toEqual(['a', 'b']);   // optimistic overlay
    expect(fake.rows.size).toBe(0);
    expect((await local.outbox()).length).toBe(2);                                         // survives a reload

    fake.online = true; await db.refresh(); await tick(60);
    expect(db.pendingCount).toBe(0);
    expect(Object.keys(fake.rows.get('preg_lists/p1~symptoms')!.data.items)).toEqual(['a', 'b']);
    expect((await local.outbox()).length).toBe(0);
  });

  it('a restarted adapter replays an outbox left by an earlier session', async () => {
    fake.online = false;
    await db.doc('gestations/p9').update({ nickname: 'Offline edit', lmp: '2026-01-01' });
    await tick(); db.stop();
    const db2 = new SupabaseAdapter(fake as any, local);
    fake.online = true; await db2.start(); await tick(80);
    expect(fake.rows.get('gestations/p9')?.data.nickname).toBe('Offline edit');
    db2.stop();
  });

  it('applies the other phone’s changes live via Realtime, and two phones’ edits both survive', async () => {
    await db.doc('preg_lists/p1~kicks').update({ items: { s1: { start: 1, taps: { mine: 10 } } } });
    await tick();
    await fake.remoteMerge('preg_lists', 'p1~kicks', { items: { s1: { taps: { theirs: 20 } } } });   // partner taps at the same time
    await tick(40);
    expect(Object.keys(latest('preg_lists').docs[0].data().items.s1.taps).sort()).toEqual(['mine', 'theirs']);
  });

  it('a tombstone removes an item and a deleted document disappears', async () => {
    await db.doc('preg_lists/p1~prep').update({ items: { x: { text: 'Pillow', done: false } } });
    await db.doc('preg_lists/p1~prep').update({ items: { x: null } });
    await tick();
    expect(latest('preg_lists').docs[0].data().items.x).toBeNull();
    await db.doc('preg_lists/p1~prep').delete(); await tick();
    expect(latest('preg_lists').docs.length).toBe(0);
  });

  it('a refused (non-network) write is rejected, not retried forever', async () => {
    (fake as any).rpc = async () => ({ data: null, error: { code: '42501', message: 'permission denied' }, status: 403 });
    await expect(db.doc('gestations/zz').update({ nickname: 'x' })).rejects.toMatchObject({ message: 'permission denied' });
    expect(db.pendingCount).toBe(0);
  });

  it('refuses to queue a write to a collection the database would reject', async () => {
    await expect(db.doc('preg_profiles/p1').update({ nickname: 'x' })).rejects.toMatchObject({ code: 'invalid_collection' });
    expect(db.pendingCount).toBe(0); expect(fake.calls).toEqual([]);
  });

  it('syncs the menu preference in config/preg-nav, per person, and ignores the Pa-Nashe tracker’s config documents', async () => {
    await fake.remoteMerge('config', 'main', { people: { P: { n: 'Piepie' } } });          // a Pa-Nashe document in the same collection
    await fake.remoteMerge('config', 'catalog', { items: {} });
    await db.doc('config/preg-nav').update({ P: { tabs: ['kicks', 'care'] } });             // Piepie saves her menu
    await tick(40);
    await fake.remoteMerge('config', 'preg-nav', { M: { tabs: ['budget'] } });              // Munny saves his on another phone
    await tick(60);
    const docs = latest('config').docs;
    expect(docs.map((d: any) => d.id)).toEqual(['preg-nav']);                                 // Pa-Nashe's main/catalog never appear
    expect(docs[0].data()).toEqual({ P: { tabs: ['kicks', 'care'] }, M: { tabs: ['budget'] } });
  });

  it('on a fresh start only this app’s config documents are fetched', async () => {
    await fake.remoteMerge('config', 'main', { secret: 'finances' });
    await fake.remoteMerge('config', 'preg-nav', { P: { tabs: ['weeks'] } });
    const fresh = new SupabaseAdapter(fake as any, new LocalStore('user-fresh-' + ++uidn));
    let seen: string[] = []; fresh.collection('config').onSnapshot(s => { seen = s.docs.map(d => d.id); });
    await fresh.start(); await tick(60);
    expect(seen).toEqual(['preg-nav']); fresh.stop();
  });
});
