/* Weekly milestones: browse weeks 4–40 — baby size, what is happening, and that week's to-dos with done-flags. */
import { ctx } from '../../core/ctx';
import { WEEK_TASKS, weekInfo } from '../../core/content';
import { esc } from '../../core/format';
import { longDate, shortDate, trimesterOf } from '../../core/gestation';
import { S } from '../../core/state';

export function viewWeeks(): string {
  const c = ctx()!, cur = Math.max(4, Math.min(40, c.ga.weeks));
  const w = S.ui.week ?? cur, info = weekInfo(w);
  const weekly = S.lists[c.id + '~weekly']?.items || {};
  const tasks = WEEK_TASKS.filter(t => t.week === w);
  const strip = Array.from({ length: 37 }, (_, i) => i + 4).map(n => {
    const ts = WEEK_TASKS.filter(t => t.week === n), done = ts.length > 0 && ts.every(t => weekly[t.key]?.done);
    return `<button class="wk ${n === w ? 'on' : ''} ${n === cur ? 'now' : ''} ${done ? 'done' : ''}" data-a="week" data-w="${n}" aria-label="Week ${n}${n === cur ? ' (now)' : ''}" ${n === w ? 'aria-current="true"' : ''}>${n}</button>`;
  }).join('');
  const wk = (w: number) => (w < c.ga.weeks ? 'past' : w === c.ga.weeks ? 'this week' : 'upcoming');
  return `<section>
    <div class="weekstrip" id="weekstrip">${strip}</div>
    <div class="panel">
      <div class="row-between"><button class="btn sm" data-a="week" data-w="${Math.max(4, w - 1)}" ${w <= 4 ? 'disabled' : ''}>‹ Prev</button>
        <div class="center"><div class="eyebrow">Week ${w} · Trimester ${trimesterOf(w)}</div><small class="muted">${esc(shortDate(c.dateOfWeek(w)))} – ${esc(longDate(c.dateOfWeek(w + 1)))} · ${wk(w)}</small></div>
        <button class="btn sm" data-a="week" data-w="${Math.min(40, w + 1)}" ${w >= 40 ? 'disabled' : ''}>Next ›</button></div>
      <div class="milestone"><div class="emoji xl" aria-hidden="true">${info.emoji}</div>
        <div><p>About the size of a <b>${esc(info.size)}</b>.</p><p class="muted">${esc(info.note)}</p></div></div>
      ${w !== cur ? `<button class="btn ghost sm" data-a="week" data-w="${cur}">Jump to this week</button>` : ''}
    </div>
    <div class="panel"><div class="eyebrow">To do in week ${w}</div>
      <ul class="list">${tasks.map(t => `<li><label class="check"><input type="checkbox" data-a="weektask" data-key="${t.key}" ${weekly[t.key]?.done ? 'checked' : ''}><span class="${weekly[t.key]?.done ? 'struck' : ''}">${esc(t.title)}<small>${esc(t.cat)}</small></span></label></li>`).join('') || '<li class="muted">Nothing scheduled this week — rest up. 💤</li>'}</ul></div>
  </section>`;
}
