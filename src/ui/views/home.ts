/* Home: the progress wheel, countdown, this week's baby size and the next things to do. */
import { ctx, type Ctx } from '../../core/ctx';
import { WEEK_TASKS, weekInfo } from '../../core/content';
import { esc } from '../../core/format';
import { longDate, trimesterOf } from '../../core/gestation';
import { S } from '../../core/state';
import { items } from '../../data/db';
import { activeKick, KICK_GOAL, kickCount, splitAppts, daysUntil, weekAtDate } from '../../core/calc';
import { shortDate, parseDate } from '../../core/gestation';
import type { Appointment } from '../../core/types';

const R = 52, C = 2 * Math.PI * R;
export function wheel(c: Ctx) {
  const pre = c.ga.totalDays < 0, dash = C * (1 - c.progress), tri = trimesterOf(c.ga.weeks);
  return `<div class="wheel" role="img" aria-label="${pre ? 'Not started' : `${c.ga.weeks} weeks ${c.ga.days} days, ${Math.round(c.progress * 100)} percent`}">
    <svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="${R}"/><circle class="ring-fg" cx="60" cy="60" r="${R}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${dash.toFixed(1)}" transform="rotate(-90 60 60)"/></svg>
    <div class="wheel-in">${pre ? `<b class="big">${-c.ga.totalDays}d</b><span>until LMP</span>` : `<b class="big">${c.ga.weeks}<small>w</small> ${c.ga.days}<small>d</small></b><span>Trimester ${tri} · ${Math.round(c.progress * 100)}%</span>`}</div></div>`;
}

export function viewHome(): string {
  const c = ctx()!, info = weekInfo(c.ga.weeks);
  const weekly = S.lists[c.id + '~weekly']?.items || {};
  const open = WEEK_TASKS.filter(t => t.week >= Math.max(0, c.ga.weeks - 1) && !weekly[t.key]?.done).slice(0, 4);
  const kick = activeKick(items(c.id, 'kicks')), kicks = kick ? kickCount(kick) : 0;
  const cd = c.daysToGo, nextAppt = splitAppts(items<Appointment>(c.id, 'appointments')).upcoming[0];
  return `<section class="home">
    <div class="panel hero">${wheel(c)}
      <div class="hero-side">
        <div class="kv"><span>Due date</span><b>${esc(longDate(c.edd))}</b></div>
        <div class="kv"><span>${cd >= 0 ? 'Countdown' : 'Past due by'}</span><b>${cd >= 0 ? `${cd} days` : `${-cd} days`}</b>${cd >= 0 ? `<small>${Math.floor(cd / 7)} weeks ${cd % 7} days</small>` : ''}</div>
        <div class="kv"><span>${esc(c.p.nickname)}</span><small>LMP ${esc(longDate(c.lmp))}</small></div>
      </div></div>
    ${nextAppt ? `<button class="panel nextappt" data-a="nav" data-v="care"><div class="eyebrow">Next appointment</div><b>${esc(nextAppt.title)}</b> <span class="chip">${(() => { const d = daysUntil(nextAppt.date, c.today); return d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d > 0 ? `in ${d} days` : 'overdue'; })()}</span><div class="muted small">${esc(shortDate(parseDate(nextAppt.date)))}${nextAppt.time ? ' · ' + esc(nextAppt.time) : ''} · Week ${weekAtDate(c.lmp, nextAppt.date)}</div></button>` : ''}
    <div class="grid2">
      <div class="panel"><div class="eyebrow">Week ${info.week}</div><div class="emoji" aria-hidden="true">${info.emoji}</div>
        <p>Baby is about the size of a <b>${esc(info.size)}</b>.</p><p class="muted">${esc(info.note)}</p>
        <button class="btn sm" data-a="nav" data-v="weeks">Weekly milestones →</button></div>
      <div class="panel"><div class="eyebrow">Next to do</div>
        <ul class="list">${open.map(t => `<li><label class="check"><input type="checkbox" data-a="weektask" data-key="${t.key}"><span>${esc(t.title)}<small>Week ${t.week} · ${esc(t.cat)}</small></span></label></li>`).join('') || '<li class="muted">All caught up 🎉</li>'}</ul></div>
    </div>
    <div class="quick">
      <button class="btn big-btn" data-a="nav" data-v="kicks"><span aria-hidden="true">👣</span>${kick ? `Counting… ${kicks}/${KICK_GOAL}` : 'Kick counter'}</button>
      <button class="btn big-btn" data-a="nav" data-v="contractions"><span aria-hidden="true">⏱</span>Contraction timer</button>
      <button class="btn big-btn" data-a="sheet-symptom"><span aria-hidden="true">📝</span>Log a symptom</button>
      <button class="btn big-btn" data-a="nav" data-v="prep"><span aria-hidden="true">🧳</span>Prep checklists</button>
    </div></section>`;
}
void [ctx];
