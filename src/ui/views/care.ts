/* Medical care hub: care providers (OB/GYN, GP, midwife/doula, hospital) + a prenatal appointment log linked to them. */
import { APPT_TYPES, PROVIDER_ROLES } from '../../core/content';
import { carriedQuestions, daysUntil, splitAppts, weekAtDate } from '../../core/calc';
import { ctx, type Ctx } from '../../core/ctx';
import { esc } from '../../core/format';
import { longDate, parseDate, toISO } from '../../core/gestation';
import { S } from '../../core/state';
import { items } from '../../data/db';
import type { Appointment, Provider, WithId } from '../../core/types';
import { editInp, editSel } from '../parts';

const tel = (v?: string) => (v ? `<a class="small" href="tel:${esc(v.replace(/[^+\d]/g, ''))}">📞 ${esc(v)}</a>` : '');
const mail = (v?: string) => (v ? `<a class="small" href="mailto:${esc(v)}">✉️ ${esc(v)}</a>` : '');
const map = (v?: string) => (v ? `<a class="small" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}" target="_blank" rel="noopener noreferrer">📍 ${esc(v)}</a>` : '');
const when = (d: number, done: boolean) => (done ? '' : d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d > 0 ? `in ${d} days` : `${-d} day${d === -1 ? '' : 's'} overdue`);

export function viewCare(): string {
  const c = ctx()!, tab = S.ui.careTab;
  return `<section><h1>Medical care</h1><div class="chips tabs">
    <button class="chip-btn ${tab === 'appts' ? 'on' : ''}" data-a="care-tab" data-t="appts">🗓 Appointments</button>
    <button class="chip-btn ${tab === 'providers' ? 'on' : ''}" data-a="care-tab" data-t="providers">🩺 Care providers</button></div>
    ${tab === 'providers' ? providers(c) : appts(c)}</section>`;
}

function providers(c: Ctx): string {
  const list = items<Provider>(c.id, 'providers').sort((a, b) => PROVIDER_ROLES.indexOf(a.role) - PROVIDER_ROLES.indexOf(b.role) || a.name.localeCompare(b.name));
  return `<form class="panel addrow" data-a="provider-add"><div class="field"><label>Role</label><select class="inp" id="pv-role">${PROVIDER_ROLES.map(r => `<option>${r}</option>`).join('')}</select></div>
    <div class="field grow2"><label>Name</label><input class="inp" id="pv-name" required placeholder="Dr … / hospital name"></div><button class="btn primary" type="submit">Add provider</button></form>
    ${list.map(p => `<div class="panel ${p.emergency ? 'has-alert' : ''}"><div class="row-between"><div class="row-gap tight grow">${editInp('providers', p.id, 'name', p.name)}</div><button class="icon-btn" data-a="del" data-list="providers" data-id="${p.id}" aria-label="Delete provider">🗑</button></div>
      <div class="chips" style="margin:6px 0">${tel(p.phone)} ${mail(p.email)} ${map(p.address)}</div>
      <div class="grid3"><div class="field"><label>Role</label>${editSel('providers', p.id, 'role', p.role, PROVIDER_ROLES)}</div>
        <div class="field"><label>Phone</label>${editInp('providers', p.id, 'phone', p.phone || '', 'text', '+27…')}</div>
        <div class="field"><label>Email</label>${editInp('providers', p.id, 'email', p.email || '')}</div>
        <div class="field span2"><label>Address</label>${editInp('providers', p.id, 'address', p.address || '')}</div></div>
      <div class="field"><label>🚨 Emergency note</label>${editInp('providers', p.id, 'emergency', p.emergency || '', 'text', 'After-hours number, when to call, hospital ward…')}</div></div>`).join('')
      || '<div class="panel muted">No providers yet — add your OB/GYN, GP, midwife or doula, and the delivery hospital.</div>'}`;
}

