"use client";

import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("card", className)}>{children}</div>;
}

const BTN = { primary: "btn btn-p", secondary: "btn btn-s", ghost: "btn btn-g" } as const;
export function Button({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BTN }) {
  return <button type="button" className={cx(BTN[variant], className)} {...p} />;
}

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cx("inp", className)} {...p} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cx("inp", className)} {...p} />;
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select className={cx("inp", className)} {...p} />;

/** Number input that maps "" ↔ null. */
export function NumberInput({ value, onChange, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { value: number | null; onChange: (v: number | null) => void }) {
  return <input type="number" className={cx("inp", p.className)} {...p} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />;
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="th block mb-1">{label}</span>
      {children}
    </label>
  );
}

const TONES = {
  primary: "bg-rose-500 text-onprimary",
  soft: "bg-rose-100 text-rose-700",
  surface: "bg-rose-200 text-rose-700",
  brass: "bg-brass-400 text-onhl",
  brassSoft: "bg-brass-100 text-brass-700",
  gray: "bg-gray-100 text-gray-600",
  done: "bg-sage-100 text-sage-700",
  sky: "bg-sky-100 text-sky-700",
} as const;
export type Tone = keyof typeof TONES;
export const Chip = ({ tone = "soft", className, children }: { tone?: Tone; className?: string; children: ReactNode }) => (
  <span className={cx("chip", TONES[tone], className)}>{children}</span>
);

export function DeleteButton({ onClick, label = "Delete" }: { onClick: () => void; label?: string }) {
  return <button type="button" onClick={onClick} aria-label={label} className="text-gray-400 hover:text-rose-700">✕</button>;
}

export function ProgressBar({ value, tone = "bg-rose-500", className }: { value: number; tone?: string; className?: string }) {
  return (
    <div className={cx("h-2 bg-rose-100 rounded-full overflow-hidden", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-all", tone)} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose?: () => void }) {
  useEffect(() => {
    if (!open || !onClose) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 space-y-4 max-h-[92vh] overflow-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title" className="text-xl font-bold text-rose-700">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => <p className="text-center text-gray-500 py-8 card">{children}</p>;
export const SectionTitle = ({ children }: { children: ReactNode }) => <h2 className="font-bold text-lg">{children}</h2>;
