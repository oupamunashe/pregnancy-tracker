import { describe, expect, it } from 'vitest';
import { merged } from '../../src/data/merge';

describe('deep merge (mirrors jsonb_deep_merge)', () => {
  it('merges objects key by key and keeps siblings', () => {
    const a = { items: { a: { done: false, text: 'x' }, b: { done: true } } };
    expect(merged(a, { items: { a: { done: true } } })).toEqual({ items: { a: { done: true, text: 'x' }, b: { done: true } } });
  });
  it('null is kept as a tombstone; arrays and scalars replace', () => {
    expect(merged({ items: { a: { n: 1 } } }, { items: { a: null } })).toEqual({ items: { a: null } });
    expect(merged({ x: [1, 2] }, { x: [3] })).toEqual({ x: [3] });
  });
  it('creates from the patch when the document is missing, without mutating the input', () => {
    expect(merged(null, { a: 1 })).toEqual({ a: 1 });
    const orig = { a: { b: 1 } }; merged(orig, { a: { b: 2 } }); expect(orig.a.b).toBe(1);
  });
  it('two phones adding different items to one list both survive', () => {
    let d: any = {}; d = merged(d, { items: { k1: { at: 1 } } }); d = merged(d, { items: { k2: { at: 2 } } });
    expect(Object.keys(d.items)).toEqual(['k1', 'k2']);
  });
});
