/* Symptom logger: add (kind, severity, note, date), grouped by day, plus a 7-day summary. */
import { ctx } from '../../core/ctx';
import { SEVERITY, SYMPTOM_KINDS } from '../../core/content';
import { symptomSummary } from '../../core/calc';
import { esc, hhmm } from '../../core/format';
import { longDate, parseDate, toISO } from '../../core/gestation';
import { pname } from '../../core/state';
import { items } from '../../data/db';
import type { Symptom } from '../../core/types';

export function sheetSymptomBody(todayISO: string) {
  return `<div class="field"><label>What are you feeling?</label><div class="chips" id="sy-kinds">${SYMPTOM_KINDS.map((k, i) => `<button type="button" class="chip-btn ${i === 0 ? 'on' : ''}" data-a="pick-kind" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div></div>
    <div class="field"><label>How bad?</label><div class="chips" id="sy-sev">${[1, 2, 3].map(s => `<button type="button" class="chip-btn ${s === 1 ? 'on' : ''}" data-a="pick-sev" data-s="${s}">${SEVERITY[s]}</button>`).join('')}</div></div>
    <div class="field"><label for="sy-date">Date</label><input id="sy-date" class="inp" type="date" value="${todayISO}"></div>
    <div class="field"><label for="sy-note">Note (optional)</label><textarea id="sy-note" class="inp" rows="2" placeholder="When did it start, what helped…"></textarea></div>`;
}

export function viewSymptoms(): string {
  const c = ctx()!, todayISO = toISO(c.today);
  const list = items<Symptom>(c.id, 'symptoms').sort((a, b) => b.d.localeCompare(a.d) || b.at - a.at);
  const days = [...new Set(list.map(s => s.d))];
  const sum = symptomSummary(list, todayISO);
  return `<section>
    <div class="row-between"><h1>Symptoms</h1><button class="btn primary" data-a="sheet-symptom">+ Log symptom</button></div>
    <div class="panel"><div class="eyebrow">Last 7 days</div>
      ${sum.length ? `<div class="chips">${sum.map(([k, n]) => `<span class="chip">${esc(k)} ×${n}</span>`).join('')}</div>` : '<p class="muted">Nothing logged this week.</p>'}</div>
    ${days.map(d => `<div class="panel"><div class="eyebrow">${esc(longDate(parseDate(d)))}</div><ul class="list">
      ${list.filter(s => s.d === d).map(s => `<li class="li"><div class="sev s${s.sev}" aria-label="${SEVERITY[s.sev]}"></div>
        <div class="grow"><b>${esc(s.kind)}</b> <small class="muted">${SEVERITY[s.sev]} · ${hhmm(s.at)}${s.by ? ' · ' + esc(pname(s.by)) : ''}</small>${s.note ? `<div class="muted">${esc(s.note)}</div>` : ''}</div>
        <button class="icon-btn" data-a="del-symptom" data-id="${s.id}" aria-label="Delete">🗑</button></li>`).join('')}</ul></div>`).join('') || '<div class="panel muted">No symptoms logged yet. Tap “Log symptom” to start a record you can show your doctor.</div>'}
  </section>`;
}
