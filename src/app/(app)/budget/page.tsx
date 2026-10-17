"use client";

import { useState } from "react";
import { Button, Card, DeleteButton, Field, Input, NumberInput, Select } from "@/components/ui";
import { useActive } from "@/hooks";
import { BUDGET_STATUSES, type BudgetItem } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { isHttpUrl, money, uid } from "@/lib/utils";

export default function BudgetPage() {
  const { data } = useActive();
  const { add, update, remove } = useStore.getState();
  const [nb, setNb] = useState<{ category: string; item: string; estimated: number | null; status: BudgetItem["status"]; link: string }>({ category: "", item: "", estimated: 0, status: "Planned", link: "" });

  const sum = (items: BudgetItem[], k: "estimated" | "actual") => items.reduce((s, b) => s + (b[k] ?? 0), 0);
  const est = sum(data.budget, "estimated");
  const act = sum(data.budget, "actual");
  const variance = act - sum(data.budget.filter((b) => b.actual !== null), "estimated");   // only items already purchased
  const categories = [...new Set(data.budget.map((b) => b.category))];

  const addItem = () => {
    if (!nb.item.trim()) return;
    add("budget", { id: uid("b_"), category: nb.category.trim() || "General", item: nb.item.trim(), estimated: nb.estimated ?? 0, actual: null, status: nb.status, link: nb.link });
    setNb({ ...nb, item: "", estimated: 0, link: "" });
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5"><div className="th">Estimated</div><div className="text-2xl font-bold mt-1">{money(est)}</div></Card>
        <Card className="p-5"><div className="th">Actual</div><div className="text-2xl font-bold mt-1">{money(act)}</div></Card>
        <Card className="p-5"><div className="th">Variance (actual − est., purchased items)</div>
          <div className={`text-2xl font-bold mt-1 ${variance > 0 ? "text-brass-700" : "text-sage-600"}`}>{variance > 0 ? "+" : ""}{money(variance)}</div></Card>
      </div>

      <Card className="p-4 grid sm:grid-cols-7 gap-3 items-end">
        <Field label="Category"><Input list="budget-cats" value={nb.category} onChange={(e) => setNb({ ...nb, category: e.target.value })} placeholder="Category" />
          <datalist id="budget-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
        <Field label="Item" className="sm:col-span-2"><Input value={nb.item} onChange={(e) => setNb({ ...nb, item: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addItem()} /></Field>
        <Field label="Estimated"><NumberInput min={0} value={nb.estimated} onChange={(v) => setNb({ ...nb, estimated: v })} /></Field>
        <Field label="Status"><Select value={nb.status} onChange={(e) => setNb({ ...nb, status: e.target.value as BudgetItem["status"] })}>{BUDGET_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Link"><Input value={nb.link} onChange={(e) => setNb({ ...nb, link: e.target.value })} placeholder="https://" /></Field>
        <Button onClick={addItem}>Add</Button>
      </Card>

      {categories.map((cat) => {
        const items = data.budget.filter((b) => b.category === cat);
        return (
          <Card key={cat} className="overflow-hidden">
            <div className="px-4 py-2 bg-rose-100 flex justify-between text-sm"><b>{cat}</b><span className="text-gray-600">Est {money(sum(items, "estimated"))} · Actual {money(sum(items, "actual"))}</span></div>
            <div className="scroll-x">
              <table className="w-full text-sm min-w-[640px]"><tbody className="divide-y divide-rose-100">
                {items.map((b) => (
                  <tr key={b.id}>
                    <td className="p-2 w-1/3"><Input value={b.item} onChange={(e) => update("budget", b.id, { item: e.target.value })} /></td>
                    <td className="p-2"><NumberInput min={0} value={b.estimated} onChange={(v) => update("budget", b.id, { estimated: v ?? 0 })} aria-label="Estimated" /></td>
                    <td className="p-2"><NumberInput min={0} value={b.actual} placeholder="Actual" onChange={(v) => update("budget", b.id, { actual: v })} aria-label="Actual" /></td>
                    <td className="p-2"><Select value={b.status} onChange={(e) => update("budget", b.id, { status: e.target.value as BudgetItem["status"] })}>{BUDGET_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></td>
                    <td className="p-2"><Input value={b.link} placeholder="Registry link" onChange={(e) => update("budget", b.id, { link: e.target.value })} />
                      {isHttpUrl(b.link) && <a href={b.link} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-700 font-semibold">open ↗</a>}</td>
                    <td className="p-2"><DeleteButton onClick={() => remove("budget", b.id)} /></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
