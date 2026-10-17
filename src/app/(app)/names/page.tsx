"use client";

import { useState } from "react";
import { Button, Card, DeleteButton, Field, Input } from "@/components/ui";
import { useActive } from "@/hooks";
import type { BabyName } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";

const average = (n: BabyName) => {
  const r = n.ratings.filter((x): x is number => !!x);
  return r.length ? r.reduce((a, b) => a + b, 0) / r.length : 0;
};

export default function NamesPage() {
  const { profile, data } = useActive();
  const { add, update, remove, updateProfile, patchData } = useStore.getState();
  const [nn, setNn] = useState({ name: "", meaning: "", origin: "" });
  const [rule, setRule] = useState("");
  const ranked = [...data.names].sort((a, b) => average(b) - average(a));

  const rate = (n: BabyName, i: 0 | 1, v: string) => {
    const x = v === "" ? null : Math.max(1, Math.min(10, Math.round(+v)));
    update("names", n.id, { ratings: i === 0 ? [x, n.ratings[1]] : [n.ratings[0], x] });
  };
  const removeRule = (id: string) => {
    remove("nameRules", id);
    patchData({ names: useStore.getState().data[profile.id].names.map((n) => { const { [id]: _drop, ...checks } = n.checks; void _drop; return { ...n, checks }; }) });
  };
  const addName = () => {
    if (!nn.name.trim()) return;
    add("names", { id: uid("m_"), name: nn.name.trim(), meaning: nn.meaning, origin: nn.origin, checks: {}, ratings: [null, null], notes: "" });
    setNn({ name: "", meaning: "", origin: "" });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 grid sm:grid-cols-5 gap-3 items-end">
        <Field label="Name"><Input value={nn.name} onChange={(e) => setNn({ ...nn, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addName()} /></Field>
        <Field label="Meaning" className="sm:col-span-2"><Input value={nn.meaning} onChange={(e) => setNn({ ...nn, meaning: e.target.value })} /></Field>
        <Field label="Origin"><Input value={nn.origin} onChange={(e) => setNn({ ...nn, origin: e.target.value })} /></Field>
        <Button onClick={addName}>Add name</Button>
      </Card>

      <Card className="p-4 flex gap-2 items-end flex-wrap">
        <Field label="Add a custom rule check" className="flex-1 min-w-[12rem]"><Input value={rule} placeholder="e.g. Works in both languages" onChange={(e) => setRule(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && rule.trim()) { add("nameRules", { id: uid("r_"), label: rule.trim() }); setRule(""); } }} /></Field>
        <Button variant="ghost" onClick={() => { if (rule.trim()) { add("nameRules", { id: uid("r_"), label: rule.trim() }); setRule(""); } }}>Add rule</Button>
        <Field label="Rater 1"><Input value={profile.parentLabels[0]} onChange={(e) => updateProfile(profile.id, { parentLabels: [e.target.value, profile.parentLabels[1]] })} /></Field>
        <Field label="Rater 2"><Input value={profile.parentLabels[1]} onChange={(e) => updateProfile(profile.id, { parentLabels: [profile.parentLabels[0], e.target.value] })} /></Field>
      </Card>

      <Card className="scroll-x">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left bg-rose-100">
              <th className="th p-3">Name</th><th className="th">Meaning</th><th className="th">Origin</th>
              {data.nameRules.map((r) => (
                <th key={r.id} className="th text-center">{r.label} <button type="button" className="text-gray-400 hover:text-rose-700" onClick={() => removeRule(r.id)} aria-label={`Remove rule ${r.label}`}>×</button></th>
              ))}
              <th className="th">{profile.parentLabels[0]} (1–10)</th><th className="th">{profile.parentLabels[1]} (1–10)</th><th className="th">Avg</th><th />
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-100">
            {ranked.map((n) => {
              const avg = average(n);
              return (
                <tr key={n.id}>
                  <td className="p-2"><Input className="font-semibold" value={n.name} onChange={(e) => update("names", n.id, { name: e.target.value })} /></td>
                  <td className="p-2"><Input value={n.meaning} onChange={(e) => update("names", n.id, { meaning: e.target.value })} /></td>
                  <td className="p-2"><Input value={n.origin} onChange={(e) => update("names", n.id, { origin: e.target.value })} /></td>
                  {data.nameRules.map((r) => (
                    <td key={r.id} className="p-2 text-center"><input type="checkbox" checked={!!n.checks[r.id]} aria-label={r.label} onChange={(e) => update("names", n.id, { checks: { ...n.checks, [r.id]: e.target.checked } })} /></td>
                  ))}
                  {[0, 1].map((i) => (
                    <td key={i} className="p-2"><Input className="!w-16" type="number" min={1} max={10} value={n.ratings[i] ?? ""} onChange={(e) => rate(n, i as 0 | 1, e.target.value)} /></td>
                  ))}
                  <td className="p-2 font-bold whitespace-nowrap">{avg ? <><span className="text-brass-400 text-lg" aria-hidden>★</span> {avg.toFixed(1)}</> : "—"}</td>
                  <td className="p-2"><DeleteButton onClick={() => remove("names", n.id)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-gray-500">Sorted by average rating, highest first.</p>
    </div>
  );
}
