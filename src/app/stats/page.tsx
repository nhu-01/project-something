import Link from "next/link";
import Bars from "@/components/ui/Bars";
import Reveal from "@/components/ui/Reveal";
import { getPotholes, getStats, IS_SAMPLE_DATA } from "@/lib/data";
import { ago } from "@/lib/format";

export const metadata = { title: "progress · spotholes" };

export default async function StatsPage() {
  const [stats, potholes] = await Promise.all([getStats(), getPotholes()]);
  const recentlyRepaired = potholes.filter((p) => p.status === "repaired").sort((a, b) => +new Date(b.lastSeen) - +new Date(a.lastSeen)).slice(0, 5);
  const cards: [string, number][] = [["tracked", stats.tracked], ["open", stats.open], ["new this week", stats.newThisWeek], ["repaired this week", stats.repairedThisWeek]];
  return (
    <div className="wrap pt-10 sm:pt-16">
      <Reveal>
        <p className="eyebrow">progress{IS_SAMPLE_DATA ? " · sample data" : ""}</p>
        <h1 className="h2 mt-2 max-w-[20ch]">how the city&apos;s roads are doing.</h1>
      </Reveal>
      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
        {cards.map(([k, v], i) => (<Reveal key={k} delay={i * 0.05} className="bg-card p-6"><dd className="text-4xl font-medium tracking-tight">{v}</dd><dt className="mt-1 text-sm text-muted">{k}</dt></Reveal>))}
      </dl>
      <Reveal delay={0.05} className="card mt-6 p-6 sm:p-8"><h2 className="mb-4 text-lg font-medium">last 14 days</h2><Bars data={stats.daily} /></Reveal>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Reveal className="card p-6 sm:p-8">
          <h2 className="text-lg font-medium">streets to watch</h2>
          <ul className="mt-4 divide-y divide-line">
            {stats.worstStreets.map((s) => (
              <li key={s.street} className="flex items-center justify-between gap-4 py-3">
                <div><p className="font-medium">{s.street}</p><p className="text-sm text-muted">{s.borough} · {s.open} open</p></div>
                <span className="text-sm text-muted">avg severity {s.avgSeverity.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.06} className="card p-6 sm:p-8">
          <h2 className="text-lg font-medium">recently repaired</h2>
          <ul className="mt-4 divide-y divide-line">
            {recentlyRepaired.length === 0 && <li className="py-3 text-muted">nothing yet.</li>}
            {recentlyRepaired.map((p) => (
              <li key={p.id}><Link href={`/potholes/${p.id}`} className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-moss"><span><span className="font-medium">{p.street}</span><span className="block text-sm text-muted">{p.borough}</span></span><span className="text-sm text-muted">{ago(p.lastSeen)}</span></Link></li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
