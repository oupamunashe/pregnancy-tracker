/* Newborn supplies (need vs have) + diaper log + days-of-nappies-left + diaper size calculator (South Africa). */
import { SUPPLY_GROUPS } from '../../core/content';
import { avgPerDay, daysOfNappiesLeft, diaperDays, groupBy, money, nappiesRemaining } from '../../core/calc';
import { ctx } from '../../core/ctx';
import { esc, hhmm } from '../../core/format';
import { DIAPER_BRANDS, matchBrands, parseWeight, placeholderImage, rangeText } from '../../core/diaper';
import { longDate, parseDate } from '../../core/gestation';
import { items } from '../../data/db';
import type { DiaperEntry, DiaperStock, Supply } from '../../core/types';
import { ProgressBar, editInp, editSel } from '../parts';
import { S } from '../../core/state';

const KINDS: [DiaperEntry['kind'], string][] = [['wet', '💧 Wet'], ['dirty', '💩 Dirty'], ['both', '💧💩 Both']];

export function viewSupplies(): string {
  const c = ctx()!, sup = items<Supply>(c.id, 'supplies'), tab = S.ui.supplyTab || 'list';
  return `<section><h1>Supplies & diapers</h1>
    <div class="chips tabs">${[['list', '🧺 Newborn supplies'], ['log', '🧷 Diaper log'], ['size', '📏 Size calculator']].map(([k, l]) => `<button class="chip-btn ${tab === k ? 'on' : ''}" data-a="supply-tab" data-t="${k}">${l}</button>`).join('')}</div>
    ${tab === 'log' ? log(c.id) : tab === 'size' ? sizes(c.id) : list(sup)}</section>`;
}

function list(sup: (Supply & { id: string })[]): string {
  const have = sup.filter(s => s.have >= s.need && s.need > 0).length;
  const est = sup.reduce((a, s) => a + (s.est || 0) * Math.max(0, s.need - s.have), 0);
  return `<div class="panel"><div class="row-between"><h2>Newborn supplies</h2><span class="muted">${have} / ${sup.length} complete${est ? ' · still to buy ≈ ' + money(est) : ''}</span></div>${ProgressBar(sup.length ? have / sup.length : 0)}
    ${sup.length ? '' : '<button class="btn" data-a="seed" data-what="supplies">Load starter list</button>'}</div>
    <form class="panel addrow" data-a="supply-add"><div class="field"><label>Group</label><select class="inp" id="su-group">${SUPPLY_GROUPS.map(g => `<option>${g}</option>`).join('')}</select></div>
      <div class="field grow2"><label>Item</label><input class="inp" id="su-text" required></div><div class="field"><label>Need</label><input class="inp" id="su-need" type="number" min="1" value="1"></div><button class="btn primary" type="submit">Add</button></form>
    ${groupBy([...sup].sort((a, b) => SUPPLY_GROUPS.indexOf(a.group) - SUPPLY_GROUPS.indexOf(b.group) || a.text.localeCompare(b.text)), s => s.group).map(([g, rows]) => `<div class="panel"><h2>${esc(g)}</h2><ul class="list">
      ${rows.map(s => `<li class="li"><div class="grow ${s.have >= s.need ? 'struck' : ''}">${editInp('supplies', s.id, 'text', s.text)}</div>
        <div class="stepper"><button class="btn sm" data-a="sup-have" data-id="${s.id}" data-d="-1" aria-label="One less">−</button><b aria-label="have">${s.have}</b><span class="muted">/</span>${editInp('supplies', s.id, 'need', s.need, 'num')}<button class="btn sm" data-a="sup-have" data-id="${s.id}" data-d="1" aria-label="One more">+</button></div>
        <button class="icon-btn" data-a="del" data-list="supplies" data-id="${s.id}" aria-label="Delete">🗑</button></li>`).join('')}</ul></div>`).join('')}`;
}

