/* More + Settings: profile, switching profiles, who is using this device, sign-out. */
import { ctx } from '../../core/ctx';
import { esc } from '../../core/format';
import { longDate, parseDate } from '../../core/gestation';
import { computeEdd } from '../../core/gestation';
import { S, pname, profileIds } from '../../core/state';
import { byId, layout, tabsFor } from '../../core/nav';
import { navPanel } from '../navpanel';
import { session } from '../../auth/session';
import { isUrlIcon } from '../parts';

export const ICONS = ['🫐', '🥜', '🌸', '🥑', '👶', '🍓', '🥭', '🍑', '🌱', '🧸', '⭐', '💛'];

export function viewMore(): string {
  const lay = layout(tabsFor(S.cfg, S.me));
  const tile = (m: { id: string; icon: string; label: string }) => `<button class="btn big-btn" data-a="nav" data-v="${m.id}"><span aria-hidden="true">${m.icon}</span>${m.label}</button>`;
  return `<section><h1>More</h1>
    ${lay.overflow.length ? `<div class="menu">${lay.overflow.map(id => tile(byId(id)!)).join('')}</div>` : '<div class="panel muted">Everything is in your tab bar — nothing hidden here.</div>'}
    <div class="panel" style="margin-top:14px"><div class="row-between"><div><b>${S.me ? esc(pname(S.me)) + '’s menu' : 'Your menu'}</b><div class="small muted">In your tab bar: ${lay.tabs.map(id => esc(byId(id)!.short)).join(' · ')}</div></div>
      <button class="btn" data-a="nav-open">Menu settings →</button></div></div></section>`;
}

export const iconHtml = (icon: string | undefined, size = 28) => isUrlIcon(icon) ? `<img src="${esc(icon)}" alt="" width="${size}" height="${size}" class="avatar-img" referrerpolicy="no-referrer">` : `<span aria-hidden="true">${esc(icon || '🌸')}</span>`;

export function viewSettings(): string {
  const c = ctx()!, ids = profileIds();
  return `<section><h1>Settings</h1>
    <form class="panel" data-a="save-profile">
      <div class="eyebrow">Active pregnancy profile</div>
      <div class="field"><label for="pf-name">Nickname</label><input id="pf-name" class="inp" value="${esc(c.p.nickname)}"></div>
      <div class="field"><label for="pf-lmp">Last menstrual period (LMP)</label><input id="pf-lmp" class="inp" type="date" value="${esc(c.p.lmp)}">
        <small class="muted">Due date: ${esc(longDate(computeEdd(parseDate(c.p.lmp))))}</small></div>
      <div class="field"><label>Icon</label><div class="chips">${ICONS.map(e => `<button type="button" class="chip-btn ${c.p.icon === e ? 'on' : ''}" data-a="pick-icon" data-e="${e}" aria-label="${e}">${e}</button>`).join('')}</div>
        <input id="pf-icon" class="inp" value="${esc(c.p.icon || '🌸')}" placeholder="Any emoji, or an image URL"></div>
      <div class="field"><label for="pf-notes">Notes</label><textarea id="pf-notes" class="inp" rows="2">${esc(c.p.notes || '')}</textarea></div>
      <button class="btn primary" type="submit">Save changes</button>
    </form>
    <div class="panel"><div class="row-between"><div class="eyebrow">All profiles</div><button class="btn sm" data-a="new-profile">+ New profile</button></div>
      <ul class="list">${ids.map(i => { const p = S.profiles[i]; return `<li class="li"><div class="avatar">${iconHtml(p.icon, 26)}</div>
        <div class="grow"><b>${esc(p.nickname)}</b> ${i === c.id ? '<span class="chip">Viewing</span>' : ''}${p.status === 'archived' ? '<span class="chip">Archived</span>' : ''}<div class="small muted">LMP ${esc(longDate(parseDate(p.lmp)))}</div></div>
        ${i !== c.id ? `<button class="btn sm" data-a="switch-profile" data-id="${i}">Switch</button>` : ''}
        <button class="btn sm ghost" data-a="archive-profile" data-id="${i}">${p.status === 'archived' ? 'Unarchive' : 'Archive'}</button>
        <button class="btn sm ghost" data-a="delete-profile" data-id="${i}">Delete</button></li>`; }).join('')}</ul></div>
    ${navPanel()}
    <div class="panel"><div class="eyebrow">This device</div>
      <div class="field"><label>Who is using it?</label><div class="chips">${(['P', 'M'] as const).map(w => `<button class="chip-btn ${S.me === w ? 'on' : ''}" data-a="who" data-w="${w}">${pname(w)}</button>`).join('')}</div></div>
      <p class="small muted">Signed in as <b>${esc(session.email || 'demo mode')}</b>. Changes sync live between both phones and are saved on this device when offline.</p>
      <button class="btn" data-a="signout">Sign out</button></div>
  </section>`;
}
