import Link from "next/link";
import CountUp from "@/components/motion/CountUp";
import Bars from "@/components/ui/Bars";
import Reveal from "@/components/ui/Reveal";
import { getStats } from "@/lib/data";
import { ago } from "@/lib/format";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "progress · spotholes" };
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const [stats, { t, lang }] = await Promise.all([getStats(), getT()]);
  const cards: [string, number][] = [
    [t("progress.spots"), stats.citySpots], [t("progress.photographed"), stats.cityPhotographed], [t("progress.photos"), stats.cityPhotos],
    [t("progress.riderReports"), stats.tracked], [t("stats.strip.riders"), stats.ridesThisWeek],
  ];
  return (
    <div className="wrap pt-10 sm:pt-16">
      <Reveal>
        <p className="eyebrow">{t("progress.eyebrow")}</p>
        <h1 className="h2 mt-2 max-w-[20ch]">{t("progress.title")}</h1>
      </Reveal>
      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-5">
        {cards.map(([k, v], i) => (<Reveal key={k} delay={i * 0.05} className="bg-card p-6"><dd className="text-4xl font-medium tracking-tight"><CountUp value={v} /></dd><dt className="mt-1 text-sm text-muted">{k}</dt></Reveal>))}
      </dl>
      <Reveal delay={0.05} className="card mt-6 p-6 sm:p-8"><h2 className="mb-4 text-lg font-medium">{t("progress.last14")}</h2><Bars data={stats.daily} t={t} /></Reveal>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Reveal className="card p-6 sm:p-8">
          <h2 className="text-lg font-medium">{t("progress.topSpots")}</h2>
          <ul className="mt-4 divide-y divide-line">
            {stats.topSpots.length === 0 && <li className="py-3 text-muted">{t("progress.nothing")}</li>}
            {stats.topSpots.map((s) => (
              <li key={s.id}><Link href={`/spots/${s.id}`} className="tap flex w-full items-center justify-between gap-4 py-3 transition-colors hover:text-repaired"><span><span className="font-medium">{s.place}</span><span className="block text-sm text-muted">{s.borough}</span></span><span className="text-sm text-muted">{t("progress.photosN", { n: s.photos })}</span></Link></li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.06} className="card p-6 sm:p-8">
          <h2 className="text-lg font-medium">{t("progress.latest")}</h2>
          <ul className="mt-4 divide-y divide-line">
            {stats.latest.length === 0 && <li className="py-3 text-muted">{t("progress.nothing")}</li>}
            {stats.latest.map((s) => (
              <li key={s.id}><Link href={`/spots/${s.id}`} className="tap flex w-full items-center justify-between gap-4 py-3 transition-colors hover:text-repaired"><span><span className="font-medium">{s.place}</span><span className="block text-sm text-muted">{s.borough}</span></span><span className="text-sm text-muted">{ago(s.at, lang)}</span></Link></li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