function log(pid: string): string {
  const all = items<DiaperEntry & { id: string }>(pid, 'diapers'), entries = all.filter(e => !e.id.startsWith('_'));
  const stock = all.find(e => e.id === '_stock') as unknown as DiaperStock & { at?: number } | undefined;
  const days = diaperDays(entries, Date.now(), 7), today = days[days.length - 1], avg = avgPerDay(days);
  const left = nappiesRemaining(stock as any, entries), daysLeft = left != null ? daysOfNappiesLeft(left, avg) : null;
  const recent = [...entries].sort((a, b) => b.at - a.at).slice(0, 12);
  return `<div class="panel center"><div class="eyebrow">Log a nappy change</div><div class="row-gap">${KINDS.map(([k, l]) => `<button class="btn primary big" data-a="diaper-log" data-k="${k}">${l}</button>`).join('')}</div>
      <p class="muted">Today: <b>${today.total}</b> (${today.wet} wet · ${today.dirty} dirty · ${today.both} both)</p></div>
    <div class="panel"><div class="eyebrow">Nappy stock</div>
      <div class="addrow"><div class="field"><label>Nappies on hand</label><input class="inp" id="st-count" type="number" min="0" value="${stock?.stock ?? ''}" placeholder="e.g. 60"></div>
        <div class="field"><label>Nappies per pack</label><input class="inp" id="st-pack" type="number" min="1" value="${stock?.perPack ?? 50}"></div>
        <button class="btn" data-a="stock-set">Set count</button><button class="btn" data-a="stock-pack">+ Add a pack</button></div>
      <div class="stats"><div class="stat"><span>Left</span><b>${left ?? '–'}</b></div><div class="stat"><span>Avg / day</span><b>${avg ? avg.toFixed(1) : '–'}</b></div>
        <div class="stat"><span>Lasts about</span><b class="${daysLeft != null && daysLeft < 4 ? 'neg' : ''}">${daysLeft != null ? daysLeft + ' days' : '–'}</b></div></div>
      ${daysLeft != null && daysLeft < 4 ? '<p class="neg"><b>Running low</b> — time to buy more.</p>' : ''}
      <p class="small muted">“Left” = the count you set minus nappies logged since. Average is the last few full days.</p></div>
    <div class="panel"><div class="eyebrow">Last 7 days</div><div class="scroll-x"><table class="tbl"><thead><tr><th>Day</th><th>Wet</th><th>Dirty</th><th>Both</th><th>Total</th></tr></thead><tbody>
      ${[...days].reverse().map(d => `<tr><td>${esc(longDate(parseDate(d.d)))}</td><td>${d.wet}</td><td>${d.dirty}</td><td>${d.both}</td><td><b>${d.total}</b></td></tr>`).join('')}</tbody></table></div></div>
    <div class="panel"><div class="eyebrow">Recent changes</div><ul class="list">${recent.map(e => `<li class="li"><div class="grow">${hhmm(e.at)} · ${KINDS.find(k => k[0] === e.kind)![1]}</div><button class="icon-btn" data-a="del" data-list="diapers" data-id="${e.id}" aria-label="Delete">🗑</button></li>`).join('') || '<li class="muted">Nothing logged yet.</li>'}</ul></div>`;
}

function sizes(pid: string): string {
  const all = items<any>(pid, 'diapers'), w = (all.find(e => e.id === '_stock') as any)?.weight || '';
  const kg = parseWeight(w), res = kg === null ? [] : matchBrands(kg);
  void DIAPER_BRANDS;
  return `<div class="panel"><div class="eyebrow">Diaper size calculator · South Africa</div>
    <div class="addrow"><div class="field"><label for="dz-kg">Baby's weight (kg)</label><input class="inp" id="dz-kg" data-a="diaper-weight" type="number" step="0.1" min="0" value="${esc(w)}" placeholder="e.g. 5.5"></div></div>
    <p class="small muted">Sizes overlap between brands — the “best fit” is closest to the middle of its range. Always check the pack.</p></div>
    ${kg === null ? '<div class="panel muted">Enter a weight to see matching sizes.</div>' : `<div class="grid2">${res.map(({ brand, matches, nearest }) => `<div class="panel"><div class="brandbar" style="background:${brand.color}">${esc(brand.brand)}</div>
      ${matches.map(({ size, best }) => `<div class="sizecard ${best ? 'best' : ''}"><img class="pack" src="${esc(size.image || placeholderImage(brand.brand, size.label, brand.color))}" alt="${esc(brand.brand + ' ' + size.label)}"
        data-brand="${esc(brand.brand)}" data-size="${esc(size.label)}" data-color="${brand.color}" loading="lazy" referrerpolicy="no-referrer">
        <div><b>${esc(size.label)}</b><div><span class="chip">${rangeText(size)}</span>${best ? ' <span class="chip warn">★ Best fit</span>' : ''}</div></div></div>`).join('') || `<p class="muted small">No size in range for ${kg} kg. Nearest: ${esc(nearest.label)} (${rangeText(nearest)}).</p>`}</div>`).join('')}</div>`}`;
}
void editSel;
