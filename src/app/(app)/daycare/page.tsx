"use client";

import { useState } from "react";
import { Button, Card, Chip, DeleteButton, Empty, Field, Input, NumberInput, Textarea } from "@/components/ui";
import { useActive } from "@/hooks";
import { useStore } from "@/lib/store";
import { money, uid } from "@/lib/utils";

export default function DaycarePage() {
  const { data } = useActive();
  const { add, update, remove } = useStore.getState();
  const [d, setD] = useState({ name: "", address: "" });
  const addDaycare = () => {
    if (!d.name.trim()) return;
    add("daycares", { id: uid("d_"), name: d.name.trim(), address: d.address, hours: "", fee: null, notes: "", contact: "" });
    setD({ name: "", address: "" });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 grid sm:grid-cols-5 gap-2 items-end">
        <Field label="Add daycare" className="sm:col-span-2"><Input value={d.name} placeholder="Daycare name" onChange={(e) => setD({ ...d, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addDaycare()} /></Field>
        <Field label="Location / address" className="sm:col-span-2"><Input value={d.address} onChange={(e) => setD({ ...d, address: e.target.value })} /></Field>
        <Button onClick={addDaycare}>Add</Button>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        {data.daycares.map((x) => (
          <Card key={x.id} className="p-4 space-y-2">
            <div className="flex gap-2 items-center">
              <Input className="font-bold" value={x.name} placeholder="Daycare name" onChange={(e) => update("daycares", x.id, { name: e.target.value })} />
              {!!x.fee && <Chip tone="brass" className="whitespace-nowrap">{money(x.fee)}/mo</Chip>}
              <DeleteButton onClick={() => remove("daycares", x.id)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Location / address" className="col-span-2"><Input value={x.address} onChange={(e) => update("daycares", x.id, { address: e.target.value })} /></Field>
              <Field label="Operating hours"><Input value={x.hours} placeholder="06:30 – 18:00" onChange={(e) => update("daycares", x.id, { hours: e.target.value })} /></Field>
              <Field label="Monthly fees (R)"><NumberInput min={0} value={x.fee} onChange={(v) => update("daycares", x.id, { fee: v })} /></Field>
              <Field label="Contact info" className="col-span-2"><Input value={x.contact} placeholder="Phone / email" onChange={(e) => update("daycares", x.id, { contact: e.target.value })} /></Field>
              <Field label="Visit notes" className="col-span-2"><Textarea rows={3} value={x.notes} placeholder="Ratios, cleanliness, meals, vibe…" onChange={(e) => update("daycares", x.id, { notes: e.target.value })} /></Field>
            </div>
          </Card>
        ))}
      </div>
      {!data.daycares.length && <Empty>No daycares saved yet.</Empty>}
    </div>
  );
}
