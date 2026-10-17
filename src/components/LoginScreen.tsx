"use client";

import { useState } from "react";
import { sendMagicLink, signInWithPassword } from "@/lib/sync";
import { Button, Card, Field, Input } from "./ui";

/** Shown instead of the app until a household member signs in. There is deliberately no sign-up. */
export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, ok?: string) => {
    setMsg(null); setBusy(true);
    try { await fn(); if (ok) setMsg({ ok: true, text: ok }); }
    catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong." }); }
    finally { setBusy(false); }
  };
  const login = () => run(() => signInWithPassword(email.trim(), password));

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Card className="p-6 space-y-4">
        <div className="text-center"><div className="text-4xl" aria-hidden>🔒</div><h1 className="text-xl font-bold text-rose-700 mt-2">Pregnancy Tracker</h1>
          <p className="text-sm text-gray-600 mt-1">Private — sign in to continue.</p></div>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void login(); }}>
          <Field label="Email"><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required /></Field>
          <Field label="Password"><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
          {msg && <p className={`text-sm ${msg.ok ? "text-rose-700" : "text-brass-700"}`} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
          <Button type="submit" className="w-full" disabled={busy || !email.includes("@") || !password}>{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
        <button type="button" className="text-xs text-rose-700 underline block mx-auto disabled:opacity-50" disabled={busy || !email.includes("@")}
          onClick={() => void run(() => sendMagicLink(email.trim()), "If that email is registered, a sign-in link is on its way — open it on this device.")}>
          Email me a magic link instead
        </button>
        <p className="text-xs text-gray-500 text-center">Access is limited to the two registered household accounts.</p>
      </Card>
    </main>
  );
}
