"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { computeEdd, formatLong, isValidISO, parseDate } from "@/lib/engine/gestation";
import { useStore } from "@/lib/store";
import { Button, Field, Input, Modal, Textarea } from "./ui";

export function NewProfileModal({ open, onboarding = false, onClose }: { open: boolean; onboarding?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const createProfile = useStore((s) => s.createProfile);
  // The first-run form is pre-filled with the spec's example so the app can be explored immediately.
  const [nickname, setNickname] = useState(onboarding ? "Blueberry Peanut" : "");
  const [lmp, setLmp] = useState(onboarding ? "2026-09-17" : "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const edd = isValidISO(lmp) ? computeEdd(parseDate(lmp)) : null;

  const submit = () => {
    if (!nickname.trim()) return setError("Please give this profile a nickname.");
    if (!isValidISO(lmp)) return setError("Please pick the LMP date.");
    createProfile({ nickname, lmp, notes });
    setNickname(""); setLmp(""); setNotes(""); setError("");
    router.push("/dashboard");
    onClose?.();
  };

  return (
    <Modal open={open} onClose={onboarding ? undefined : onClose} title={onboarding ? "Welcome — start your pregnancy profile" : "New pregnancy profile"}>
      {onboarding && <div className="text-center text-4xl" aria-hidden>🌸</div>}
      <Field label="Profile nickname"><Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Blueberry Peanut" autoFocus /></Field>
      <Field label="Last menstrual period (LMP)">
        <Input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
        <span className={`text-sm mt-1 block ${edd ? "text-rose-700" : "text-gray-400"}`}>
          {edd ? `Estimated due date: ${formatLong(edd)} (LMP + 280 days)` : "Pick a date to see your due date"}
        </span>
      </Field>
      <Field label="Notes (optional)"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      {error && <p className="text-sm text-brass-700" role="alert">{error}</p>}
      <div className="flex gap-2 justify-end">
        {!onboarding && <Button variant="ghost" onClick={onClose}>Cancel</Button>}
        <Button onClick={submit}>Create profile</Button>
      </div>
    </Modal>
  );
}
