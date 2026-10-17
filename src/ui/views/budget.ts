/* Budget & expenses: estimated vs actual per item, grouped by category (medical, nursery, gear, newborn…). */
import { BUDGET_CATS } from '../../core/content';
import { budgetTotals, groupBy, money } from '../../core/calc';
import { ctx } from '../../core/ctx';
import { esc } from '../../core/format';
import { items } from '../../data/db';
import type { BudgetItem } from '../../core/types';
import { ProgressBar, editInp, editSel, linkOut } from '../parts';

const STATUSES = ['Planned', 'In Registry', 'Obtained'];

export function viewBudget(): string {
  const c = ctx()!, list = items<BudgetItem>(c.id, 'budget'), t = budgetTotals(list);
  const cats = [...new Set([...BUDGET_CATS, ...list.map(b => b.category)])];
  const groups = groupBy([...list].sort((a, b) => a.category.localeCompare(b.category) || a.item.localeCompare(b.item)), b => b.category);
  return `<section>
    <div class="row-between"><h1>Budget</h1>${list.length ? '' : '<button class="btn" data-a="seed" data-what="budget">Load starter budget</button>'}</div>
    <div class="stats"><div class="panel stat"><span>Estimated</span><b>${money(t.est)}</b></div><div class="panel stat"><span>Spent</span><b>${money(t.actual)}</b></div>
      <div class="panel stat"><span>Over / under (bought items)</span><b class="${t.variance > 0 ? 'neg' : 'good'}">${t.variance > 0 ? '+' : ''}${money(t.variance)}</b></div></div>
    ${ProgressBar(t.est ? t.actual / t.est : 0)}
    <form class="panel addrow" data-a="budget-add">
      <div class="field"><label>Category</label><input class="inp" id="bd-cat" list="bd-cats" placeholder="Nursery" required><datalist id="bd-cats">${cats.map(x => `<option value="${esc(x)}">`).join('')}</datalist></div>
      <div class="field grow2"><label>Item</label><input class="inp" id="bd-item" required></div>
      <div class="field"><label>Estimate (R)</label><input class="inp" id="bd-est" type="number" min="0" inputmode="decimal" value="0"></div>
      <button class="btn primary" type="submit">Add</button></form>
    ${groups.map(([cat, rows]) => `<div class="panel"><div class="row-between"><h2>${esc(cat)}</h2><span class="muted small">Est ${money(rows.reduce((s, r) => s + (r.est || 0), 0))} · Spent ${money(rows.reduce((s, r) => s + (r.actual ?? 0), 0))}</span></div>
      <div class="scroll-x"><table class="tbl edit"><thead><tr><th>Item</th><th>Estimate</th><th>Actual</th><th>Status</th><th>Link</th><th></th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${editInp('budget', r.id, 'item', r.item)}</td><td>${editInp('budget', r.id, 'est', r.est, 'num')}</td><td>${editInp('budget', r.id, 'actual', r.actual, 'num', 'Actual')}</td>
        <td>${editSel('budget', r.id, 'status', r.status, STATUSES)}</td><td>${editInp('budget', r.id, 'link', r.link || '', 'text', 'https://')}${linkOut(r.link)}</td>
        <td><button class="icon-btn" data-a="del" data-list="budget" data-id="${r.id}" aria-label="Delete">🗑</button></td></tr>`).join('')}</tbody></table></div></div>`).join('') || '<div class="panel muted">No budget lines yet.</div>'}
  </section>`;
}
