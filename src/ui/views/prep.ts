/* Prep checklists: hospital bag (parent / partner / baby), nursery, admin. */
import { ctx } from '../../core/ctx';
import { PREP_GROUPS } from '../../core/content';
import { esc } from '../../core/format';
import { longDate } from '../../core/gestation';
import { S } from '../../core/state';
import { items } from '../../data/db';
import type { PrepItem } from '../../core/types';

export function viewPrep(): string {
  const c = ctx()!, all = items<PrepItem>(c.id, 'prep'), g = PREP_GROUPS.find(x => x.id === S.ui.prepGroup) || PREP_GROUPS[0];
  const mine = all.filter(i => i.group === g.id).sort((a, b) => Number(a.done) - Number(b.done) || a.text.localeCompare(b.text));
  const done = mine.filter(i => i.done).length;
  return `<section>
    <h1>Prep checklists</h1>
    <div class="chips tabs">${PREP_GROUPS.map(x => { const t = all.filter(i => i.group === x.id), d = t.filter(i => i.done).length;
      return `<button class="chip-btn ${x.id === g.id ? 'on' : ''}" data-a="prep-group" data-g="${x.id}">${x.icon} ${esc(x.label.replace('Hospital bag — ', 'Bag · '))} <small>${d}/${t.length}</small></button>`; }).join('')}</div>
    <div class="panel">
      <div class="row-between"><h2>${g.icon} ${esc(g.label)}</h2><span class="muted">${done} / ${mine.length}</span></div>
      <div class="bar"><span style="width:${mine.length ? done / mine.length * 100 : 0}%"></span></div>
      <p class="small muted">Aim to be done by week ${g.week} (${esc(longDate(c.dateOfWeek(g.week)))}).</p>
      <ul class="list">${mine.map(i => `<li class="li"><label class="check grow"><input type="checkbox" data-a="prep-toggle" data-id="${i.id}" ${i.done ? 'checked' : ''}><span class="${i.done ? 'struck' : ''}">${esc(i.text)}</span></label>
        <button class="icon-btn" data-a="prep-del" data-id="${i.id}" aria-label="Delete">✕</button></li>`).join('') || '<li class="muted">Empty — add the first item below.</li>'}</ul>
      <form class="row-gap" data-a="prep-add"><input class="inp" id="prep-new" placeholder="Add an item…" autocomplete="off"><button class="btn" type="submit">Add</button></form>
    </div></section>`;
}
