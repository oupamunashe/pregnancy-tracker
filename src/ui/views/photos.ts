/* Photo milestones: weekly bump photos and scan snapshots (private bucket upload, or a pasted link). */
import { WEEK_TASKS } from '../../core/content';
import { ctx } from '../../core/ctx';
import { esc } from '../../core/format';
import { longDate, parseDate, toISO } from '../../core/gestation';
import { S, pname } from '../../core/state';
import { items } from '../../data/db';
import type { Photo } from '../../core/types';
import { imgTag } from '../parts';
void WEEK_TASKS;

export function viewPhotos(): string {
  const c = ctx()!, kind = S.ui.photoKind, all = items<Photo>(c.id, 'photos');
  const shown = all.filter(p => kind === 'all' || p.kind === kind).sort((a, b) => a.week - b.week || a.d.localeCompare(b.d));
  const wk = Math.max(0, Math.min(42, c.ga.weeks));
  const missing = !all.some(p => p.kind === 'bump' && p.week === wk);
  return `<section><h1>Photo milestones</h1>
    ${missing && c.ga.totalDays >= 0 ? `<div class="panel advice building">📸 No bump photo yet for week ${wk} — add one below.</div>` : ''}
    <form class="panel" data-a="photo-add">
      <div class="field"><label>Type</label><div class="chips"><button type="button" class="chip-btn on" data-a="photo-kind-pick" data-k="bump">🤰 Bump</button><button type="button" class="chip-btn" data-a="photo-kind-pick" data-k="scan">🩻 Scan</button></div></div>
      <div class="addrow"><div class="field"><label for="ph-week">Week</label><input class="inp" id="ph-week" type="number" min="0" max="42" value="${wk}"></div>
        <div class="field"><label for="ph-date">Date</label><input class="inp" id="ph-date" type="date" value="${toISO(c.today)}"></div>
        <div class="field grow2"><label for="ph-cap">Caption</label><input class="inp" id="ph-cap" placeholder="e.g. Anatomy scan — profile"></div></div>
      <div class="addrow"><div class="field"><label for="ph-file">Photo</label><input class="inp" id="ph-file" type="file" accept="image/*"></div>
        <div class="field grow2"><label for="ph-url">…or paste an image link</label><input class="inp" id="ph-url" placeholder="https://…"></div></div>
      <button class="btn primary" type="submit">Add photo</button><p class="small muted">Photos upload to your private storage (members only). Uploads need a connection.</p></form>
    <div class="chips tabs">${[['all', 'All'], ['bump', '🤰 Bump'], ['scan', '🩻 Scans']].map(([k, l]) => `<button class="chip-btn ${kind === k ? 'on' : ''}" data-a="photo-filter" data-k="${k}">${l} <small>${k === 'all' ? all.length : all.filter(p => p.kind === k).length}</small></button>`).join('')}</div>
    <div class="photogrid">${shown.map(p => `<figure class="ph">${imgTag({ url: p.url, fileId: p.fileId, alt: p.caption || `Week ${p.week}`, cls: 'phimg' })}
      <figcaption><b>Week ${p.week}</b> · ${p.kind === 'scan' ? 'Scan' : 'Bump'}<div class="small muted">${esc(longDate(parseDate(p.d)))}${p.by ? ' · ' + esc(pname(p.by)) : ''}</div>${p.caption ? `<div>${esc(p.caption)}</div>` : ''}
      <button class="icon-btn" data-a="del" data-list="photos" data-id="${p.id}" aria-label="Delete photo">🗑</button></figcaption></figure>`).join('')}</div>
    ${shown.length ? '' : '<div class="panel muted">No photos yet.</div>'}
  </section>`;
}
