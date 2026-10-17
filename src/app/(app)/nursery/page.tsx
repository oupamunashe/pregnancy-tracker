"use client";

import { useState } from "react";
import { Button, Card, DeleteButton, Empty, Field, Input, ProgressBar, SectionTitle, Select, Textarea } from "@/components/ui";
import { useActive } from "@/hooks";
import { formatLong } from "@/lib/engine/gestation";
import { NURSERY_STATUSES, type NurseryItem } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { isHttpUrl, luminance, shrinkImage, uid } from "@/lib/utils";

export default function NurseryPage() {
  const [view, setView] = useState<"list" | "vision">("list");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button type="button" className={`tab ${view === "list" ? "on" : ""}`} onClick={() => setView("list")}>📋 Checklist &amp; Tracker</button>
        <button type="button" className={`tab ${view === "vision" ? "on" : ""}`} onClick={() => setView("vision")}>🎨 Vision Board</button>
      </div>
      {view === "list" ? <Tracker /> : <VisionBoard />}
    </div>
  );
}

function Tracker() {
  const { data, dateOfWeek } = useActive();
  const { add, update, remove } = useStore.getState();
  const [n, setN] = useState<{ text: string; todo: string; status: NurseryItem["status"] }>({ text: "", todo: "", status: "To buy" });
  const done = data.nursery.filter((i) => i.done).length;

  const setDone = (i: NurseryItem, v: boolean) => update("nursery", i.id, { done: v, status: v ? "Set up" : i.status === "Set up" ? "To buy" : i.status });
  const setStatus = (i: NurseryItem, status: NurseryItem["status"]) => update("nursery", i.id, { status, done: status === "Set up" });
  const addItem = () => {
    if (!n.text.trim()) return;
    add("nursery", { id: uid("u_"), text: n.text.trim(), todo: n.todo, status: n.status, done: n.status === "Set up", link: "" });
    setN({ text: "", todo: "", status: "To buy" });
  };

  return (
    <Card className="p-5">
      <div className="flex justify-between items-baseline flex-wrap gap-1">
        <SectionTitle>Nursery essentials</SectionTitle>
        <span className="text-xs text-gray-500">{done} / {data.nursery.length} done · target: set up by week 36 ({formatLong(dateOfWeek(36))})</span>
      </div>
      <ProgressBar value={data.nursery.length ? done / data.nursery.length : 0} className="my-2" />
      <div className="scroll-x">
        <table className="w-full text-sm min-w-[720px]">
          <thead><tr className="text-left"><th className="w-8" /><th className="th">Item</th><th className="th">Status</th><th className="th">Associated to-do</th><th className="th">Link</th><th /></tr></thead>
          <tbody className="divide-y divide-rose-100">
            {data.nursery.map((i) => (
              <tr key={i.id} className="align-top">
                <td className="py-2"><input type="checkbox" checked={i.done} onChange={(e) => setDone(i, e.target.checked)} aria-label={`Done: ${i.text}`} /></td>
                <td className="py-2 pr-2"><Input className={i.done ? "line-through text-gray-400" : ""} value={i.text} onChange={(e) => update("nursery", i.id, { text: e.target.value })} /></td>
                <td className="py-2 pr-2"><Select value={i.status} onChange={(e) => setStatus(i, e.target.value as NurseryItem["status"])}>{NURSERY_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></td>
                <td className="py-2 pr-2"><Input value={i.todo} placeholder="e.g. Assemble by week 34" onChange={(e) => update("nursery", i.id, { todo: e.target.value })} /></td>
                <td className="py-2 pr-2"><Input value={i.link} placeholder="https://" onChange={(e) => update("nursery", i.id, { link: e.target.value })} />
                  {isHttpUrl(i.link) && <a href={i.link} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-700 font-semibold">open ↗</a>}</td>
                <td className="py-2"><DeleteButton onClick={() => remove("nursery", i.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid sm:grid-cols-5 gap-2 mt-3">
        <Input className="sm:col-span-2" value={n.text} placeholder="Add nursery item…" onChange={(e) => setN({ ...n, text: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addItem()} />
        <Select value={n.status} onChange={(e) => setN({ ...n, status: e.target.value as NurseryItem["status"] })}>{NURSERY_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
        <Input value={n.todo} placeholder="Associated to-do" onChange={(e) => setN({ ...n, todo: e.target.value })} />
        <Button onClick={addItem}>Add</Button>
      </div>
    </Card>
  );
}

function VisionBoard() {
  const { data } = useActive();
  const { add, update, remove } = useStore.getState();
  const [draft, setDraft] = useState({ image: "", notes: "", swatches: [] as string[] });
  const [error, setError] = useState("");
  const [sw, setSw] = useState({ hex: "#00A693", name: "" });
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const upload = async (file?: File) => {
    if (!file) return;
    try { const url = await shrinkImage(file); setDraft((d) => ({ ...d, image: url })); setError(""); }
    catch { setError("That file couldn't be read as an image."); }
  };
  const addCard = () => {
    if (!draft.image.trim() && !draft.notes.trim() && !draft.swatches.length) return setError("Add an image, a note or a swatch first.");
    add("vision", { id: uid("v_"), image: draft.image.trim(), notes: draft.notes, swatches: draft.swatches });
    setDraft({ image: "", notes: "", swatches: [] }); setError("");
  };

  return (
    <>
      <Card className="p-5">
        <SectionTitle>Colour palette</SectionTitle>
        <p className="text-xs text-gray-500 mb-3">Click a swatch to attach it to the idea you&apos;re adding; use the swatches on a card to tag it later.</p>
        <div className="flex flex-wrap gap-3 items-center">
          {data.palette.map((c) => (
            <div key={c.id} className="flex items-center gap-2 border border-honey-400 rounded-full pl-1 pr-3 py-1">
              <button type="button" className={`w-7 h-7 rounded-full border border-black/10 ${draft.swatches.includes(c.hex) ? "ring-2 ring-offset-1 ring-rose-500" : ""}`} style={{ background: c.hex }}
                onClick={() => setDraft({ ...draft, swatches: toggle(draft.swatches, c.hex) })} aria-label={`Select ${c.name}`} aria-pressed={draft.swatches.includes(c.hex)} />
              <span className="text-xs"><b>{c.name}</b> {c.hex}</span>
              <button type="button" className="text-gray-300 hover:text-rose-700 text-xs" onClick={() => remove("palette", c.id)} aria-label="Remove swatch">✕</button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="color" value={sw.hex} onChange={(e) => setSw({ ...sw, hex: e.target.value })} className="w-9 h-9 rounded cursor-pointer" aria-label="Pick colour" />
            <Input className="!w-36" value={sw.name} placeholder="Name" onChange={(e) => setSw({ ...sw, name: e.target.value })} />
            <Button variant="ghost" onClick={() => { add("palette", { id: uid("k_"), name: sw.name.trim() || sw.hex, hex: sw.hex }); setSw({ ...sw, name: "" }); }}>+ Swatch</Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <SectionTitle>Add to the board</SectionTitle>
        <div className="grid md:grid-cols-6 gap-2">
          <Input className="md:col-span-3" value={draft.image.startsWith("data:") ? "" : draft.image} placeholder={draft.image.startsWith("data:") ? "Uploaded image ready ✓" : "Paste an image URL (https://…)"} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
          <label className="btn btn-g text-center cursor-pointer">📷 Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label>
          <Button className="md:col-span-2" onClick={addCard}>Add to board</Button>
        </div>
        <Textarea rows={2} value={draft.notes} placeholder="Notes / ideas for this look…" onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Attached:</span>
          {draft.swatches.map((h) => <span key={h} className="w-5 h-5 rounded-full border border-black/10" style={{ background: h }} />)}
          {!draft.swatches.length && <span>no swatches</span>}
          {draft.image && <span className="ml-auto">image ready ✓</span>}
        </div>
        {error && <p className="text-sm text-brass-700" role="alert">{error}</p>}
      </Card>

      <div style={{ columnWidth: "16rem", columnGap: "1rem" }}>
        {data.vision.map((v) => (
          <Card key={v.id} className="mb-4 overflow-hidden" >
            <div style={{ breakInside: "avoid" }}>
              {v.image && !broken[v.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.image} alt="" className="w-full block" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken((b) => ({ ...b, [v.id]: true }))} />
              )}
              {broken[v.id] && <div className="p-3 text-xs bg-brass-100 text-brass-700">Image couldn&apos;t load — check the URL.</div>}
              <div className="p-3 space-y-2">
                <Textarea rows={3} value={v.notes} placeholder="Notes…" onChange={(e) => update("vision", v.id, { notes: e.target.value })} />
                <div className="flex flex-wrap items-center gap-1.5">
                  {data.palette.map((c) => (
                    <button key={c.id} type="button" className="w-6 h-6 rounded-full border border-black/10 relative" style={{ background: c.hex }} title={c.name}
                      onClick={() => update("vision", v.id, { swatches: toggle(v.swatches, c.hex) })} aria-pressed={v.swatches.includes(c.hex)}>
                      {v.swatches.includes(c.hex) && <span className="absolute inset-0 grid place-items-center text-[11px]" style={{ color: luminance(c.hex) > 0.6 ? "#000" : "#fff" }}>✓</span>}
                    </button>
                  ))}
                  <button type="button" className="ml-auto text-gray-400 hover:text-rose-700 text-sm" onClick={() => remove("vision", v.id)} aria-label="Delete">🗑</button>
                </div>
              </div>
              {v.swatches.length > 0 && <div className="flex h-3">{v.swatches.map((h) => <div key={h} className="flex-1" style={{ background: h }} />)}</div>}
            </div>
          </Card>
        ))}
      </div>
      {!data.vision.length && <Empty>Your board is empty — paste an image URL, upload a photo, or jot down an idea with swatches.</Empty>}
    </>
  );
}
