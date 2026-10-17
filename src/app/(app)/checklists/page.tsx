"use client";

import { useState } from "react";
import { Button, Card, DeleteButton, Input, ProgressBar } from "@/components/ui";
import { useActive } from "@/hooks";
import { formatLong } from "@/lib/engine/gestation";
import { BAG_LISTS } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";

const LISTS: Record<(typeof BAG_LISTS)[number], { label: string; icon: string }> = {
  "bag-parent": { label: "Hospital bag — Pregnant parent", icon: "🤰" },
  "bag-partner": { label: "Hospital bag — Partner", icon: "🧑" },
  "bag-baby": { label: "Hospital bag — Baby", icon: "🍼" },
};

export default function ChecklistsPage() {
  const { data, dateOfWeek } = useActive();
  const { add, update, remove } = useStore.getState();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {BAG_LISTS.map((id) => {
        const items = data.checklists.filter((c) => c.list === id);
        const done = items.filter((i) => i.done).length;
        const addItem = () => {
          const text = (drafts[id] ?? "").trim();
          if (!text) return;
          add("checklists", { id: uid("c_"), list: id, text, done: false });
          setDrafts({ ...drafts, [id]: "" });
        };
        return (
          <Card key={id} className="p-5">
            <div className="flex justify-between items-baseline"><h2 className="font-bold">{LISTS[id].icon} {LISTS[id].label}</h2><span className="text-xs text-gray-500">{done} / {items.length}</span></div>
            <ProgressBar value={items.length ? done / items.length : 0} className="!h-1.5 my-2" />
            <div className="th mb-1">Pack by week 34 ({formatLong(dateOfWeek(34))})</div>
            <ul className="divide-y divide-rose-100">
              {items.map((i) => (
                <li key={i.id} className="py-1.5 flex items-center gap-3">
                  <input type="checkbox" checked={i.done} onChange={(e) => update("checklists", i.id, { done: e.target.checked })} aria-label={i.text} />
                  <span className={`flex-1 text-sm ${i.done ? "line-through text-gray-400" : ""}`}>{i.text}</span>
                  <DeleteButton onClick={() => remove("checklists", i.id)} />
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-3">
              <Input value={drafts[id] ?? ""} placeholder="Add item…" onChange={(e) => setDrafts({ ...drafts, [id]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addItem()} />
              <Button variant="ghost" onClick={addItem}>Add</Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
