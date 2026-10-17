"use client";

import { useState } from "react";
import { Button, Card, DeleteButton, Empty, Field, Input, NumberInput, Select, Textarea } from "@/components/ui";
import { useActive } from "@/hooks";
import { PHOTO_KINDS, type Photographer } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { PHOTO_QUESTIONS } from "@/lib/templates";
import { isHttpUrl, uid } from "@/lib/utils";

const KINDS: { id: Photographer["kind"]; label: string; icon: string }[] = [
  { id: "maternity", label: "Maternity only", icon: "🤰" }, { id: "newborn", label: "Newborn only", icon: "👶" }, { id: "combined", label: "Maternity + Newborn", icon: "📸" },
];
void PHOTO_KINDS;

export default function PhotographyPage() {
  const { data } = useActive();
  const { add, update, remove, patchData } = useStore.getState();
  const [kind, setKind] = useState<Photographer["kind"]>("maternity");
  const [name, setName] = useState("");
  const list = data.photographers.filter((p) => p.kind === kind);

  const addPhotographer = () => {
    if (!name.trim()) return;
    add("photographers", { id: uid("g_"), kind, name: name.trim(), portfolio: "", contact: "", price: null, length: "", images: "", notes: "" });
    setName("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {KINDS.map((k) => (
          <button key={k.id} type="button" className={`tab ${kind === k.id ? "on" : ""}`} onClick={() => setKind(k.id)}>
            {k.icon} {k.label} <span className="opacity-70">({data.photographers.filter((p) => p.kind === k.id).length})</span>
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 grid sm:grid-cols-4 gap-2 items-end">
            <Field label={`Add photographer — ${KINDS.find((k) => k.id === kind)!.label}`} className="sm:col-span-3">
              <Input value={name} placeholder="Photographer / studio name" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPhotographer()} />
            </Field>
            <Button onClick={addPhotographer}>Add</Button>
          </Card>
          {list.map((x) => (
            <Card key={x.id} className="p-4 space-y-2">
              <div className="flex gap-2"><Input className="font-bold" value={x.name} placeholder="Photographer" onChange={(e) => update("photographers", x.id, { name: e.target.value })} /><DeleteButton onClick={() => remove("photographers", x.id)} /></div>
              <div className="grid sm:grid-cols-2 gap-2">
                <Field label="Portfolio link"><Input value={x.portfolio} placeholder="https://" onChange={(e) => update("photographers", x.id, { portfolio: e.target.value })} />
                  {isHttpUrl(x.portfolio) && <a href={x.portfolio} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-700 font-semibold">open ↗</a>}</Field>
                <Field label="Contact details"><Input value={x.contact} placeholder="Phone / email / Instagram" onChange={(e) => update("photographers", x.id, { contact: e.target.value })} /></Field>
                <Field label="Pricing (R)"><NumberInput min={0} value={x.price} onChange={(v) => update("photographers", x.id, { price: v })} /></Field>
                <Field label="Session length"><Input value={x.length} placeholder="e.g. 90 minutes" onChange={(e) => update("photographers", x.id, { length: e.target.value })} /></Field>
                <Field label="Included images"><Input value={x.images} placeholder="e.g. 25 edited" onChange={(e) => update("photographers", x.id, { images: e.target.value })} /></Field>
                <Field label="Kind"><Select value={x.kind} onChange={(e) => update("photographers", x.id, { kind: e.target.value as Photographer["kind"] })}>{KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</Select></Field>
              </div>
              <Field label="Notes"><Textarea rows={2} value={x.notes} onChange={(e) => update("photographers", x.id, { notes: e.target.value })} /></Field>
            </Card>
          ))}
          {!list.length && <Empty>No photographers in this section yet.</Empty>}
        </div>
        <Card className="p-5 self-start">
          <h2 className="font-bold">Questions to ask photographers</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {PHOTO_QUESTIONS.map((q, i) => (
              <li key={i} className="flex gap-2">
                <input type="checkbox" checked={!!data.photoAsked[i]} aria-label={q} onChange={(e) => patchData({ photoAsked: { ...data.photoAsked, [i]: e.target.checked } })} />
                <span className={data.photoAsked[i] ? "line-through text-gray-400" : ""}>{q}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
