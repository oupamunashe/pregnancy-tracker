/* App shell, navigation and rendering. */
import { ctx } from '../core/ctx';
import { clock, esc } from '../core/format';
import { hooks } from '../core/hooks';
import { S, activeProfile } from '../core/state';
import type { StoreStatus } from '../data/adapter';
import { $, $$, toast } from './sheet';
import { layout, tabsFor, byId } from '../core/nav';
import { viewBudget } from './views/budget';
import { viewCare } from './views/care';
import { viewEvents } from './views/events';
import { viewContractions } from './views/contractions';
import { viewDaycare } from './views/daycare';
import { viewNames } from './views/names';
import { viewNursery } from './views/nursery';
import { viewPhotos } from './views/photos';
import { viewSupplies } from './views/supplies';
import { viewHome } from './views/home';
import { viewKicks } from './views/kicks';
import { viewPrep } from './views/prep';
import { iconHtml, viewMore, viewSettings } from './views/settings';
import { viewSymptoms } from './views/symptoms';
import { viewWeeks } from './views/weeks';

const FIXED: Record<string, [string, string]> = { home: ['🏠', 'Home'], more: ['☰', 'More'], settings: ['⚙️', 'Settings'] };
const label = (id: string): [string, string, string] => { const m = byId(id); return m ? [m.icon, m.label, m.short] : [FIXED[id][0], FIXED[id][1], FIXED[id][1]]; };

/** Tab bar (Home + this person's modules + More + Settings, max 10 slots) and the desktop rail are built from config/preg-nav. */
export function renderNav() {
  const lay = layout(tabsFor(S.cfg, S.me));
  const tb = $('#tabbar'), rn = $('#railnav'); if (!tb || !rn) return;
  tb.innerHTML = lay.bar.map(id => { const [i, , sh] = label(id); return `<button data-a="nav" data-v="${id}"><span aria-hidden="true">${i}</span>${sh}</button>`; }).join('');
  const rail = (id: string, cls = '') => { const [i, l] = label(id); return `<button data-a="nav" data-v="${id}" class="${cls}">${i} ${l}</button>`; };
  // the extra modules hide behind ONE expandable "More" item (open by default only while you are on one of them)
  const open = S.ui.railMore ?? lay.overflow.includes(S.ui.view), childActive = lay.overflow.includes(S.ui.view);
  rn.innerHTML = ['home', ...lay.tabs].map(id => rail(id)).join('')
    + (lay.overflow.length ? `<button class="rail-more ${childActive ? 'child-active' : ''}" data-a="rail-more" aria-expanded="${open}" aria-controls="rail-more-list">☰ More<span class="chev" aria-hidden="true">${open ? '▴' : '▾'}</span></button>
      <div class="rail-sub" id="rail-more-list" ${open ? '' : 'hidden'}>${lay.overflow.map(id => rail(id)).join('')}</div>` : '')
    + rail('settings', 'rail-settings');
}

export function shell() {
  document.body.innerHTML = `<div class="app">
    <aside class="rail"><div class="brandmark"><span class="logo" aria-hidden="true">♥</span>Pregnancy Tracker</div>
      <nav id="railnav"></nav></aside>
    <div class="main-wrap">
      <header class="topbar"><div class="topbar-in"><span class="avatar" id="tb-icon"></span>
        <div class="grow"><b id="tb-name">Pregnancy Tracker</b><small id="tb-sub" class="muted"></small></div>
        <span id="netchip"></span></div></header>
      <main id="main"><div class="loading"><div><div class="spin"></div>Loading your tracker…</div></div></main>
    </div>
    <nav class="tabbar" id="tabbar" aria-label="Main"></nav>
  </div><div id="sheets"></div>`;
  renderNav();
}

/* ---------- “Offline – N changes waiting” ---------- */
let net: StoreStatus = { online: true, pending: 0, flushing: false };
function netChip() {
  const n = net.pending, s = n === 1 ? '' : 's';
  if (!net.online) return `<span class="chip warn">Offline${n ? ` – ${n} change${s} waiting` : ''}</span>`;
  return n && !net.flushing ? `<span class="chip">${n} change${s} waiting</span>` : '';
}
export function setNetStatus(s: StoreStatus) { net = s; const c = $('#netchip'); if (c) c.innerHTML = netChip(); }

