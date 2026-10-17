"use client";

import { useEffect } from "react";

/** Registers the service worker in production builds so the app is installable and opens offline. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => { /* not critical */ });
  }, []);
  return null;
}
