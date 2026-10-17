/* Events & photography hub: baby shower / gender reveal planner (guests + RSVP, budget, tasks, registry links) and a photographer directory. */
import { EVENT_KINDS, RSVPS, SHOOT_KINDS, SHOOT_STATUSES } from '../../core/content';
import { liveMap, money, rsvpTally } from '../../core/calc';
import { ctx, type Ctx } from '../../core/ctx';
import { esc } from '../../core/format';
import { longDate, parseDate } from '../../core/gestation';
import { S } from '../../core/state';
import { items } from '../../data/db';
import type { EventItem, Guest, Photographer, WithId } from '../../core/types';
import { daysUntil } from '../../core/calc';
import { editInp, editSel, isHttp, linkOut } from '../parts';

export function viewEvents(): string {
  const c = ctx()!, tab = S.ui.eventsTab;
  return `<section><h1>Events & photography</h1><div class="chips tabs">
    <button class="chip-btn ${tab === 'events' ? 'on' : ''}" data-a="events-tab" data-t="events">🎉 Baby shower & reveal</button>
    <button class="chip-btn ${tab === 'photography' ? 'on' : ''}" data-a="events-tab" data-t="photography">📷 Photography</button></div>
    ${tab === 'photography' ? photography(c) : events(c)}</section>`;
}

function events(c: Ctx): string {
  const list = items<EventItem>(c.id, 'events').sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  return `<form class="panel addrow" data-a="event-add"><div class="field"><label>Event</label><select class="inp" id="ev-kind">${Object.entries(EVENT_KINDS).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}</select></div>
    <div class="field grow2"><label>Title</label><input class="inp" id="ev-title" placeholder="e.g. Baby shower at Gran's" required></div>
    <div class="field"><label>Date</label><input class="inp" id="ev-date" type="date"></div><button class="btn primary" type="submit">Plan event</button></form>
    ${list.map(e => eventCard(e, c)).join('') || '<div class="panel muted">No events yet. Plan a baby shower or gender reveal — a starter checklist is added for you.</div>'}`;
}

