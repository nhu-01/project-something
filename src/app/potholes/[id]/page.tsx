import Link from "next/link";
import { notFound } from "next/navigation";
import FrameArt from "@/components/potholes/FrameArt";
import Timeline from "@/components/potholes/Timeline";
import Reveal from "@/components/ui/Reveal";
import { SeverityMeter, StatusChip } from "@/components/ui/Severity";
import { getPothole } from "@/lib/data";
import { ago, cap, daysAgo } from "@/lib/format";
import { HAZARD_LABEL } from "@/lib/tokens";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPothole(id);
  return { title: p ? `${p.street} · spotholes` : "pothole · spotholes" };
}

export default async function PotholePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPothole(id);
  if (!p) notFound();
  const facts: [string, string][] = [
    ["type", HAZARD_LABEL[p.kind]], ["street", `${p.street}, ${p.borough}`], ["direction", p.direction], ["position in road", p.lane], ["size (estimate)", cap(p.size)],
    ["first seen", ago(p.firstSeen)], ["last seen", ago(p.lastSeen)], ["rider passes", String(p.sightings.length)], ["open for", p.status === "repaired" ? "no longer open" : `${daysAgo(p.firstSeen)} days`],
  ];
  return (
    <div className="wrap pt-8 sm:pt-12">
      <Link href="/map" className="text-sm text-muted transition-colors hover:text-ink">← back to the map</Link>
      <div className="mt-6 grid gap-8 md:grid-cols-[1.1fr_1fr]">
        <Reveal><div className="card overflow-hidden"><FrameArt pothole={p} className="aspect-[5/3] w-full object-cover" /></div></Reveal>
        <Reveal delay={0.08} className="space-y-5">
          <div className="flex flex-wrap items-center gap-3"><StatusChip status={p.status} /></div>
          <h1 className="h2">{p.street}</h1>
          <SeverityMeter value={p.severity} />
          <dl className="card divide-y divide-line text-[15px]">
            {facts.map(([k, v]) => (<div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>))}
          </dl>
          <p className="text-sm text-muted">severity and size are ai estimates from rider cameras, not official city grades. spotholes does not file 311 reports; <a className="underline underline-offset-4" href="https://portal.311.nyc.gov/">report it to 311</a>.</p>
        </Reveal>
      </div>
      <section className="mt-16" aria-labelledby="history">
        <Reveal><h2 id="history" className="h2">history</h2><p className="mt-2 text-muted">every rider pass, newest first.</p></Reveal>
        <Reveal delay={0.05} className="card mt-6 max-w-2xl p-7"><Timeline sightings={p.sightings} /></Reveal>
      </section>
    </div>
  );
}
