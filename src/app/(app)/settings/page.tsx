"use client";

import { useRef, useState } from "react";
import { NewProfileModal } from "@/components/NewProfileModal";
import { DiaperImage } from "@/components/DiaperImage";
import { ProfileIcon } from "@/components/ProfileIcon";
import { Button, Card, Chip, Field, Input, SectionTitle, Textarea } from "@/components/ui";
import { useActive } from "@/hooks";
import { DIAPER_BRANDS, rangeText, sizeKey } from "@/lib/diaper";
import { computeEdd, formatLong, isValidISO, parseDate } from "@/lib/engine/gestation";
import { DEFAULT_THEME, type Theme } from "@/lib/schemas";
import { useStore } from "@/lib/store";
import { deleteRemoteProfile, sendMagicLink, signInWithPassword, signOut, syncNow, useSyncStatus } from "@/lib/sync";
import { isUrl, shrinkImage } from "@/lib/utils";

const ICONS: [string, string][] = [["🫐", "Blueberry"], ["🥜", "Peanut"], ["🌸", "Flower"], ["🥑", "Avocado"], ["👶", "Baby"], ["🍓", "Strawberry"], ["🥭", "Mango"], ["🍑", "Peach"], ["🌱", "Sprout"], ["🧸", "Teddy"], ["⭐", "Star"], ["💛", "Heart"]];
const THEME_FIELDS: { key: keyof Theme; label: string; hint: string }[] = [
  { key: "primary", label: "Primary colour", hint: "Active tabs, primary buttons, progress bars" },
  { key: "bg", label: "Background / surface", hint: "Page and card surfaces, table bands" },
  { key: "accent", label: "Accent / border", hint: "Borders, outlined and secondary buttons" },
  { key: "highlight", label: "Highlight / badge", hint: "Badges, star ratings, header underline" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <ProfileSection />
      <ProfilesList />
      <CloudSyncSection />
      <ThemeSection />
      <DiaperImagesSection />
      <DataSection />
    </div>
  );
}

