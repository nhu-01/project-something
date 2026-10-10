import CountUp from "@/components/motion/CountUp";
import Reveal from "@/components/ui/Reveal";
import type { Stats } from "@/lib/data/types";
import type { T } from "@/lib/i18n";

export default function StatsStrip({ stats, t }: { stats: Stats; t: T }) {
  const items: [string, number][] = [[t("stats.strip.tracked"), stats.tracked], [t("stats.strip.open"), stats.open], [t("stats.strip.rides"), stats.ridesThisWeek], [t("stats.strip.repaired"), stats.repairedThisWeek]];
  return (
    <section className="wrap mt-28" aria-label={t("nav.progress")}>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
        {items.map(([label, value], i) => (
          <Reveal key={label} delay={i * 0.06} className="bg-card p-6">
            <dd className="text-4xl font-medium tracking-tight"><CountUp value={value} /></dd>
            <dt className="mt-1 text-sm text-muted">{label}</dt>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
