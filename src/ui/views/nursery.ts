/* Nursery: item planner (status, to-do, cost, link) and a vision board of images, notes and colour swatches. */
import { NURSERY_STATUSES, SWATCHES } from '../../core/content';
import { money } from '../../core/calc';
import { ctx } from '../../core/ctx';
import { esc } from '../../core/format';
import { longDate } from '../../core/gestation';
import { S } from '../../core/state';
import { items } from '../../data/db';
import type { NurseryItem, VisionCard } from '../../core/types';
import { ProgressBar, editInp, editSel, imgTag, linkOut } from '../parts';

export function viewNursery(): string {
  const tab = S.ui.nurseryTab;
  return `<section><h1>Nursery</h1>
    <div class="chips tabs"><button class="chip-btn ${tab === 'plan' ? 'on' : ''}" data-a="nursery-tab" data-t="plan">📋 Planner</button><button class="chip-btn ${tab === 'vision' ? 'on' : ''}" data-a="nursery-tab" data-t="vision">🎨 Vision board</button></div>
    ${tab === 'vision' ? vision() : plan()}</section>`;
}

function plan(): string {
  const c = ctx()!, list = items<NurseryItem>(c.id, 'nursery').sort((a, b) => Number(a.done) - Number(b.done) || NURSERY_STATUSES.indexOf(a.status) - NURSERY_STATUSES.indexOf(b.status) || a.text.localeCompare(b.text));
  const done = list.filter(i => i.done).length, est = list.reduce((s, i) => s + (i.est || 0), 0);
  return `<div class="panel"><div class="row-between"><h2>Nursery essentials</h2><span class="muted">${done} / ${list.length} set up${est ? ' · est ' + money(est) : ''}</span></div>${ProgressBar(list.length ? done / list.length : 0)}
    <p class="small muted">Aim to have it all set up by week 36 (${esc(longDate(c.dateOfWeek(36)))}).</p>
    ${list.length ? '' : '<button class="btn" data-a="seed" data-what="nursery">Load starter list</button>'}
    <div class="scroll-x"><table class="tbl edit"><thead><tr><th></th><th>Item</th><th>Status</th><th>To-do</th><th>Cost (R)</th><th>Link</th><th></th></tr></thead><tbody>
    ${list.map(i => `<tr><td><input type="checkbox" data-a="nursery-done" data-id="${i.id}" ${i.done ? 'checked' : ''} aria-label="Set up: ${esc(i.text)}"></td><td>${editInp('nursery', i.id, 'text', i.text)}</td>
      <td><select class="inp" data-a="nursery-status" data-id="${i.id}" aria-label="status">${NURSERY_STATUSES.map(s => `<option ${s === i.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
      <td>${editInp('nursery', i.id, 'todo', i.todo || '', 'text', 'e.g. Assemble by week 34')}</td><td>${editInp('nursery', i.id, 'est', i.est ?? null, 'num')}</td>
      <td>${editInp('nursery', i.id, 'link', i.link || '', 'text', 'https://')}${linkOut(i.link)}</td><td><button class="icon-btn" data-a="del" data-list="nursery" data-id="${i.id}" aria-label="Delete">🗑</button></td></tr>`).join('')}</tbody></table></div>
    <form class="addrow" data-a="nursery-add"><div class="field grow2"><label>Add an item</label><input class="inp" id="nu-text" required></div>
      <div class="field"><label>Cost (R)</label><input class="inp" id="nu-est" type="number" min="0"></div><button class="btn" type="submit">Add</button></form></div>`;
}

function vision(): string {
  const c = ctx()!, cards = items<VisionCard>(c.id, 'vision').sort((a, b) => b.at - a.at);
  return `<form class="panel" data-a="vision-add"><div class="eyebrow">Add to the board</div>
    <div class="addrow"><div class="field grow2"><label>Image link</label><input class="inp" id="vb-url" placeholder="https://…"></div>
      <div class="field"><label>or upload</label><input class="inp" id="vb-file" type="file" accept="image/*"></div></div>
    <div class="field"><label>Notes / ideas</label><textarea class="inp" id="vb-notes" rows="2" placeholder="Colours, vibe, where to buy…"></textarea></div>
    <button class="btn primary" type="submit">Add to board</button></form>
    <div class="masonry">${cards.map(v => `<div class="panel card-v">${imgTag({ url: v.image, fileId: v.fileId, cls: 'vimg' })}
      <textarea class="inp" rows="2" data-a="edit" data-list="vision" data-id="${v.id}" data-f="notes" data-t="text" placeholder="Notes…" aria-label="notes">${esc(v.notes || '')}</textarea>
      <div class="swatches">${SWATCHES.map(([n, hex]) => `<button class="sw ${v.swatches?.[hex] ? 'on' : ''}" style="background:${hex}" title="${n}" data-a="vision-swatch" data-id="${v.id}" data-hex="${hex}" aria-pressed="${!!v.swatches?.[hex]}" aria-label="${n}"></button>`).join('')}
        <button class="icon-btn" data-a="del" data-list="vision" data-id="${v.id}" aria-label="Delete card">🗑</button></div>
      ${Object.entries(v.swatches || {}).some(([, on]) => on) ? `<div class="strip">${Object.entries(v.swatches!).filter(([, on]) => on).map(([h]) => `<i style="background:${h}"></i>`).join('')}</div>` : ''}</div>`).join('')}</div>
    ${cards.length ? '' : '<div class="panel muted">Your board is empty — paste an image link or upload a photo, add notes, and tag colour swatches.</div>'}`;
}
