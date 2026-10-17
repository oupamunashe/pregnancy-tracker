/* Small shared renderers for the planner views. */
import { esc } from '../core/format';

export const isUrlIcon = (v: unknown): v is string => typeof v === 'string' && /^(https?:\/\/|data:image\/)/i.test(v.trim());
export const isHttp = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//i.test(v.trim());
export const ProgressBar = (v: number) => `<div class="bar" role="progressbar" aria-valuenow="${Math.round(Math.min(1, Math.max(0, v)) * 100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(1, Math.max(0, v)) * 100}%"></span></div>`;
export const linkOut = (v?: string) => (isHttp(v) ? `<a class="small" href="${esc(v)}" target="_blank" rel="noopener noreferrer">open ↗</a>` : '');

/** Inline-editable cells: a `change` event writes just that field with doc_merge (data-a="edit"). */
export const editInp = (list: string, id: string, f: string, v: unknown, t: 'text' | 'num' = 'text', ph = '') =>
  `<input class="inp" data-a="edit" data-list="${list}" data-id="${id}" data-f="${f}" data-t="${t}" ${t === 'num' ? 'type="number" min="0" inputmode="decimal"' : ''} value="${v == null ? '' : esc(v)}" placeholder="${esc(ph)}" aria-label="${esc(f)}">`;
export const editSel = (list: string, id: string, f: string, v: string, opts: readonly string[]) =>
  `<select class="inp" data-a="edit" data-list="${list}" data-id="${id}" data-f="${f}" aria-label="${esc(f)}">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
/** An image that is either a pasted URL or a private-bucket file resolved after render (see hydrateFiles). */
export const imgTag = (o: { url?: string; fileId?: string; alt?: string; cls?: string }) =>
  o.fileId ? `<img class="${o.cls || ''}" data-file="${esc(o.fileId)}" alt="${esc(o.alt || '')}" loading="lazy">` : isHttp(o.url) || isUrlIcon(o.url) ? `<img class="${o.cls || ''}" src="${esc(o.url)}" alt="${esc(o.alt || '')}" loading="lazy" referrerpolicy="no-referrer">` : '';
