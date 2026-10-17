"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { startAutoSync, syncNow, signOut, useSyncStatus } from "@/lib/sync";
import { cx } from "@/lib/utils";
import { formatLong, gestationalAge, parseDate, startOfToday, computeEdd } from "@/lib/engine/gestation";
import { LoginScreen } from "./LoginScreen";
import { NewProfileModal } from "./NewProfileModal";
import { ProfileIcon } from "./ProfileIcon";
import { ThemeApplier } from "./ThemeApplier";
import { Input } from "./ui";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" }, { href: "/todo", label: "Weekly To-Do", icon: "✅" },
  { href: "/appointments", label: "Appointments", icon: "🩺" }, { href: "/budget", label: "Budget", icon: "💰" },
  { href: "/nursery", label: "Nursery", icon: "🛏" }, { href: "/checklists", label: "Hospital Bag", icon: "🧳" },
  { href: "/names", label: "Names", icon: "👶" }, { href: "/advice", label: "Advice & Postpartum", icon: "💡" },
];
const MORE = [
  { href: "/photography", label: "Photography Log", icon: "📸" }, { href: "/daycare", label: "Daycare Directory", icon: "🏫" },
  { href: "/diaper", label: "Diaper Size Calculator", icon: "🧷" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useStore((s) => s.hydrated);
  const profile = useStore((s) => s.profiles.find((p) => p.id === s.activeId));
  const simToday = useStore((s) => s.simToday);
  const setSimToday = useStore((s) => s.setSimToday);
  const { configured, authChecked, email, firstSyncDone, error: syncError } = useSyncStatus();
  const locked = configured && !email;   // cloud is configured: the app is only usable while signed in
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).then(() => useStore.setState({ hydrated: true }));
  }, []);
  useEffect(() => (hydrated ? startAutoSync() : undefined), [hydrated]);
  useEffect(() => setMenu(null), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("click", close);
    window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", close); window.removeEventListener("keydown", esc); };
  }, [menu]);

  const toggleMore = () => {
    if (menu) return setMenu(null);
    const r = moreBtn.current!.getBoundingClientRect();
    setMenu({ x: Math.max(8, Math.min(r.left, window.innerWidth - 232)), y: r.bottom + 4 });
  };

  const activeMore = MORE.find((m) => pathname.startsWith(m.href));
  let subtitle = "";
  if (profile) {
    const lmp = parseDate(profile.lmp);
    const today = simToday ? parseDate(simToday) : startOfToday();
    const ga = gestationalAge(lmp, today);
    subtitle = `EDD ${formatLong(computeEdd(lmp))} · ${ga.totalDays >= 0 ? `${ga.weeks}w ${ga.days}d` : `starts in ${-ga.totalDays}d`}`;
  }

  return (
    <>
      <ThemeApplier />
      <header className="bg-[var(--surface-card)] border-b-4 border-brass-400 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <ProfileIcon icon={locked ? "🔒" : profile?.icon} size={36} />
          <div className="leading-tight">
            <div className="font-bold text-rose-700">{profile && !locked ? profile.nickname : "Pregnancy Tracker"}</div>
            {profile && !locked && <div className="text-xs text-gray-500">{subtitle}</div>}
          </div>
        </div>
        {profile && !locked && (
          <nav className="max-w-6xl mx-auto px-4 pb-2 scroll-x flex gap-1 items-center" aria-label="Main">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className={cx("tab", pathname === t.href && "on")} aria-current={pathname === t.href ? "page" : undefined}>{t.icon} {t.label}</Link>
            ))}
            <button ref={moreBtn} type="button" className={cx("tab", activeMore && "on")} aria-haspopup="menu" aria-expanded={!!menu}
              onClick={(e) => { e.stopPropagation(); toggleMore(); }}>
              ✨ {activeMore?.label ?? "More"} ▾
            </button>
            <Link href="/settings" className={cx("tab ml-auto", pathname === "/settings" && "on")} aria-label="Settings">⚙️ Settings</Link>
          </nav>
        )}
        {menu && (
          <div className="fixed z-40 card py-1 w-56 shadow-lg" style={{ top: menu.y, left: menu.x }} role="menu" onClick={(e) => e.stopPropagation()}>
            {MORE.map((m) => (
              <Link key={m.href} href={m.href} role="menuitem" className={cx("block px-4 py-2 text-sm font-semibold hover:bg-rose-100", pathname === m.href && "text-rose-500")}>{m.icon} {m.label}</Link>
            ))}
          </div>
        )}
      </header>

      {!hydrated || (configured && !authChecked) ? (
        <p className="text-center text-gray-500 py-20">Loading…</p>
      ) : locked ? (
        <LoginScreen />
      ) : !profile && configured && !firstSyncDone ? (
        // signed in on a new device: wait for the first sync before offering onboarding, so we never create a duplicate profile
        <div className="text-center py-20 space-y-3">
          {syncError ? (
            <>
              <p className="text-brass-700" role="alert">Couldn&apos;t load your data: {syncError}</p>
              <div className="flex gap-2 justify-center">
                <button type="button" className="btn btn-p" onClick={() => void syncNow().catch(() => {})}>Retry</button>
                <button type="button" className="btn btn-g" onClick={() => void signOut()}>Sign out</button>
              </div>
            </>
          ) : <p className="text-gray-500">Syncing your data…</p>}
        </div>
      ) : profile ? (
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {children}
          <footer className="text-xs text-gray-400 text-center pt-4 pb-10 space-y-2">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <label className="flex items-center gap-2">Simulate today:
                <Input type="date" className="!w-auto !py-1" value={simToday} onChange={(e) => setSimToday(e.target.value)} />
              </label>
              {simToday && <button type="button" className="btn btn-g !py-1" onClick={() => setSimToday("")}>Use real date</button>}
            </div>
            <div>A planning tool, not medical advice. Follow your care provider&apos;s guidance. Data stays in this browser (localStorage).</div>
          </footer>
        </main>
      ) : (
        <NewProfileModal open onboarding />
      )}
    </>
  );
}
