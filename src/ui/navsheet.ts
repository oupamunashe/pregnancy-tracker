/* "Customize my menu": pick up to 7 modules for the tab bar and order them; the rest live in More. Saved per person in config/preg-nav. */
import { MAX_TABS, MODULES, byId, tabsFor } from '../core/nav';
import { S, pname } from '../core/state';
import { $, openSheet, toast } from './sheet';

export function navBody(): string {
  const tabs = S.ui.navDraft || [], rest = MODULES.filter(m => !tabs.includes(m.id)), full = tabs.length >= MAX_TABS;
  return `<p class="small muted">Your tab bar always has <b>Home</b>, <b>More</b> and <b>Settings</b>, plus up to <b>${MAX_TABS}</b> modules of your choice (10 slots in all). Anything not in the bar stays in <b>More</b>.</p>
    <div class="eyebrow">In your tab bar · ${tabs.length}/${MAX_TABS}</div>
    <ol class="navlist">${tabs.map((id, i) => { const m = byId(id)!; return `<li><span class="nl-name">${m.icon} ${m.label}</span>
      <button class="icon-btn" data-a="nav-up" data-id="${id}" ${i === 0 ? 'disabled' : ''} aria-label="Move ${m.short} up">▲</button><button class="icon-btn" data-a="nav-down" data-id="${id}" ${i === tabs.length - 1 ? 'disabled' : ''} aria-label="Move ${m.short} down">▼</button>
      <button class="icon-btn" data-a="nav-remove" data-id="${id}" aria-label="Move ${m.short} to More">✕</button></li>`; }).join('') || '<li class="muted">Empty — add modules below (or Reset).</li>'}</ol>
    <div class="eyebrow" style="margin-top:12px">In More${full ? ' · bar is full — remove one to add another' : ''}</div>
    <ul class="navlist">${rest.map(m => `<li><span class="nl-name">${m.icon} ${m.label}</span><button class="btn sm" data-a="nav-add" data-id="${m.id}" ${full ? 'disabled' : ''}>+ Add to bar</button></li>`).join('') || '<li class="muted">Everything is in your tab bar.</li>'}</ul>`;
}

export function refreshNavSheet() { const b = $('.sheet-body'); if (b) b.innerHTML = navBody(); }

export function sheetNav() {
  if (!S.me) return toast('Choose who you are first — Settings → This device.', 'bad');
  S.ui.navDraft = tabsFor(S.cfg, S.me);
  openSheet({ title: `${pname(S.me)}’s menu`, body: navBody(),
    foot: `<button class="btn ghost" data-a="nav-reset">Reset</button><button class="btn" data-a="closesheet">Cancel</button><button class="btn primary" data-a="nav-save">Save menu</button>` });
}
