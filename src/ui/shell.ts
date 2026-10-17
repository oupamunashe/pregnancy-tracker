/* App shell, navigation and rendering. */
import { ctx } from '../core/ctx';
import { clock, esc } from '../core/format';
import { hooks } from '../core/hooks';
import { S, activeProfile } from '../core/state';
import type { StoreStatus } from '../data/adapter';
import { $, $$, toast } from './sheet';
import { viewBudget } from './views/budget';
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

const RAIL: [string, string, string][] = [['home', '🏠', 'Home'], ['weeks', '📅', 'Weekly milestones'], ['symptoms', '📝', 'Symptoms'], ['kicks', '👣', 'Kick counter'], ['contractions', '⏱', 'Contractions'], ['prep', '🧳', 'Prep checklists'],
  ['budget', '💰', 'Budget'], ['names', '👶', 'Baby names'], ['nursery', '🛏', 'Nursery'], ['photos', '📸', 'Photo milestones'], ['daycare', '🏫', 'Daycare & caregivers'], ['supplies', '🧷', 'Supplies & diapers'], ['settings', '⚙️', 'Settings']];
const TABS: [string, string, string][] = [['home', '🏠', 'Home'], ['weeks', '📅', 'Weeks'], ['kicks', '👣', 'Kicks'], ['contractions', '⏱', 'Timer'], ['more', '☰', 'More']];

export function shell() {
  document.body.innerHTML = `<div class="app">
    <aside class="rail"><div class="brandmark"><span class="logo" aria-hidden="true">♥</span>Pregnancy Tracker</div>
      <nav>${RAIL.map(([v, i, n]) => `<button data-a="nav" data-v="${v}">${i} ${n}</button>`).join('')}</nav></aside>
    <div class="main-wrap">
      <header class="topbar"><div class="topbar-in"><span class="avatar" id="tb-icon"></span>
        <div class="grow"><b id="tb-name">Pregnancy Tracker</b><small id="tb-sub" class="muted"></small></div>
        <span id="netchip"></span></div></header>
      <main id="main"><div class="loading"><div><div class="spin"></div>Loading your tracker…</div></div></main>
    </div>
    <nav class="tabbar">${TABS.map(([v, i, n]) => `<button data-a="nav" data-v="${v}"><span aria-hidden="true">${i}</span>${n}</button>`).join('')}</nav>
  </div><div id="sheets"></div>`;
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

export const ready = () => S.loaded.profiles && S.loaded.lists;

const MORE_VIEWS = ['symptoms', 'prep', 'budget', 'names', 'nursery', 'photos', 'daycare', 'supplies', 'settings'];
const VIEWS: Record<string, () => string> = { budget: viewBudget, names: viewNames, nursery: viewNursery, photos: viewPhotos, daycare: viewDaycare, supplies: viewSupplies, home: viewHome, weeks: viewWeeks, symptoms: viewSymptoms, kicks: viewKicks, contractions: viewContractions, prep: viewPrep, more: viewMore, settings: viewSettings };

export function render() {
  const v = S.ui.view, main = $('#main'); if (!main) return;
  const inMore = MORE_VIEWS.includes(v);
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