function ProfileSection() {
  const { profile } = useActive();
  const updateProfile = useStore((s) => s.updateProfile);
  const [f, setF] = useState({ nickname: profile.nickname, lmp: profile.lmp, notes: profile.notes, icon: profile.icon });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const edd = isValidISO(f.lmp) ? computeEdd(parseDate(f.lmp)) : null;

  const save = () => {
    if (!f.nickname.trim()) return setMsg({ ok: false, text: "Please give this profile a nickname." });
    if (!isValidISO(f.lmp)) return setMsg({ ok: false, text: "Please pick the LMP date." });
    updateProfile(profile.id, { nickname: f.nickname.trim(), lmp: f.lmp, notes: f.notes, icon: f.icon.trim() || "🌸" });
    setMsg({ ok: true, text: "Saved ✓" });
  };

  return (
    <Card className="p-5 space-y-3">
      <SectionTitle>Active pregnancy profile</SectionTitle>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Profile nickname"><Input value={f.nickname} onChange={(e) => setF({ ...f, nickname: e.target.value })} /></Field>
        <Field label="Last menstrual period (LMP)"><Input type="date" value={f.lmp} onChange={(e) => setF({ ...f, lmp: e.target.value })} />
          {edd && <span className="text-xs text-rose-700 mt-1 block">Due date: {formatLong(edd)}</span>}</Field>
        <div className="md:col-span-2">
          <span className="th block">Profile icon / emoji</span>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {ICONS.map(([e, name]) => (
              <button key={e} type="button" title={name} aria-label={name} aria-pressed={f.icon === e} onClick={() => setF({ ...f, icon: e })}
                className={`w-11 h-11 rounded-xl border text-2xl grid place-items-center hover:bg-rose-100 ${f.icon === e ? "border-rose-500 ring-2 ring-rose-500 bg-rose-100" : "border-honey-400"}`}>{e}</button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-11 h-11 rounded-xl border border-honey-400 grid place-items-center bg-white overflow-hidden"><ProfileIcon icon={f.icon} size={28} /></div>
            <Input value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} placeholder="Type any emoji, or paste an image URL (https://…)" aria-label="Custom emoji or image URL" />
          </div>
        </div>
        <Field label="Notes" className="md:col-span-2"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-rose-700 font-semibold" : "text-brass-700"}`} role="status">{msg.text}</p>}
      <Button onClick={save}>Save changes</Button>
    </Card>
  );
}

function ProfilesList() {
  const profiles = useStore((s) => s.profiles);
  const activeId = useStore((s) => s.activeId);
  const { setActive, updateProfile, deleteProfile } = useStore.getState();
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-3"><SectionTitle>All pregnancy profiles</SectionTitle><Button variant="secondary" onClick={() => setOpen(true)}>+ New profile</Button></div>
      <ul className="divide-y divide-rose-100">
        {profiles.map((p) => (
          <li key={p.id} className="py-3 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[12rem]">
              <div className="font-semibold flex items-center gap-2"><ProfileIcon icon={p.icon} size={22} />{p.nickname}
                {p.id === activeId && <Chip tone="primary">Viewing</Chip>}{p.status === "archived" && <Chip tone="soft">Archived</Chip>}</div>
              <div className="text-xs text-gray-500">LMP {formatLong(parseDate(p.lmp))} · EDD {formatLong(computeEdd(parseDate(p.lmp)))}</div>
            </div>
            {p.id !== activeId && <Button variant="ghost" onClick={() => setActive(p.id)}>Switch to</Button>}
            <Button variant="ghost" onClick={() => updateProfile(p.id, { status: p.status === "archived" ? "active" : "archived" })}>{p.status === "archived" ? "Unarchive" : "Archive"}</Button>
            <Button variant="ghost" onClick={() => { if (confirm(`Delete "${p.nickname}" and all its data${useSyncStatus.getState().email ? " (including the cloud copy)" : ""}? This cannot be undone.`)) { void deleteRemoteProfile(p.id); deleteProfile(p.id); } }}>Delete</Button>
          </li>
        ))}
      </ul>
      <NewProfileModal open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}

function CloudSyncSection() {
  const { configured, email, syncing, lastSynced, error } = useSyncStatus();
  const [addr, setAddr] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, ok?: string) => {
    setMsg(""); setBusy(true);
    try { await fn(); if (ok) setMsg(ok); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  return (
    <Card className="p-5 space-y-3">
      <SectionTitle>☁️ Private cloud sync</SectionTitle>
      {!configured ? (
        <p className="text-sm text-gray-600">Not configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and restart — until then everything is saved only in this browser.</p>
      ) : !email ? (
        <>
          <p className="text-sm text-gray-600">Only the two household email addresses can sign in. Your data stays on this device until you do; after that it syncs to your private Supabase project, where only the two of you can read it.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <Input type="email" placeholder="your email" value={addr} onChange={(e) => setAddr(e.target.value)} aria-label="Email" autoComplete="email" />
            <Input type="password" placeholder="password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Password" autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && addr && pw && void run(() => signInWithPassword(addr.trim(), pw))} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button disabled={busy || !addr.includes("@") || !pw} onClick={() => void run(() => signInWithPassword(addr.trim(), pw))}>Sign in</Button>
            <Button variant="ghost" disabled={busy || !addr.includes("@")} onClick={() => void run(() => sendMagicLink(addr.trim()), `If ${addr.trim()} is on the household list, a sign-in link is on its way — open it on this device.`)}>Email me a magic link instead</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm">Signed in as <b>{email}</b>. {lastSynced ? `Last synced ${new Date(lastSynced).toLocaleTimeString()}.` : "Not synced yet."} Changes sync automatically.</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => void syncNow().catch(() => {})} disabled={syncing}>{syncing ? "Syncing…" : "Sync now"}</Button>
            <Button variant="ghost" onClick={() => void signOut()}>Sign out</Button>
          </div>
        </>
      )}
      {msg && <p className="text-sm" role="status">{msg}</p>}
      {error && <p className="text-sm text-brass-700" role="alert">Sync problem: {error}</p>}
    </Card>
  );
}

function ThemeSection() {
  const theme = useStore((s) => s.theme);
  const { setTheme, resetTheme } = useStore.getState();
  const [error, setError] = useState("");

  const commit = (key: keyof Theme, raw: string, input?: HTMLInputElement) => {
    let v = raw.trim();
    if (/^[0-9a-f]{6}$/i.test(v)) v = "#" + v;
    if (!/^#[0-9a-f]{6}$/i.test(v)) {
      setError(`"${v}" isn't a valid hex colour — use the form #RRGGBB.`);
      if (input) input.value = theme[key];
      return;
    }
    setError("");
    setTheme({ [key]: v.toLowerCase() });
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2"><SectionTitle>🎨 Theme &amp; Appearance</SectionTitle><Button variant="ghost" onClick={() => { resetTheme(); setError(""); }}>Reset to Default Theme</Button></div>
      <p className="text-sm text-gray-600">Pick a colour or type a hex code — the whole app updates instantly and the palette is saved in this browser.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {THEME_FIELDS.map((t) => (
          <div key={t.key}>
            <span className="th block">{t.label} <span className="normal-case font-normal text-gray-500">(default {DEFAULT_THEME[t.key].toUpperCase()})</span></span>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" className="w-11 h-11 rounded-lg cursor-pointer border border-honey-400 bg-white p-0.5" value={theme[t.key]} onChange={(e) => commit(t.key, e.target.value)} aria-label={`${t.label} picker`} />
              <Input key={theme[t.key]} className="uppercase" maxLength={7} defaultValue={theme[t.key]} onBlur={(e) => commit(t.key, e.target.value, e.target)}
                onKeyDown={(e) => e.key === "Enter" && commit(t.key, e.currentTarget.value, e.currentTarget)} aria-label={`${t.label} hex`} />
            </div>
            <div className="text-xs text-gray-500 mt-1">{t.hint}</div>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-brass-700" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2 items-center border-t border-honey-400 pt-3">
        <span className="th mr-1">Preview</span>
        <Button>Primary</Button><Button variant="secondary">Accent</Button><Button variant="ghost">Outline</Button>
        <Chip tone="brass">Highlight badge</Chip><Chip tone="surface">Surface chip</Chip><span className="text-brass-400 text-xl" aria-hidden>★★★★☆</span>
      </div>
    </Card>
  );
}

function DiaperImagesSection() {
  const overrides = useStore((s) => s.diaperImages);
  const { setDiaperImage } = useStore.getState();

  const upload = async (key: string, file?: File) => {
    if (!file) return;
    try { setDiaperImage(key, await shrinkImage(file)); } catch { /* not an image — ignore */ }
  };

  return (
    <Card className="p-5">
      <SectionTitle>🖼 Diaper Images / Media Settings</SectionTitle>
      <p className="text-sm text-gray-600 mb-3">Defaults are Checkers Sixty60 pack shots. If a link breaks (or a size has none), paste a link from Checkers, Clicks or Amazon SA, or upload a photo. Tip: right-click the pack photo → &quot;Copy image address&quot;.</p>
      {DIAPER_BRANDS.map((b) => {
        const custom = b.sizes.filter((s) => overrides[sizeKey(b.brand, s.label)]).length;
        const missing = b.sizes.filter((s) => !overrides[sizeKey(b.brand, s.label)] && s.placeholder).length;
        return (
          <details key={b.brand} className="border border-honey-400 rounded-xl mb-2 overflow-hidden">
            <summary className="px-4 py-2 font-semibold cursor-pointer bg-rose-100 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: b.color }} />{b.brand}
              <Chip tone="surface">{custom} custom</Chip>{missing > 0 && <Chip tone="brassSoft">{missing} placeholder</Chip>}
            </summary>
            <ul className="divide-y divide-rose-100">
              {b.sizes.map((s) => {
                const key = sizeKey(b.brand, s.label);
                const o = overrides[key];
                return (
                  <li key={key} className="p-3 flex flex-wrap items-center gap-3">
                    <DiaperImage src={o || s.image} alt={`${b.brand} ${s.label}`} color={b.color} className="w-14" />
                    <div className="w-40"><div className="text-sm font-semibold">{s.label}</div><Chip tone="soft">{rangeText(s)}</Chip>{o && <Chip tone="brassSoft" className="ml-1">custom</Chip>}</div>
                    <Input key={o ?? "default"} className="flex-1 min-w-[12rem]" defaultValue={o && isUrl(o) && !o.startsWith("data:") ? o : ""} placeholder={o?.startsWith("data:") ? "Uploaded image in use" : "Image URL (blank = default)"}
                      onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== o) setDiaperImage(key, v); }} aria-label={`Image URL for ${b.brand} ${s.label}`} />
                    <label className="btn btn-g text-xs cursor-pointer">📷 Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(key, e.target.files?.[0]); e.target.value = ""; }} /></label>
                    {o && <Button variant="ghost" className="text-xs" onClick={() => setDiaperImage(key, null)}>Reset</Button>}
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </Card>
  );
}

function DataSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  const exportData = () => {
    const { activeId, profiles, data, diaperWeight, diaperImages, theme } = useStore.getState();
    const blob = new Blob([JSON.stringify({ version: 1, activeId, profiles, data, diaperWeight, diaperImages, theme }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pregtracker-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = async (file?: File) => {
    if (!file) return;
    try {
      const r = useStore.getState().importState(JSON.parse(await file.text()));
      setMsg(r.ok ? "Imported ✓" : r.error);
    } catch { setMsg("That file isn't valid JSON."); }
  };

  return (
    <Card className="p-5">
      <SectionTitle>Data</SectionTitle>
      <div className="flex gap-2 flex-wrap mt-2">
        <Button variant="ghost" onClick={exportData}>Export JSON</Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()}>Import JSON</Button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { void importData(e.target.files?.[0]); e.target.value = ""; }} />
        <Button variant="ghost" onClick={() => { if (confirm("Erase all data in this browser?")) useStore.getState().resetAll(); }}>Reset everything</Button>
      </div>
      {msg && <p className="text-sm mt-2" role="status">{msg}</p>}
    </Card>
  );
}
