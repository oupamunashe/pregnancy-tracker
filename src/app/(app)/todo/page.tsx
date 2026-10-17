"use client";

import { useMemo, useState } from "react";
import { CategoryChip, StatusChip, UrgencyChip } from "@/components/badges";
import { Button, Card, Chip, DeleteButton, Empty, Field, Input, NumberInput, Select } from "@/components/ui";
import { useActive } from "@/hooks";
import { formatLong, taskStatus, trimesterOf } from "@/lib/engine/gestation";
import { CATEGORIES, URGENCIES, type Task } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";

const ORDINAL = ["", "First", "Second", "Third"];

export default function TodoPage() {
  const { data, ga, dateOfWeek } = useActive();
  const { add, update, remove } = useStore.getState();
  const [f, setF] = useState({ q: "", tri: "", cat: "", status: "" });
  const [nt, setNt] = useState<{ title: string; week: number | null; category: Task["category"]; urgency: Task["urgency"] }>({ title: "", week: 12, category: "Prenatal", urgency: "Medium" });

  const groups = useMemo(() => {
    const q = f.q.toLowerCase();
    const byTri = new Map<number, Map<number, Task[]>>();
    data.tasks
      .filter((t) => (!q || t.title.toLowerCase().includes(q)) && (!f.tri || trimesterOf(t.week) === +f.tri) && (!f.cat || t.category === f.cat) && (!f.status || taskStatus(t, ga.weeks) === f.status))
      .forEach((t) => {
        const tri = trimesterOf(t.week);
        if (!byTri.has(tri)) byTri.set(tri, new Map());
        const weeks = byTri.get(tri)!;
        weeks.set(t.week, [...(weeks.get(t.week) ?? []), t]);
      });
    return [...byTri.entries()].sort(([a], [b]) => a - b).map(([tri, weeks]) => ({ tri, weeks: [...weeks.entries()].sort(([a], [b]) => a - b) }));
  }, [data.tasks, f, ga.weeks]);

  const addTask = () => {
    if (!nt.title.trim()) return;
    add("tasks", { id: uid("t_"), title: nt.title.trim(), week: nt.week ?? 0, category: nt.category, urgency: nt.urgency, done: false, custom: true });
    setNt({ ...nt, title: "" });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Input className="lg:col-span-2" placeholder="Search tasks…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search tasks" />
        <Select value={f.tri} onChange={(e) => setF({ ...f, tri: e.target.value })} aria-label="Trimester"><option value="">All trimesters</option><option value="1">Trimester 1</option><option value="2">Trimester 2</option><option value="3">Trimester 3</option></Select>
        <Select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })} aria-label="Category"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
        <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Status"><option value="">All statuses</option><option>Overdue</option><option>This week</option><option>Upcoming</option><option>Done</option></Select>
      </Card>

      <Card className="p-4 grid sm:grid-cols-6 gap-3 items-end">
        <Field label="New task" className="sm:col-span-2"><Input value={nt.title} onChange={(e) => setNt({ ...nt, title: e.target.value })} placeholder="Task title" onKeyDown={(e) => e.key === "Enter" && addTask()} /></Field>
        <Field label="Week"><NumberInput min={0} max={42} value={nt.week} onChange={(v) => setNt({ ...nt, week: v })} /></Field>
        <Field label="Category"><Select value={nt.category} onChange={(e) => setNt({ ...nt, category: e.target.value as Task["category"] })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Urgency"><Select value={nt.urgency} onChange={(e) => setNt({ ...nt, urgency: e.target.value as Task["urgency"] })}>{URGENCIES.map((u) => <option key={u}>{u}</option>)}</Select></Field>
        <Button onClick={addTask}>Add</Button>
      </Card>

      {groups.map((g) => (
        <section key={g.tri} className="space-y-3">
          <h2 className="text-lg font-bold text-rose-700 pt-2">{ORDINAL[g.tri]} trimester</h2>
          {g.weeks.map(([week, items]) => (
            <Card key={week} className="overflow-hidden">
              <div className="px-4 py-2 bg-rose-100 flex justify-between text-sm">
                <b>Week {week}</b>
                <span className="text-gray-600">{formatLong(dateOfWeek(week))}{week === ga.weeks && <Chip tone="primary" className="ml-2">Now</Chip>}</span>
              </div>
              <ul className="divide-y divide-rose-100">
                {items.map((t) => (
                  <li key={t.id} className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
                    <input type="checkbox" checked={t.done} onChange={(e) => update("tasks", t.id, { done: e.target.checked })} aria-label={`Done: ${t.title}`} />
                    <span className={`flex-1 min-w-[10rem] text-sm ${t.done ? "line-through text-gray-400" : ""}`}>{t.title}</span>
                    <CategoryChip value={t.category} /><UrgencyChip value={t.urgency} /><StatusChip value={taskStatus(t, ga.weeks)} />
                    {t.custom && <DeleteButton onClick={() => remove("tasks", t.id)} />}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </section>
      ))}
      {!groups.length && <Empty>No tasks match these filters.</Empty>}
    </div>
  );
}
