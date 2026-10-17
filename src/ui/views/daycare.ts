/* Daycare & caregiver finder: a comparison table, then a card per option with status, costs, ratings from both of you and visit log. */
import { careRating, liveVisits, money } from '../../core/calc';
import { ctx } from '../../core/ctx';
import { esc } from '../../core/format';
import { longDate, parseDate } from '../../core/gestation';
import { S, pname } from '../../core/state';
import { items } from '../../data/db';
import type { CareStatus, Daycare, Who } from '../../core/types';
import { editInp, editSel } from '../parts';

export const CARE_STATUSES: CareStatus[] = ['Shortlist', 'Visited', 'Chosen', 'Rejected'];

export function viewDaycare(): string {
  const c = ctx()!, list = items<Daycare>(c.id, 'daycares'), me = S.me;
  const byFee = [...list].sort((a, b) => (a.fee ?? Infinity) - (b.fee ?? Infinity) || a.name.localeCompare(b.name));
  const cheapest = byFee.find(d => d.fee != null && d.status !== 'Rejected');
  const rate = (d: Daycare & { id: string }, w: Who) => `<label class="small muted">${esc(pname(w))}${me === w ? ' (you)' : ''}
    <select class="inp sm" data-a="care-rate" data-id="${d.id}" data-w="${w}" ${me === w ? '' : 'disabled'}><option value="">–</option>${Array.from({ length: 10 }, (_, i) => i + 1).map(k => `<option ${k === d.ratings?.[w] ? 'selected' : ''}>${k}</option>`).join('')}</select></label>`;
  return `<section><h1>Daycare & caregivers</h1>
    <form class="panel addrow" data-a="care-add">
      <div class="field"><label>Type</label><select class="inp" id="dc-kind"><option value="daycare">Daycare / creche</option><option value="caregiver">Nanny / caregiver</option></select></div>
      <div class="field grow2"><label>Name</label><input class="inp" id="dc-name" required></div>
      <div class="field"><label>Monthly fee (R)</label><input class="inp" id="dc-fee" type="number" min="0"></div><button class="btn primary" type="submit">Add</button></form>
    ${list.length ? `<div class="panel"><div class="eyebrow">Comparison${cheapest ? ` · cheapest: ${esc(cheapest.name)}` : ''}</div><div class="scroll-x"><table class="tbl"><thead><tr><th>Name</th><th>Fee / month</th><th>Hours</th><th>Rating</th><th>Visits</th><th>Status</th></tr></thead><tbody>
      ${byFee.map(d => `<tr class="${d.status === 'Rejected' ? 'faint' : ''}"><td><b>${esc(d.name)}</b><div class="small muted">${d.kind === 'caregiver' ? 'Caregiver' : 'Daycare'}</div></td><td>${d.fee != null ? money(d.fee) : '–'}</td><td>${esc(d.hours || '–')}</td>
        <td>${careRating(d) ? `<span class="star">★</span> ${careRating(d).toFixed(1)}` : '–'}</td><td>${liveVisits(d).length}</td><td><span class="chip ${d.status === 'Chosen' ? 'warn' : ''}">${d.status}</span></td></tr>`).join('')}</tbody></table></div></div>` : ''}
    ${byFee.map(d => `<div class="panel"><div class="row-between"><div class="row-gap tight grow">${editInp('daycares', d.id, 'name', d.name)}</div>
        <button class="icon-btn" data-a="del" data-list="daycares" data-id="${d.id}" aria-label="Delete">🗑</button></div>
      <div class="grid3">
        <div class="field"><label>Status</label>${editSel('daycares', d.id, 'status', d.status, CARE_STATUSES)}</div>
        <div class="field"><label>Fee / month (R)</label>${editInp('daycares', d.id, 'fee', d.fee, 'num')}</div>
        <div class="field"><label>Hours</label>${editInp('daycares', d.id, 'hours', d.hours || '', 'text', '06:30 – 18:00')}</div>
        <div class="field span2"><label>Address</label>${editInp('daycares', d.id, 'address', d.address || '')}</div>
        <div class="field"><label>Contact</label>${editInp('daycares', d.id, 'contact', d.contact || '', 'text', 'Phone / email')}</div></div>
      <div class="field"><label>Notes</label><textarea class="inp" rows="2" data-a="edit" data-list="daycares" data-id="${d.id}" data-f="notes" data-t="text" aria-label="notes" placeholder="Ratios, meals, cleanliness, vibe…">${esc(d.notes || '')}</textarea></div>
      <div class="row-gap tight">${rate(d, 'P')}${rate(d, 'M')}<button class="btn sm" data-a="care-visit" data-id="${d.id}">+ Log a visit</button></div>
      ${liveVisits(d).length ? `<ul class="list">${liveVisits(d).map(v => `<li class="li"><div class="grow"><b>${esc(longDate(parseDate(v.d)))}</b>${v.by ? ` <small class="muted">${esc(pname(v.by))}</small>` : ''}<div class="muted">${esc(v.note || '')}</div></div>
        <button class="icon-btn" data-a="care-visit-del" data-id="${d.id}" data-v="${v.id}" aria-label="Delete visit">✕</button></li>`).join('')}</ul>` : ''}</div>`).join('')}
    ${list.length ? '' : '<div class="panel muted">No daycares or caregivers shortlisted yet.</div>'}
  </section>`;
}
