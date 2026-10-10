"use client";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight, Close } from "@/components/ui/Icons";
import type { CityReport, Mission } from "@/lib/data/types";
import { ago } from "@/lib/format";

const SHELL = "absolute inset-x-0 bottom-0 z-[1100] flex max-h-[70%] flex-col overflow-hidden rounded-t-[28px] border border-line bg-card shadow-[0_-12px_40px_rgb(32_33_30/0.10)] md:inset-x-auto md:bottom-4 md:right-4 md:max-h-[80%] md:w-[390px] md:rounded-[28px]";
const dist = (m: number) => (m < 160 ? `${Math.round((m * 3.28084) / 10) * 10} ft` : `${(m / 1609.344).toFixed(1)} mi`);

function Shell({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.aside role="dialog" aria-label={label} className={SHELL}
      initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <button onClick={onClose} aria-label="close" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-paper"><Close /></button>
      <div className="overflow-y-auto p-5">{children}</div>
    </motion.aside>
  );
}

// One 311 report that has no rider photo yet.
export function CitySheet({ report, onClose, onPlan, planning }: { report: CityReport; onClose: () => void; onPlan: () => void; planning: boolean }) {
  return (
    <Shell label={`311 report at ${report.place}`} onClose={onClose}>
      <p className="eyebrow">reported to 311 · no photo yet</p>
      <h2 className="mt-1 pr-10 text-xl font-medium tracking-tight">{report.place}</h2>
      <p className="text-sm text-muted">{report.borough} · reported {ago(report.createdAt)} · city status: {report.status.toLowerCase()}</p>
      <p className="mt-4 text-[15px] text-muted">this comes from the city&apos;s public 311 records. nobody has photographed it with spotholes yet, so its size and severity are unknown.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onPlan} disabled={planning} className="pill pill-ink disabled:opacity-60">{planning ? "finding a route…" : "plan a photo route"}</button>
        <Link href="/report" className="pill pill-line">report by photo</Link>
      </div>
      <p className="mt-4 text-xs text-muted">source: nyc open data, 311 service requests.</p>
    </Shell>
  );
}

// The suggested route: a handful of nearby reports to photograph, in riding order.
export function MissionSheet({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  return (
    <Shell label="suggested photo route" onClose={onClose}>
      <p className="eyebrow">photo route</p>
      <h2 className="mt-1 pr-10 text-xl font-medium tracking-tight">{mission.stops.length} {mission.stops.length === 1 ? "stop" : "stops"} · {dist(mission.distanceM)}</h2>
      <p className="text-sm text-muted">{mission.routed ? "along a bike route from where you are" : "straight lines only (no bike route found), so treat it as a rough guide"}</p>
      <ol className="mt-4 divide-y divide-line">
        {mission.stops.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 py-2.5">
            <span className="stop shrink-0" aria-hidden>{i + 1}</span>
            <span className="min-w-0"><span className="block truncate font-medium">{s.place}</span><span className="block text-sm text-muted">{s.borough} · reported {ago(s.createdAt)}</span></span>
          </li>
        ))}
      </ol>
      <Link href="/ride" className="pill pill-ink mt-5 w-full">start a ride on this route <ArrowUpRight /></Link>
      <p className="mt-3 text-xs text-muted">ride it with the phone mounted: the camera does the photographing. highways, ramps and bridges are left out. follow traffic laws and your own judgment, not just this line.</p>
    </Shell>
  );
}