function eventCard(e: WithId<EventItem>, c: Ctx): string {
  const k = EVENT_KINDS[e.kind] || EVENT_KINDS.shower, open = S.ui.openEvent === e.id;
  const guests = liveMap<Guest>(e.guests), tasks = liveMap(e.tasks), exp = liveMap(e.expenses), links = liveMap(e.links), t = rsvpTally(guests);
  const spent = exp.reduce((s, x) => s + (x.amt || 0), 0), tdone = tasks.filter(x => x.done).length;
  const d = e.date ? daysUntil(e.date, c.today) : null;
  const head = `<div class="row-between"><div><span class="nm2">${k.icon} ${esc(e.title)}</span> <span class="chip">${k.label}</span>${d !== null && d >= 0 ? ` <span class="chip">${d === 0 ? 'Today!' : `in ${d} days`}</span>` : ''}
    <div class="muted small">${e.date ? esc(longDate(parseDate(e.date))) : 'No date yet'}${e.time ? ' · ' + esc(e.time) : ''}${e.venue ? ' · ' + esc(e.venue) : ''}</div>
    <div class="small">👥 ${t.yes} yes · ${t.pending} pending of ${t.invited} (${t.heads} attending) · ✅ ${tdone}/${tasks.length} tasks · 💰 ${money(spent)}${e.budget ? ' of ' + money(e.budget) : ''}</div></div>
    <button class="btn sm ${open ? '' : 'primary'}" data-a="event-open" data-id="${e.id}">${open ? 'Close' : 'Open'}</button></div>`;
  if (!open) return `<div class="panel">${head}</div>`;
  const nest = (f: string, v: unknown, t: 'text' | 'num' = 'text', ph = '') => editInp('events', e.id, f, v, t, ph);
  return `<div class="panel event">${head}
    <div class="grid3" style="margin-top:12px"><div class="field span2"><label>Title</label>${nest('title', e.title)}</div><div class="field"><label>Budget (R)</label>${nest('budget', e.budget, 'num')}</div>
      <div class="field"><label>Date</label><input class="inp" type="date" data-a="edit" data-list="events" data-id="${e.id}" data-f="date" data-t="text" value="${esc(e.date || '')}" aria-label="date"></div>
      <div class="field"><label>Time</label><input class="inp" type="time" data-a="edit" data-list="events" data-id="${e.id}" data-f="time" data-t="text" value="${esc(e.time || '')}" aria-label="time"></div>
      <div class="field"><label>Venue</label>${nest('venue', e.venue || '')}</div></div>
    <div class="eyebrow">Checklist</div><ul class="list">${tasks.map(x => `<li class="li"><label class="check grow"><input type="checkbox" data-a="event-task" data-id="${e.id}" data-t="${x.id}" ${x.done ? 'checked' : ''}><span class="${x.done ? 'struck' : ''}">${esc(x.text)}</span></label>
      <button class="icon-btn" data-a="nested-del" data-list="events" data-id="${e.id}" data-path="tasks.${x.id}" aria-label="Remove task">✕</button></li>`).join('')}</ul>
    <form class="addrow" data-a="event-task-add" data-id="${e.id}"><div class="field grow2"><input class="inp" id="et-${e.id}" placeholder="Add a task…" aria-label="new task"></div><button class="btn sm" type="submit">Add</button></form>
    <div class="eyebrow" style="margin-top:14px">Guest list · ${t.yes} yes · ${t.no} no · ${t.maybe} maybe · ${t.pending} pending → <b>${t.heads}</b> attending</div>
    <div class="scroll-x"><table class="tbl edit"><thead><tr><th>Name</th><th>Contact</th><th>RSVP</th><th>+ guests</th><th></th></tr></thead><tbody>
      ${guests.map(g => `<tr><td>${nest(`guests.${g.id}.name`, g.name)}</td><td>${nest(`guests.${g.id}.contact`, g.contact || '', 'text', 'Phone / email')}</td>
        <td>${editSel('events', e.id, `guests.${g.id}.rsvp`, g.rsvp, RSVPS)}</td><td>${nest(`guests.${g.id}.plus`, g.plus ?? 0, 'num')}</td>
        <td><button class="icon-btn" data-a="nested-del" data-list="events" data-id="${e.id}" data-path="guests.${g.id}" aria-label="Remove guest">✕</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">No guests yet.</td></tr>'}</tbody></table></div>
    <form class="addrow" data-a="event-guest-add" data-id="${e.id}"><div class="field grow2"><input class="inp" id="eg-name-${e.id}" placeholder="Guest name" aria-label="guest name"></div><div class="field"><input class="inp" id="eg-contact-${e.id}" placeholder="Phone / email" aria-label="guest contact"></div><button class="btn sm" type="submit">Add guest</button></form>
    <div class="eyebrow" style="margin-top:14px">Expenses · ${money(spent)}${e.budget ? ` of ${money(e.budget)} (${money(e.budget - spent)} ${e.budget - spent >= 0 ? 'left' : 'over'})` : ''}</div>
    <ul class="list">${exp.map(x => `<li class="li"><div class="grow">${nest(`expenses.${x.id}.what`, x.what)}</div><div style="width:110px">${nest(`expenses.${x.id}.amt`, x.amt, 'num')}</div>
      <button class="icon-btn" data-a="nested-del" data-list="events" data-id="${e.id}" data-path="expenses.${x.id}" aria-label="Remove expense">✕</button></li>`).join('')}</ul>
    <form class="addrow" data-a="event-expense-add" data-id="${e.id}"><div class="field grow2"><input class="inp" id="ex-what-${e.id}" placeholder="What did you pay for?" aria-label="expense"></div><div class="field"><input class="inp" id="ex-amt-${e.id}" type="number" min="0" placeholder="Amount (R)" aria-label="amount"></div><button class="btn sm" type="submit">Add expense</button></form>
    <div class="eyebrow" style="margin-top:14px">Registry & links</div>
    <ul class="list">${links.map(x => `<li class="li"><div class="grow">${nest(`links.${x.id}.label`, x.label)}</div><div class="grow">${nest(`links.${x.id}.url`, x.url, 'text', 'https://')}</div>${linkOut(x.url)}
      <button class="icon-btn" data-a="nested-del" data-list="events" data-id="${e.id}" data-path="links.${x.id}" aria-label="Remove link">✕</button></li>`).join('')}</ul>
    <form class="addrow" data-a="event-link-add" data-id="${e.id}"><div class="field"><input class="inp" id="el-label-${e.id}" placeholder="e.g. Takealot registry" aria-label="link label"></div><div class="field grow2"><input class="inp" id="el-url-${e.id}" placeholder="https://…" aria-label="link url"></div><button class="btn sm" type="submit">Add link</button></form>
    <div class="field" style="margin-top:12px"><label>Notes</label><textarea class="inp" rows="2" data-a="edit" data-list="events" data-id="${e.id}" data-f="notes" data-t="text" aria-label="notes">${esc(e.notes || '')}</textarea></div>
    <button class="btn sm ghost" data-a="del" data-list="events" data-id="${e.id}">🗑 Delete event</button></div>`;
}

function photography(c: Ctx): string {
  const kind = S.ui.shootKind, all = items<Photographer>(c.id, 'photographers');
  const list = all.filter(p => kind === 'all' || p.kind === kind).sort((a, b) => SHOOT_STATUSES.indexOf(a.status) - SHOOT_STATUSES.indexOf(b.status) || a.name.localeCompare(b.name));
  const booked = all.filter(p => p.status === 'Booked'), bookedTotal = booked.reduce((s, p) => s + (p.quote || 0), 0);
  return `<div class="stats"><div class="panel stat"><span>Booked</span><b>${booked.length}</b></div><div class="panel stat"><span>Booked total</span><b>${money(bookedTotal)}</b></div><div class="panel stat"><span>In the running</span><b>${all.filter(p => p.status === 'Enquiry' || p.status === 'Quoted').length}</b></div></div>
    <form class="panel addrow" data-a="shoot-add"><div class="field"><label>Shoot</label><select class="inp" id="sh-kind">${SHOOT_KINDS.map(([k, i, l]) => `<option value="${k}">${i} ${l}</option>`).join('')}</select></div>
      <div class="field grow2"><label>Photographer / studio</label><input class="inp" id="sh-name" required></div><div class="field"><label>Quote (R)</label><input class="inp" id="sh-quote" type="number" min="0"></div><button class="btn primary" type="submit">Add</button></form>
    <div class="chips tabs">${[['all', 'All', ''], ...SHOOT_KINDS.map(([k, i, l]) => [k, l, i])].map(([k, l, i]) => `<button class="chip-btn ${kind === k ? 'on' : ''}" data-a="shoot-kind" data-k="${k}">${i} ${l} <small>${k === 'all' ? all.length : all.filter(p => p.kind === k).length}</small></button>`).join('')}</div>
    ${list.map(p => `<div class="panel ${p.status === 'Booked' ? 'has-alert' : ''}"><div class="row-between"><div class="row-gap tight grow">${editInp('photographers', p.id, 'name', p.name)}</div><button class="icon-btn" data-a="del" data-list="photographers" data-id="${p.id}" aria-label="Delete">🗑</button></div>
      <div class="grid3"><div class="field"><label>Shoot type</label>${editSel('photographers', p.id, 'kind', p.kind, SHOOT_KINDS.map(k => k[0]))}</div>
        <div class="field"><label>Status</label>${editSel('photographers', p.id, 'status', p.status, SHOOT_STATUSES)}</div>
        <div class="field"><label>Quote (R)</label>${editInp('photographers', p.id, 'quote', p.quote, 'num')}</div>
        <div class="field"><label>Deposit paid (R)</label>${editInp('photographers', p.id, 'deposit', p.deposit ?? null, 'num')}</div>
        <div class="field"><label>Contact</label>${editInp('photographers', p.id, 'contact', p.contact || '', 'text', 'Phone / email / Instagram')}</div>
        <div class="field"><label>Portfolio</label>${editInp('photographers', p.id, 'portfolio', p.portfolio || '', 'text', 'https://')}${linkOut(p.portfolio)}</div>
        <div class="field"><label>Shoot date</label><input class="inp" type="date" data-a="edit" data-list="photographers" data-id="${p.id}" data-f="shootDate" data-t="text" value="${esc(p.shootDate || '')}" aria-label="shoot date"></div>
        <div class="field"><label>Shoot time</label><input class="inp" type="time" data-a="edit" data-list="photographers" data-id="${p.id}" data-f="shootTime" data-t="text" value="${esc(p.shootTime || '')}" aria-label="shoot time"></div>
        <div class="field"><label>Location</label>${editInp('photographers', p.id, 'location', p.location || '')}</div>
        <div class="field span2"><label>Contract (link or key terms)</label>${editInp('photographers', p.id, 'contract', p.contract || '', 'text', 'https://… or cancellation, usage rights, delivery date')}${isHttp(p.contract) ? linkOut(p.contract) : ''}</div>
        <div class="field"><label>Contract signed</label><label class="check"><input type="checkbox" data-a="shoot-signed" data-id="${p.id}" ${p.signed ? 'checked' : ''}> Signed</label></div></div>
      <div class="field"><label>Notes</label><textarea class="inp" rows="2" data-a="edit" data-list="photographers" data-id="${p.id}" data-f="notes" data-t="text" aria-label="notes" placeholder="Included images, session length, outfits, questions…">${esc(p.notes || '')}</textarea></div></div>`).join('')
      || '<div class="panel muted">No photographers here yet — add maternity, birth and newborn options to compare quotes.</div>'}`;
}
