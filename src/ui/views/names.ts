/* Baby names: either partner suggests; each rates 1–10 and hearts their favourites on their OWN phone; both hearts = a match. */
import { NAME_ORIGINS } from '../../core/content';
import { nameAvg, nameDisagree, nameFavs, nameMatch, rankNames } from '../../core/calc';
import { ctx } from '../../core/ctx';
import { esc } from '../../core/format';
import { S, pname } from '../../core/state';
import { items } from '../../data/db';
import type { BabyName, Who } from '../../core/types';

const FILTERS: [string, string][] = [['all', 'All'], ['match', '💕 Matches'], ['fav', '♥ Favourites'], ['todo', 'Need your vote']];

export function viewNames(): string {
  const c = ctx()!, all = items<BabyName>(c.id, 'names'), f = S.ui.nameFilter, me = S.me;
  const shown = rankNames(all).filter(n => f === 'match' ? nameMatch(n) : f === 'fav' ? nameFavs(n) > 0 : f === 'todo' ? !(me && n.votes?.[me]) : true);
  const matches = all.filter(nameMatch).length;
  const col = (n: BabyName & { id: string }, w: Who) => {
    const mine = me === w, v = n.votes?.[w] ?? 0, fav = !!n.fav?.[w];
    return `<div class="who-col ${mine ? 'mine' : ''}"><div class="small muted">${esc(pname(w))}${mine ? ' (you)' : ''}</div>
      <div class="row-gap tight"><button class="heart ${fav ? 'on' : ''}" data-a="name-fav" data-id="${n.id}" data-w="${w}" ${mine ? '' : 'disabled'} aria-label="${fav ? 'Unfavourite' : 'Favourite'} for ${pname(w)}" aria-pressed="${fav}">${fav ? '♥' : '♡'}</button>
      <select class="inp sm" data-a="name-vote" data-id="${n.id}" data-w="${w}" ${mine ? '' : 'disabled'} aria-label="${pname(w)}'s score"><option value="">–</option>${Array.from({ length: 10 }, (_, i) => i + 1).map(k => `<option ${k === v ? 'selected' : ''}>${k}</option>`).join('')}</select></div></div>`;
  };
  return `<section>
    <div class="row-between"><h1>Baby names</h1><span class="chip">${all.length} names · ${matches} match${matches === 1 ? '' : 'es'}</span></div>
    ${me ? '' : '<div class="panel advice building">Choose who you are in <b>Settings → This device</b> so your votes are saved under your name.</div>'}
    <form class="panel addrow" data-a="name-add">
      <div class="field"><label>Name</label><input class="inp" id="nm-name" required></div>
      <div class="field grow2"><label>Meaning</label><input class="inp" id="nm-meaning"></div>
      <div class="field"><label>Origin</label><select class="inp" id="nm-origin"><option value=""></option>${NAME_ORIGINS.map(o => `<option>${o}</option>`).join('')}</select></div>
      <button class="btn primary" type="submit">Suggest</button></form>
    <div class="chips tabs">${FILTERS.map(([k, l]) => `<button class="chip-btn ${f === k ? 'on' : ''}" data-a="name-filter" data-f="${k}">${l}</button>`).join('')}</div>
    ${shown.map(n => `<div class="panel name ${nameMatch(n) ? 'match' : ''}">
      <div class="row-between"><div><span class="nm">${esc(n.name)}</span> ${nameMatch(n) ? '<span class="chip warn">💕 Match!</span>' : ''}${nameDisagree(n) ? '<span class="chip">scores differ — chat!</span>' : ''}
        <div class="muted small">${esc([n.meaning, n.origin].filter(Boolean).join(' · '))}${n.by ? ` · suggested by ${esc(pname(n.by))}` : ''}</div></div>
        <div class="avg">${nameAvg(n) ? `<span class="star">★</span> ${nameAvg(n).toFixed(1)}` : '<span class="faint">–</span>'}</div></div>
      <div class="who-row">${col(n, 'P')}${col(n, 'M')}</div>
      <div class="row-gap tight"><input class="inp" data-a="edit" data-list="names" data-id="${n.id}" data-f="note" data-t="text" value="${esc(n.note || '')}" placeholder="Note — nicknames, initials, how it sounds with the surname…" aria-label="note">
        <button class="icon-btn" data-a="del" data-list="names" data-id="${n.id}" aria-label="Delete name">🗑</button></div></div>`).join('') || '<div class="panel muted">Nothing here yet — suggest the first name above.</div>'}
  </section>`;
}
