"use client";

import { useState } from "react";
import { Button, Card, Chip, DeleteButton, Input, SectionTitle, Textarea } from "@/components/ui";
import { useActive } from "@/hooks";
import { formatLong, postpartumDate } from "@/lib/engine/gestation";
import type { AdviceNote } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";

const SECTIONS: { id: AdviceNote["section"]; label: string; icon: string }[] = [
  { id: "tips", label: "Personal tips", icon: "💬" }, { id: "hospital", label: "Hospital guidance", icon: "🏥" }, { id: "postpartum", label: "Postpartum notes", icon: "🤱" },
];

export default function AdvicePage() {
  const { data, edd } = useActive();
  const { add, update, remove } = useStore.getState();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [step, setStep] = useState<{ title: string; offsetDays: number }>({ title: "", offsetDays: 7 });
  const steps = [...data.postpartum].sort((a, b) => a.offsetDays - b.offsetDays);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {SECTIONS.map((s) => {
          const addNote = () => {
            const text = (drafts[s.id] ?? "").trim();
            if (!text) return;
            add("advice", { id: uid("n_"), section: s.id, text });
            setDrafts({ ...drafts, [s.id]: "" });
          };
          return (
            <Card key={s.id} className="p-5">
              <h2 className="font-bold">{s.icon} {s.label}</h2>
              <ul className="mt-2 divide-y divide-rose-100">
                {data.advice.filter((a) => a.section === s.id).map((a) => (
                  <li key={a.id} className="py-2 flex gap-2">
                    <Textarea rows={2} value={a.text} onChange={(e) => update("advice", a.id, { text: e.target.value })} />
                    <span className="self-start"><DeleteButton onClick={() => remove("advice", a.id)} /></span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 mt-3">
                <Input value={drafts[s.id] ?? ""} placeholder="Add a note…" onChange={(e) => setDrafts({ ...drafts, [s.id]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addNote()} />
                <Button variant="ghost" onClick={addNote}>Add</Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <SectionTitle>🗓 Postpartum schedule <span className="text-xs font-normal text-gray-500">(dated from EDD {formatLong(edd)} — shifts if baby arrives early/late)</span></SectionTitle>
        <ul className="mt-2 divide-y divide-rose-100">
          {steps.map((p) => (
            <li key={p.id} className="py-2 flex items-center gap-3 flex-wrap">
              <input type="checkbox" checked={p.done} onChange={(e) => update("postpartum", p.id, { done: e.target.checked })} aria-label={p.title} />
              <span className={`flex-1 min-w-[10rem] text-sm ${p.done ? "line-through text-gray-400" : ""}`}>{p.title}</span>
              <Chip tone="done">{p.offsetDays === 0 ? "Birth" : `+${p.offsetDays} days`}</Chip>
              <span className="text-sm text-gray-600 w-36 text-right">{formatLong(postpartumDate(edd, p.offsetDays))}</span>
              <DeleteButton onClick={() => remove("postpartum", p.id)} />
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Input className="flex-1 min-w-[10rem]" value={step.title} placeholder="Step title" onChange={(e) => setStep({ ...step, title: e.target.value })} />
          <Input className="!w-28" type="number" value={step.offsetDays} aria-label="Days after EDD" onChange={(e) => setStep({ ...step, offsetDays: Number(e.target.value) })} />
          <Button variant="ghost" onClick={() => { if (step.title.trim()) { add("postpartum", { id: uid("p_"), offsetDays: step.offsetDays || 0, title: step.title.trim(), done: false }); setStep({ ...step, title: "" }); } }}>Add</Button>
        </div>
      </Card>
    </div>
  );
}
