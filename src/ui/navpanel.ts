/* Settings → "Navigation & Menu Layout": pick up to 7 modules for the tab bar / sidebar and order them.
   Saved per person in config/preg-nav, so Piepie and Munny each keep their own menu on every device. */
import { DEFAULT_TABS, MAX_TABS, MODULES, byId, tabsFor } from '../core/nav';
import { esc } from '../core/format';
import { S, pname } from '../core/state';

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export function navPanel(): string {
  const id = 'nav-section';
  if (!S.me) return `<div class="panel" id="${id}"><div class="eyebrow">Navigation & Menu Layout</div><p class="muted">Choose who you are under <b>This device</b> below, then you can arrange your own menu.</p></div>`;
  const saved = tabsFor(S.cfg, S.me), tabs = S.ui.navDraft ?? saved, dirty = !same(tabs, saved), rest = MODULES.filter(m => !tabs.includes(m.id)), full = tabs.length >= MAX_TABS;
  return `<div class="panel" id="${id}">
    <div class="row-between"><div class="eyebrow">Navigation & Menu Layout · ${esc(pname(S.me))}’s menu</div>${dirty ? '<span class="chip warn">Unsaved changes</span>' : ''}</div>
    <p class="small muted">The tab bar and sidebar always show <b>Home</b>, <b>More</b> and <b>Settings</b>, plus up to <b>${MAX_TABS}</b> modules you choose (10 slots in all). Everything else lives under <b>More</b>. Piepie and Munny each keep their own layout, on every device.</p>
    <div class="eyebrow">In your menu · ${tabs.length}/${MAX_TABS}</div>
    <ol class="navlist">${tabs.map((m, i) => { const mod = byId(m)!; return `<li><span class="nl-name">${mod.icon} ${esc(mod.label)}</span>
      <button class="icon-btn" data-a="nav-up" data-id="${m}" ${i === 0 ? 'disabled' : ''} aria-label="Move ${esc(mod.short)} up">▲</button><button class="icon-btn" data-a="nav-down" data-id="${m}" ${i === tabs.length - 1 ? 'disabled' : ''} aria-label="Move ${esc(mod.short)} down">▼</button>
      <button class="icon-btn" data-a="nav-remove" data-id="${m}" aria-label="Move ${esc(mod.short)} to More">✕</button></li>`; }).join('') || '<li class="muted">Empty — add modules below, or reset.</li>'}</ol>
    <div class="eyebrow" style="margin-top:12px">In More${full ? ' · menu is full — remove one to add another' : ''}</div>
    <ul class="navlist">${rest.map(m => `<li><span class="nl-name">${m.icon} ${esc(m.label)}</span><button class="btn sm" data-a="nav-add" data-id="${m.id}" ${full ? 'disabled' : ''}>+ Add to menu</button></li>`).join('') || '<li class="muted">Everything is in your menu.</li>'}</ul>
    <div class="row-gap tight" style="margin-top:12px"><button class="btn primary" data-a="nav-save" ${dirty ? '' : 'disabled'}>Save menu</button><button class="btn" data-a="nav-cancel" ${dirty ? '' : 'disabled'}>Discard changes</button>
      <button class="btn ghost" data-a="nav-reset" ${same(tabs, DEFAULT_TABS) ? 'disabled' : ''}>Reset to default</button></div></div>`;
}