function appts(c: Ctx): string {
  const provs = items<Provider>(c.id, 'providers'), all = items<Appointment>(c.id, 'appointments'), { upcoming, past } = splitAppts(all);
  const carry = carriedQuestions(all), todayISO = toISO(c.today);
  const pName = (id?: string) => provs.find(p => p.id === id);
  const provOpts = (sel?: string) => `<option value="">— provider —</option>${provs.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)} (${p.role})</option>`).join('')}`;
  const card = (a: WithId<Appointment>, first: boolean) => {
    const pv = pName(a.providerId), open = S.ui.openAppt === a.id, done = a.status === 'Completed', d = daysUntil(a.date, c.today);
    return `<div class="panel appt ${done ? 'done' : ''} ${first && !done ? 'next' : ''}">
      <div class="row-between"><div><b>${esc(a.title)}</b> <span class="chip">${esc(a.type)}</span> ${done ? '<span class="chip">✔ Completed</span>' : `<span class="chip ${d < 0 ? 'warn' : ''}">${when(d, false)}</span>`}
        <div class="muted small">${esc(longDate(parseDate(a.date)))}${a.time ? ' · ' + esc(a.time) : ''} · Week ${weekAtDate(c.lmp, a.date)}${pv ? ' · ' + esc(pv.name) : ''}</div>
        ${pv ? `<div class="chips">${tel(pv.phone)} ${map(pv.address)}</div>` : ''}${done && (a.vitals?.bp || a.vitals?.weight) ? `<div class="small">🩺 BP ${esc(a.vitals?.bp || '–')} · ⚖️ ${a.vitals?.weight ?? '–'} kg</div>` : ''}</div>
        <div class="row-gap tight">${done ? `<button class="btn sm" data-a="appt-status" data-id="${a.id}" data-s="Scheduled">Re-open</button>` : `<button class="btn sm primary" data-a="appt-status" data-id="${a.id}" data-s="Completed">Mark completed</button>`}
          <button class="btn sm ghost" data-a="appt-open" data-id="${a.id}">${open ? 'Close' : 'Details'}</button></div></div>
      ${first && !done && carry ? `<div class="advice building panel" style="margin:10px 0 0"><b>Questions from your last visit</b><p>${esc(carry)}</p></div>` : ''}
      ${open ? `<div class="grid3" style="margin-top:10px">
        <div class="field"><label>Title</label>${editInp('appointments', a.id, 'title', a.title)}</div><div class="field"><label>Type</label>${editSel('appointments', a.id, 'type', a.type, APPT_TYPES)}</div>
        <div class="field"><label>Provider</label><select class="inp" data-a="edit" data-list="appointments" data-id="${a.id}" data-f="providerId" aria-label="provider">${provOpts(a.providerId)}</select></div>
        <div class="field"><label>Date</label><input class="inp" type="date" data-a="edit" data-list="appointments" data-id="${a.id}" data-f="date" data-t="text" value="${esc(a.date)}" aria-label="date"></div>
        <div class="field"><label>Time</label><input class="inp" type="time" data-a="edit" data-list="appointments" data-id="${a.id}" data-f="time" data-t="text" value="${esc(a.time || '')}" aria-label="time"></div>
        <div class="field"><label>Blood pressure</label>${editInp('appointments', a.id, 'vitals.bp', a.vitals?.bp || '', 'text', '120/80')}</div>
        <div class="field"><label>Weight (kg)</label>${editInp('appointments', a.id, 'vitals.weight', a.vitals?.weight ?? null, 'num')}</div></div>
        <div class="field"><label>Doctor’s notes</label><textarea class="inp" rows="3" data-a="edit" data-list="appointments" data-id="${a.id}" data-f="notes" data-t="text" aria-label="notes" placeholder="What was said, results, next steps…">${esc(a.notes || '')}</textarea></div>
        <div class="field"><label>Questions for the next visit</label><textarea class="inp" rows="2" data-a="edit" data-list="appointments" data-id="${a.id}" data-f="questions" data-t="text" aria-label="questions" placeholder="Things to ask next time…">${esc(a.questions || '')}</textarea></div>
        <button class="btn sm ghost" data-a="del" data-list="appointments" data-id="${a.id}">🗑 Delete appointment</button>` : ''}</div>`;
  };
  return `<form class="panel addrow" data-a="appt-add">
      <div class="field"><label>Type</label><select class="inp" id="ap-type">${APPT_TYPES.map(t => `<option>${t}</option>`).join('')}</select></div>
      <div class="field grow2"><label>Title</label><input class="inp" id="ap-title" placeholder="e.g. 20-week anatomy scan" required></div>
      <div class="field"><label>Provider</label><select class="inp" id="ap-prov">${provOpts()}</select></div>
      <div class="field"><label>Date</label><input class="inp" id="ap-date" type="date" value="${todayISO}" required></div>
      <div class="field"><label>Time</label><input class="inp" id="ap-time" type="time"></div><button class="btn primary" type="submit">Schedule</button></form>
    <div class="eyebrow">Upcoming (${upcoming.length})</div>
    ${upcoming.map((a, i) => card(a, i === 0)).join('') || '<div class="panel muted">Nothing scheduled — add your next scan, check-up or blood test above.</div>'}
    <div class="eyebrow">Completed (${past.length})</div>
    ${past.map(a => card(a, false)).join('') || '<div class="panel muted">No completed visits yet.</div>'}`;
}