let renderPending = false;
export function scheduleRender() {
  if (renderPending) return; renderPending = true;
  const run = () => {
    if (!renderPending) return; renderPending = false;
    const ae: any = document.activeElement;
    if (ae && $('#main')?.contains(ae) && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) { S.deferRender = true; return; }   // don't steal focus while typing
    render();
  };
  requestAnimationFrame(run);
  setTimeout(run, 80);   // background tabs throttle rAF — never let a render stall
}
document.addEventListener('focusout', () => { if (S.deferRender) { S.deferRender = false; setTimeout(scheduleRender, 50); } });

export const ready = () => S.loaded.profiles && S.loaded.lists && S.loaded.config;

const VIEWS: Record<string, () => string> = { care: viewCare, events: viewEvents, budget: viewBudget, names: viewNames, nursery: viewNursery, photos: viewPhotos, daycare: viewDaycare, supplies: viewSupplies, home: viewHome, weeks: viewWeeks, symptoms: viewSymptoms, kicks: viewKicks, contractions: viewContractions, prep: viewPrep, more: viewMore, settings: viewSettings };

export function render() {
  const v = S.ui.view, main = $('#main'); if (!main) return;
  renderNav();
  const lay = layout(tabsFor(S.cfg, S.me)), inMore = v === 'more' || lay.overflow.includes(v);   // a module living in the drawer highlights More
  $$('[data-a="nav"]').forEach(b => b.setAttribute('aria-current', b.dataset.v === v || (inMore && b.dataset.v === 'more' && !!b.closest('.tabbar')) ? 'page' : 'false'));
  if (!ready()) return;
  const c = ctx();
  const ic = $('#tb-icon'); if (ic) ic.innerHTML = c ? iconHtml(c.p.icon, 28) : '';
  const nm = $('#tb-name'); if (nm) nm.textContent = c ? c.p.nickname : 'Pregnancy Tracker';
  const sb = $('#tb-sub'); if (sb) sb.textContent = c ? (c.ga.totalDays >= 0 ? `${c.ga.weeks}w ${c.ga.days}d` : `starts in ${-c.ga.totalDays}d`) : '';
  if (!activeProfile()) { main.innerHTML = firstRun(); return; }
  main.innerHTML = (VIEWS[v] || viewHome)();
  if (S.ui.scrollTop) { window.scrollTo(0, 0); S.ui.scrollTop = false; }
  hydrateFiles();
  const on = $('.wk.on'); if (on && v === 'weeks') on.scrollIntoView({ block: 'nearest', inline: 'center' });
  $('#tabbar [aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  if (S.ui.scrollTo) { const t = document.getElementById(S.ui.scrollTo); S.ui.scrollTo = null; t?.scrollIntoView({ block: 'start' }); }
}

/** Images stored in the private bucket carry data-file; resolve their short-lived signed URLs after each render. */
function hydrateFiles() {
  $$('img[data-file]').forEach(img => {
    const id = img.dataset.file!; if ((img as HTMLImageElement).src) return;
    S.assets?.url(id).then(u => { (img as HTMLImageElement).src = u; }).catch(() => { img.setAttribute('alt', 'Photo unavailable'); });
  });
}

function firstRun() {
  return `<form class="panel narrow" data-a="create-first"><h1>Welcome 🌸</h1><p class="muted">Start your pregnancy profile — every date in the app is worked out from the first day of your last period.</p>
    <div class="field"><label for="fr-name">Profile nickname</label><input id="fr-name" class="inp" placeholder="e.g. Blueberry Peanut" required></div>
    <div class="field"><label for="fr-lmp">Last menstrual period (LMP)</label><input id="fr-lmp" class="inp" type="date" required></div>
    <button class="btn primary" type="submit">Create profile</button></form>`;
}

/* Live clocks: elements with data-since="<ms>" tick every second without a re-render. */
setInterval(() => $$('[data-since]').forEach(el => { el.textContent = clock((Date.now() - +el.dataset.since!) / 1000); }), 1000);

hooks.render = render;
hooks.scheduleRender = scheduleRender;
hooks.toast = toast;
void esc;
