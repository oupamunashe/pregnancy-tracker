/* Contraction timer: one big button; length and gap-since-last-start per contraction; 5-1-1 guidance. */
import { contractionAdvice, contractionRows } from '../../core/calc';
import { ctx } from '../../core/ctx';
import { clock, esc, hhmm } from '../../core/format';
import { pname } from '../../core/state';
import { items } from '../../data/db';
import type { Contraction } from '../../core/types';

export function viewContractions(): string {
  const c = ctx()!;
  const all = items<Contraction>(c.id, 'contractions'), rows = contractionRows(all);
  const live = all.find(x => x.end == null);
  const advice = contractionAdvice(all, Date.now());
  return `<section>
    <h1>Contraction timer</h1>
    <div class="panel center">
      ${live ? `<div class="count" aria-live="off"><span data-since="${live.start}">${clock((Date.now() - live.start) / 1000)}</span></div><p class="muted">Contraction in progress…</p>` : `<div class="count idle">0:00</div><p class="muted">Tap when a contraction starts.</p>`}
      <button class="btn primary kickbtn ${live ? 'stop' : ''}" data-a="ctr-toggle">${live ? '■ Contraction ended' : '▶ Contraction started'}</button>
    </div>
    <div class="panel advice ${advice.level}" role="status"><b>${advice.level === 'go' ? '⚠️ Time to call' : advice.level === 'building' ? 'Building up' : '5-1-1 guide'}</b><p>${esc(advice.text)}</p></div>
    <div class="panel"><div class="row-between"><div class="eyebrow">Recent contractions</div>${rows.length ? '<button class="btn ghost sm" data-a="ctr-clear">Clear all</button>' : ''}</div>
      <div class="scroll-x"><table class="tbl"><thead><tr><th>Started</th><th>Lasted</th><th>Since last start</th><th></th></tr></thead><tbody>
        ${rows.map(r => `<tr><td>${hhmm(r.start)}${r.by ? `<small class="muted"> ${esc(pname(r.by))}</small>` : ''}</td><td>${r.durationSec != null ? clock(r.durationSec) : '…'}</td><td>${r.intervalSec != null ? clock(r.intervalSec) : '–'}</td>
        <td><button class="icon-btn" data-a="del-ctr" data-id="${r.id}" aria-label="Delete">🗑</button></td></tr>`).join('') || '<tr><td colspan="4" class="muted">None yet.</td></tr>'}
      </tbody></table></div></div>
    <p class="small muted">The 5-1-1 rule: contractions about 5 minutes apart, lasting about 1 minute, for at least 1 hour. Always follow your own provider’s advice, and call them or go in sooner if your waters break, you bleed, baby moves less, or anything worries you. This tool is not medical advice.</p>
  </section>`;
}
