import Link from "next/link";
import CountUp from "@/components/motion/CountUp";
import Bars from "@/components/ui/Bars";
import Reveal from "@/components/ui/Reveal";
import { getPotholes, getStats } from "@/lib/data";
import { ago } from "@/lib/format";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "progress · spotholes" };
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const [stats, potholes, { t, lang }] = await Promise.all([getStats(), getPotholes(), getT()]);
  const recentlyRepaired = potholes.filter((p) => p.status === "repaired").sort((a, b) => +new Date(b.lastSeen) - +new Date(a.lastSeen)).slice(0, 5);
  const cards: [string, number, number][] = [
    [t("progress.tracked"), stats.tracked, 0], [t("progress.open"), stats.open, 0], [t("progress.newWeek"), stats.newThisWeek, 0], [t("progress.repairedWeek"), stats.repairedThisWeek, 0],
    [t("progress.miles"), stats.milesRidden < 10 ? stats.milesRidden : Math.round(stats.milesRidden), stats.milesRidden < 10 ? 1 : 0],
  ];
  return (
    <div className="wrap pt-10 sm:pt-16">
      <Reveal>
        <p className="eyebrow">{t("progress.eyebrow")}</p>
        <h1 className="h2 mt-2 max-w-[20ch]">{t("progress.title")}</h1>
      </Reveal>
      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-5">
        {cards.map(([k, v, d], i) => (<Reveal key={k} delay={i * 0.05} className="bg-card p-6"><dd className="text-4xl font-medium tracking-tight"><CountUp value={v} decimals={d} /></dd><dt className="mt-1 text-sm text-muted">{k}</dt></Reveal>))}
      </dl>
      <Reveal delay={0.05} className="card mt-6 p-6 sm:p-8"><h2 className="mb-4 text-lg font-medium">{t("progress.last14")}</h2><Bars data={stats.daily} t={t} /></Reveal>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Reveal className="card p-6 sm:p-8">
          <h2 className="text-lg font-medium">{t("progress.watch")}</h2>
          <ul className="mt-4 divide-y divide-line">
            {stats.worstStreets.length === 0 && <li className="py-3 text-muted">{t("progress.nothing")}</li>}
            {stats.worstStreets.map((s) => (
              <li key={s.street} className="flex items-center justify-between gap-4 py-3">
                <div><p className="font-medium">{s.street}</p><p className="text-sm text-muted">{t("progress.streetMeta", { borough: s.borough, n: s.open })}</p></div>
                <span className="text-sm text-muted">{t("progress.avg", { n: s.avgSeverity.toFixed(1) })}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.06} className="card p-6 sm:p-8">
          <h2 className="text-lg font-medium">{t("progress.recent")}</h2>
          <ul className="mt-4 divide-y divide-line">
            {recentlyRepaired.length === 0 && <li className="py-3 text-muted">{t("progress.nothing")}</li>}
            {recentlyRepaired.map((p) => (
              <li key={p.id}><Link href={`/potholes/${p.id}`} className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-repaired"><span><span className="font-medium">{p.street}</span><span className="block text-sm text-muted">{p.borough}</span></span><span className="text-sm text-muted">{ago(p.lastSeen, lang)}</span></Link></li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
