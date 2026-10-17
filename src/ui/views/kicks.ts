/* Kick counter: start a session, tap for each movement, see time-to-10. Taps are a map so both phones can tap at once. */
import { activeKick, KICK_GOAL, kickCount, secondsToGoal } from '../../core/calc';
import { ctx } from '../../core/ctx';
import { clock, esc, hhmm, plural } from '../../core/format';
import { longDate } from '../../core/gestation';
import { pname } from '../../core/state';
import { items } from '../../data/db';
import type { KickSession } from '../../core/types';

export function viewKicks(): string {
  const c = ctx()!;
  const all = items<KickSession>(c.id, 'kicks'), live = activeKick(all);
  const past = all.filter(s => s.end != null).sort((a, b) => b.start - a.start);
  const n = live ? kickCount(live) : 0, reached = live && n >= live.goal;
  const goalSec = live ? secondsToGoal(live) : null;
  return `<section>
    <h1>Kick counter</h1>
    ${live ? `<div class="panel center bigcount">
        <div class="count" id="kickcount" aria-live="polite">${n}<small>/${live.goal}</small></div>
        <div class="muted">Elapsed <b data-since="${live.start}">${clock((Date.now() - live.start) / 1000)}</b></div>
        ${reached ? `<p class="good">🎉 ${live.goal} movements in ${goalSec != null ? clock(goalSec) : '—'}. You can stop now.</p>` : `<p class="muted">Tap every time you feel baby move.</p>`}
        <button class="btn primary kickbtn" data-a="kick-tap" aria-label="Count a kick">👣 Kick!</button>
        <div class="row-gap"><button class="btn" data-a="kick-undo" ${n ? '' : 'disabled'}>Undo last</button><button class="btn" data-a="kick-stop">${reached ? 'Finish' : 'Stop session'}</button></div>
      </div>` : `<div class="panel center">
        <p>Pick a time of day when baby is usually active, get comfortable, and count movements until you reach <b>${KICK_GOAL}</b>.</p>
        <button class="btn primary big" data-a="kick-start">Start counting</button></div>`}
    <div class="panel"><div class="eyebrow">History</div>
      <ul class="list">${past.map(s => { const k = kickCount(s), t = secondsToGoal(s); return `<li class="li"><div class="grow"><b>${plural(k, 'kick')}</b>${t != null ? ` in <b>${clock(t)}</b>` : ` in ${clock(((s.end || s.start) - s.start) / 1000)}`}
        <small class="muted">${esc(longDate(new Date(s.start)))}, ${hhmm(s.start)}${s.by ? ' · ' + esc(pname(s.by)) : ''}</small></div>
        <button class="icon-btn" data-a="del-kick" data-id="${s.id}" aria-label="Delete session">🗑</button></li>`; }).join('') || '<li class="muted">No sessions yet.</li>'}</ul></div>
    <p class="small muted">Many providers suggest counting from about week 28. If movements slow down or stop, or you are worried, contact your midwife or doctor straight away — don’t wait. This tool is not medical advice.</p>
  </section>`;
}
