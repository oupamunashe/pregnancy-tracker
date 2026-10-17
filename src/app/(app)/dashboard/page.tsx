"use client";

import Link from "next/link";
import { CategoryChip, StatusChip } from "@/components/badges";
import { Card, Chip, ProgressBar } from "@/components/ui";
import { useActive } from "@/hooks";
import { formatLong, parseDate, taskStatus, trimesterLabel } from "@/lib/engine/gestation";
import { useStore } from "@/lib/store";
import { weeklyHighlight } from "@/lib/templates";
import { money } from "@/lib/utils";

export default function DashboardPage() {
  const { profile, data, ga, edd, lmp, daysToGo, progress, dateOfWeek, today } = useActive();
  const update = useStore((s) => s.update);
  const highlight = weeklyHighlight(ga.weeks);

  const upNext = data.tasks.filter((t) => !t.done).sort((a, b) => a.week - b.week || (a.urgency === "High" ? -1 : 1)).slice(0, 6);
  const overdue = data.tasks.filter((t) => taskStatus(t, ga.weeks) === "Overdue").length;
  const apptDate = (a: (typeof data.appointments)[number]) => (a.dateOverride ? parseDate(a.dateOverride) : dateOfWeek(a.week));
  const nextAppt = [...data.appointments].filter((a) => !a.done && apptDate(a) >= today).sort((a, b) => +apptDate(a) - +apptDate(b))[0];
  const est = data.budget.reduce((s, b) => s + b.estimated, 0);
  const act = data.budget.reduce((s, b) => s + (b.actual ?? 0), 0);
  const setupDone = data.checklists.filter((c) => c.done).length + data.nursery.filter((n) => n.done).length;
  const setupTotal = data.checklists.length + data.nursery.length;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-rose-100 to-[var(--surface-card)]">
        <div className="flex flex-wrap gap-6 items-center justify-between">
          <div>
            <div className="th">Gestational age</div>
            {ga.totalDays >= 0 ? (
              <div className="text-4xl font-bold text-rose-700 mt-1">{ga.weeks}<span className="text-xl font-semibold">w</span> {ga.days}<span className="text-xl font-semibold">d</span></div>
            ) : (
              <div className="text-xl font-bold text-rose-700 mt-1">Starts in {-ga.totalDays} days</div>
            )}
            <div className="text-sm text-gray-600 mt-1">{trimesterLabel(ga)}</div>
          </div>
          <div>
            <div className="th">Estimated due date</div>
            <div className="text-2xl font-bold mt-1">{formatLong(edd)}</div>
            <div className="text-sm text-gray-600 mt-1">LMP {formatLong(lmp)} + 280 days</div>
          </div>
          <div>
            <div className="th">Countdown</div>
            <div className="text-2xl font-bold mt-1">{daysToGo >= 0 ? `${daysToGo} days` : `${-daysToGo} days past EDD`}</div>
            {daysToGo >= 0 && <div className="text-sm text-gray-600 mt-1">{Math.floor(daysToGo / 7)} weeks {daysToGo % 7} days to go</div>}
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Week 0</span><span>{Math.round(progress * 100)}% complete</span><span>Week 40</span></div>
          <ProgressBar value={progress} className="!h-3" />
          <div className="relative h-4 text-[10px] text-gray-400 mt-1">
            <span className="absolute" style={{ left: "32.5%" }}>T2 starts</span><span className="absolute" style={{ left: "67.5%" }}>T3 starts</span>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-5">
          <div className="th">This week&apos;s highlight</div>
          <div className="text-lg font-bold mt-2">Week {highlight.week}</div>
          <div className="text-3xl mt-1" aria-hidden>{highlight.emoji}</div>
          <p className="text-sm mt-1">Baby is about the size of a <b>{highlight.size}</b>.</p>
          <p className="text-sm text-gray-600 mt-2">{highlight.note}</p>
        </Card>
        <Card className="p-5 md:col-span-2">
          <div className="flex justify-between items-center"><div className="th">Up next (to-do)</div><Link href="/todo" className="text-sm text-rose-700 font-semibold">All tasks →</Link></div>
          <ul className="mt-3 divide-y divide-rose-100">
            {upNext.map((t) => (
              <li key={t.id} className="py-2 flex items-center gap-3">
                <input type="checkbox" checked={t.done} onChange={(e) => update("tasks", t.id, { done: e.target.checked })} aria-label={`Done: ${t.title}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-gray-500">{formatLong(dateOfWeek(t.week))} · Week {t.week}</div>
                </div>
                <CategoryChip value={t.category} />
                <StatusChip value={taskStatus(t, ga.weeks)} />
              </li>
            ))}
            {!upNext.length && <li className="py-4 text-sm text-gray-500">Nothing pending 🎉</li>}
          </ul>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5"><div className="th">Tasks done</div><div className="text-2xl font-bold mt-1">{data.tasks.filter((t) => t.done).length} / {data.tasks.length}</div><div className="mt-1"><Chip tone="brass">{overdue} overdue</Chip></div></Card>
        <Card className="p-5"><div className="th">Next appointment</div>
          {nextAppt ? <><div className="font-bold mt-1">{nextAppt.title}</div><div className="text-sm text-gray-600">{formatLong(apptDate(nextAppt))}</div></> : <div className="text-sm text-gray-500 mt-1">None scheduled</div>}
        </Card>
        <Card className="p-5"><div className="th">Budget</div><div className="text-2xl font-bold mt-1">{money(act)}</div><div className="text-xs text-gray-500">spent of {money(est)} estimated</div></Card>
        <Card className="p-5"><div className="th">Packed / set up</div><div className="text-2xl font-bold mt-1">{setupDone} / {setupTotal}</div>
          <ProgressBar value={setupTotal ? setupDone / setupTotal : 0} tone="bg-brass-400" className="!h-1.5 mt-2" /><div className="text-xs text-gray-500 mt-1">nursery + hospital bag</div></Card>
      </div>
      {profile.notes && <Card className="p-4 text-sm text-gray-600">📝 {profile.notes}</Card>}
    </div>
  );
}
