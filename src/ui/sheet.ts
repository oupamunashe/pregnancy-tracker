/* Bottom sheets, toasts and tiny DOM helpers. */
export const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement | null;
export const $$ = (s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as HTMLElement[];
export const val = (root: ParentNode, sel: string) => ((root.querySelector(sel) as HTMLInputElement | null)?.value || '').trim();

interface SheetOpts { title: string; body: string; foot?: string; onMount?: (el: HTMLElement) => void }
let current: (SheetOpts & { refresh?: () => string }) | null = null;

export function openSheet(o: SheetOpts) {
  closeSheet();
  const host = $('#sheets'); if (!host) return;
  current = o;
  host.innerHTML = `<div class="scrim" data-a="closesheet"></div><section class="sheet" role="dialog" aria-modal="true" aria-label="${o.title}">
    <header><h2>${o.title}</h2><button class="btn ghost sm" data-a="closesheet" aria-label="Close">✕</button></header>
    <div class="sheet-body">${o.body}</div>${o.foot ? `<footer>${o.foot}</footer>` : ''}</section>`;
  o.onMount?.($('.sheet')!);
}
export function closeSheet() { const host = $('#sheets'); if (host) host.innerHTML = ''; current = null; }
export const sheetOpen = () => !!current;

let toastTimer: any;
export function toast(msg: string, cls = '') {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.className = 'show ' + cls;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t!.className = ''; }, 3200);
}
