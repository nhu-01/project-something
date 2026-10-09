import Reveal from "@/components/ui/Reveal";
import type { Stats } from "@/lib/data/types";

export default function StatsStrip({ stats }: { stats: Stats }) {
  const items: [string, number][] = [["potholes tracked", stats.tracked], ["open right now", stats.open], ["rides this week", stats.ridesThisWeek], ["repaired this week", stats.repairedThisWeek]];
  return (
    <section className="wrap mt-28" aria-label="progress at a glance">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
        {items.map(([label, value], i) => (
          <Reveal key={label} delay={i * 0.06} className="bg-card p-6">
            <dd className="text-4xl font-medium tracking-tight">{value}</dd>
            <dt className="mt-1 text-sm text-muted">{label}</dt>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
