import { describe, expect, it } from 'vitest';
import { DEFAULT_TABS, MAX_SLOTS, MAX_TABS, MODULE_IDS, addTab, layout, moveTab, removeTab, sanitizeTabs, tabsFor } from '../../src/core/nav';

describe('customizable navigation', () => {
  it('the bar never exceeds 10 primary slots: Home + up to 7 modules + More + Settings', () => {
    expect(MAX_TABS).toBe(7);
    const l = layout(MODULE_IDS);                                  // try to cram every module in
    expect(l.bar.length).toBeLessThanOrEqual(MAX_SLOTS);
    expect(l.bar[0]).toBe('home'); expect(l.bar.slice(-2)).toEqual(['more', 'settings']);
    expect(l.tabs).toHaveLength(7);
  });
  it('modules not in the bar live in the More drawer — nothing is lost', () => {
    const l = layout(['kicks', 'care']);
    expect(l.overflow).not.toContain('kicks'); expect(l.overflow).toContain('budget');
    expect([...l.tabs, ...l.overflow].sort()).toEqual([...MODULE_IDS].sort());
  });
  it('sanitizes saved prefs: unknown ids, duplicates, wrong types, empty', () => {
    expect(sanitizeTabs(['kicks', 'kicks', 'nope', 42, 'care'])).toEqual(['kicks', 'care']);
    expect(sanitizeTabs(MODULE_IDS)).toHaveLength(7);
    expect(sanitizeTabs([])).toEqual(DEFAULT_TABS); expect(sanitizeTabs(undefined)).toEqual(DEFAULT_TABS); expect(sanitizeTabs('x')).toEqual(DEFAULT_TABS);
  });
  it('each partner has their own menu; a person with no saved menu gets the defaults', () => {
    const cfg = { 'preg-nav': { P: { tabs: ['kicks', 'budget'] }, M: { tabs: ['names'] } } };
    expect(tabsFor(cfg, 'P')).toEqual(['kicks', 'budget']); expect(tabsFor(cfg, 'M')).toEqual(['names']);
    expect(tabsFor({}, 'P')).toEqual(DEFAULT_TABS); expect(tabsFor(cfg, null)).toEqual(DEFAULT_TABS);
  });
  it('add enforces the 7-module cap; remove and reorder work', () => {
    expect(addTab(DEFAULT_TABS, 'names')).toMatchObject({ ok: false });
    expect(addTab(DEFAULT_TABS, 'weeks')).toEqual({ ok: true, tabs: DEFAULT_TABS });           // already there
    expect(addTab(['kicks'], 'budget')).toEqual({ ok: true, tabs: ['kicks', 'budget'] });
    expect(addTab(['kicks'], 'bogus')).toMatchObject({ ok: false });
    expect(removeTab(['a', 'b'], 'a')).toEqual(['b']);
    expect(moveTab(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']); expect(moveTab(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c']); expect(moveTab(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c']);
  });
});
