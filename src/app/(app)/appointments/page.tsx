"use client";

import { useState } from "react";
import { Button, Card, Chip, DeleteButton, Field, Input, NumberInput, Select, SectionTitle, Textarea } from "@/components/ui";
import { useActive } from "@/hooks";
import { parseDate, toISO } from "@/lib/engine/gestation";
import { PROVIDER_ROLES, type Appointment } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { isHttpUrl, uid } from "@/lib/utils";

export default function AppointmentsPage() {
  const { data, dateOfWeek } = useActive();
  const { add, update, remove } = useStore.getState();
  const [na, setNa] = useState<{ title: string; week: number | null; providerId: string; isScan: boolean }>({ title: "", week: 12, providerId: "", isScan: false });
  const [np, setNp] = useState({ name: "", role: "OB/GYN" as (typeof PROVIDER_ROLES)[number], phone: "", email: "" });

  const dateOf = (a: Appointment) => (a.dateOverride ? parseDate(a.dateOverride) : dateOfWeek(a.week));
  const sorted = [...data.appointments].sort((a, b) => +dateOf(a) - +dateOf(b));
  const providerOptions = data.providers.map((p) => <option key={p.id} value={p.id}>{p.name || p.role}</option>);

  const addAppt = () => {
    if (!na.title.trim()) return;
    add("appointments", { id: uid("a_"), title: na.title.trim(), week: na.week ?? 0, dateOverride: "", providerId: na.providerId, isScan: na.isScan, done: false, notes: "", fileLink: "" });
    setNa({ ...na, title: "", isScan: false });
  };
  const addProvider = () => {
    if (!np.name.trim()) return;
    add("providers", { id: uid("v_"), name: np.name.trim(), role: np.role, phone: np.phone, email: np.email, address: "" });
    setNp({ ...np, name: "", phone: "", email: "" });
  };
  const removeProvider = (id: string) => {
    data.appointments.filter((a) => a.providerId === id).forEach((a) => update("appointments", a.id, { providerId: "" }));
    remove("providers", id);
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionTitle>Appointment log</SectionTitle>
        <div className="grid sm:grid-cols-6 gap-3 items-end my-4">
          <Field label="Title" className="sm:col-span-2"><Input value={na.title} onChange={(e) => setNa({ ...na, title: e.target.value })} placeholder="e.g. Growth scan" onKeyDown={(e) => e.key === "Enter" && addAppt()} /></Field>
          <Field label="Week"><NumberInput min={0} max={42} value={na.week} onChange={(v) => setNa({ ...na, week: v })} /></Field>
          <Field label="Provider"><Select value={na.providerId} onChange={(e) => setNa({ ...na, providerId: e.target.value })}><option value="">—</option>{providerOptions}</Select></Field>
          <label className="flex items-center gap-2 text-sm pb-2"><input type="checkbox" checked={na.isScan} onChange={(e) => setNa({ ...na, isScan: e.target.checked })} /> Scan</label>
          <Button onClick={addAppt}>Add</Button>
        </div>
        <div className="scroll-x">
          <table className="w-full text-sm min-w-[780px]">
            <thead><tr className="text-left"><th className="w-8" /><th className="th">Appointment</th><th className="th">Date</th><th className="th">Provider</th><th className="th">Notes</th><th className="th">File / photo link</th><th /></tr></thead>
            <tbody className="divide-y divide-rose-100">
              {sorted.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="py-2"><input type="checkbox" checked={a.done} onChange={(e) => update("appointments", a.id, { done: e.target.checked })} aria-label="Attended" /></td>
                  <td className="py-2 pr-2"><Input value={a.title} onChange={(e) => update("appointments", a.id, { title: e.target.value })} />
                    <div className="mt-1">{a.isScan && <Chip tone="sky">Scan milestone</Chip>} <span className="text-xs text-gray-500">Week {a.week}</span></div></td>
                  <td className="py-2 pr-2">
                    <Input type="date" value={a.dateOverride || toISO(dateOfWeek(a.week))}
                      onChange={(e) => update("appointments", a.id, { dateOverride: e.target.value === toISO(dateOfWeek(a.week)) ? "" : e.target.value })} />
                    {a.dateOverride && <button type="button" className="text-xs text-rose-700 mt-1" onClick={() => update("appointments", a.id, { dateOverride: "" })}>reset to auto</button>}
                  </td>
                  <td className="py-2 pr-2"><Select value={a.providerId} onChange={(e) => update("appointments", a.id, { providerId: e.target.value })}><option value="">—</option>{providerOptions}</Select></td>
                  <td className="py-2 pr-2"><Textarea rows={2} value={a.notes} onChange={(e) => update("appointments", a.id, { notes: e.target.value })} placeholder="Notes…" /></td>
                  <td className="py-2 pr-2"><Input value={a.fileLink} onChange={(e) => update("appointments", a.id, { fileLink: e.target.value })} placeholder="https://… or filename" />
                    {isHttpUrl(a.fileLink) && <a href={a.fileLink} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-700 font-semibold">open ↗</a>}</td>
                  <td className="py-2"><DeleteButton onClick={() => remove("appointments", a.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Care providers</SectionTitle>
        <div className="grid sm:grid-cols-6 gap-3 items-end my-4">
          <Field label="Name" className="sm:col-span-2"><Input value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} placeholder="Dr. / Hospital name" /></Field>
          <Field label="Role"><Select value={np.role} onChange={(e) => setNp({ ...np, role: e.target.value as typeof np.role })}>{PROVIDER_ROLES.map((r) => <option key={r}>{r}</option>)}</Select></Field>
          <Field label="Phone"><Input value={np.phone} onChange={(e) => setNp({ ...np, phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={np.email} onChange={(e) => setNp({ ...np, email: e.target.value })} /></Field>
          <Button onClick={addProvider}>Add</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {data.providers.map((p) => (
            <div key={p.id} className="border border-honey-400 rounded-xl p-3 space-y-2">
              <div className="flex gap-2"><Input className="font-semibold" value={p.name} placeholder="Name" onChange={(e) => update("providers", p.id, { name: e.target.value })} /><DeleteButton onClick={() => removeProvider(p.id)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={p.role} onChange={(e) => update("providers", p.id, { role: e.target.value as typeof p.role })}>{PROVIDER_ROLES.map((r) => <option key={r}>{r}</option>)}</Select>
                <Input value={p.phone} placeholder="Phone" onChange={(e) => update("providers", p.id, { phone: e.target.value })} />
                <Input value={p.email} placeholder="Email" onChange={(e) => update("providers", p.id, { email: e.target.value })} />
                <Input value={p.address} placeholder="Address" onChange={(e) => update("providers", p.id, { address: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
