"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { onColor } from "@/lib/utils";

/** Pushes the saved theme into the root CSS variables, so a change re-styles the whole app instantly. */
export function ThemeApplier() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--color-primary", theme.primary);
    r.setProperty("--color-bg", theme.bg);
    r.setProperty("--color-accent", theme.accent);
    r.setProperty("--color-highlight", theme.highlight);
    r.setProperty("--on-primary", onColor(theme.primary));
    r.setProperty("--on-highlight", onColor(theme.highlight));
  }, [theme]);
  return null;
}
