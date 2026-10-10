import Link from "next/link";
import { notFound } from "next/navigation";
import FrameArt from "@/components/potholes/FrameArt";
import Timeline from "@/components/potholes/Timeline";
import Reveal from "@/components/ui/Reveal";
import { SeverityMeter, StatusChip } from "@/components/ui/Severity";
import { getPothole } from "@/lib/data";
import { ago, daysAgo } from "@/lib/format";
import type { Key } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPothole(id);
  return { title: p ? `${p.street} · spotholes` : "spotholes" };
}

export default async function PotholePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, { t, lang }] = await Promise.all([getPothole(id), getT()]);
  if (!p) notFound();
  const facts: [string, string][] = [
    [t("pothole.type"), t(`hazard.${p.kind}` as Key)], [t("pothole.street"), `${p.street}, ${p.borough}`], [t("pothole.direction"), p.direction], [t("pothole.position"), p.lane],
    [t("pothole.sizeEstimate"), t(`size.${p.size}` as Key)], [t("pothole.firstSeen"), ago(p.firstSeen, lang)], [t("pothole.lastSeen"), ago(p.lastSeen, lang)],
    [t("pothole.passes"), String(p.sightings.length)], [t("pothole.openFor"), p.status === "repaired" ? t("pothole.noLongerOpen") : t("pothole.days", { n: daysAgo(p.firstSeen) })],
  ];
  return (
    <div className="wrap pt-8 sm:pt-12">
      <Link href="/map" className="text-sm text-muted transition-colors hover:text-ink">{t("pothole.back")}</Link>
      <div className="mt-6 grid gap-8 md:grid-cols-[1.1fr_1fr]">
        <Reveal><div className="card overflow-hidden"><FrameArt pothole={p} className="max-h-[70vh] w-full object-cover" /></div></Reveal>
        <Reveal delay={0.08} className="space-y-5">
          <div className="flex flex-wrap items-center gap-3"><StatusChip status={p.status} /></div>
          <h1 className="h2">{p.street}</h1>
          <SeverityMeter value={p.severity} />
          <dl className="card divide-y divide-line text-[15px]">
            {facts.map(([k, v]) => (<div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="text-muted">{k}</dt><dd className="text-end font-medium">{v}</dd></div>))}
          </dl>
          <p className="text-sm text-muted">{t("pothole.disclaimer")} <a className="underline underline-offset-4" href="https://portal.311.nyc.gov/">{t("pothole.report311")}</a>.</p>
        </Reveal>
      </div>
      <section className="mt-16" aria-labelledby="history">
        <Reveal><h2 id="history" className="h2">{t("pothole.history")}</h2><p className="mt-2 text-muted">{t("pothole.historySub")}</p></Reveal>
        <Reveal delay={0.05} className="card mt-6 max-w-2xl p-7"><Timeline sightings={p.sightings} /></Reveal>
      </section>
    </div>
  );
}
