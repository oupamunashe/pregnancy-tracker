export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const pad2 = (n: number) => String(n).padStart(2, '0');
/** 65 → "1:05", 3725 → "1:02:05" */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return (h ? h + ':' + pad2(m) : String(m)) + ':' + pad2(s % 60);
}
export const hhmm = (ms: number) => { const d = new Date(ms); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
export const plural = (n: number, w: string) => n + ' ' + w + (n === 1 ? '' : 's');
