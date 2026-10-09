"use client";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ArrowUpRight } from "@/components/ui/Icons";
import { HAZARD_LABEL, SEV_WORD } from "@/lib/tokens";
import type { RideEvent } from "./types";

const LABEL = { new: "new", confirmed: "confirmed", worse: "got worse", better: "looks better", repaired: "repaired" } as const;

const distance = (m: number) => (m < 160 ? `${Math.round((m * 3.28084) / 10) * 10} ft` : `${(m / 1609.344).toFixed(2)} mi`);

export default function Recap({ events, seconds, meters, onAgain }: { events: RideEvent[]; seconds: number; meters: number; onAgain: () => void }) {
  const count = (k: RideEvent["kind"]) => events.filter((e) => e.kind === k).length;
  const stats: [string, string][] = [["ride time", seconds < 90 ? `${seconds} sec` : `${Math.round(seconds / 60)} min`], ["distance tracked", distance(meters)], ["new hazards", String(count("new"))], ["confirmed", String(count("confirmed"))]];
  return (
    <div className="wrap py-12">
      <div className="mx-auto max-w-xl">
        <Reveal>
          <p className="eyebrow">ride complete</p>
          <h1 className="h2 mt-2">{events.length ? `you helped the next ${events.length === 1 ? "rider" : "riders"}.` : "a smooth one."}</h1>
          <p className="mt-3 text-muted">{events.length ? `${count("new")} new, ${count("confirmed")} confirmed${count("repaired") ? `, ${count("repaired")} looks repaired` : ""}. riders after you will be warned about these.` : "nothing logged on this ride. that's useful to know too."}</p>
          {meters < 80 && <p className="mt-2 text-sm text-muted">this ride was too short to draw on the map. move at least a block or two with location on.</p>}
        </Reveal>
        <Reveal delay={0.08}>
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-4">
            {stats.map(([k, v]) => (<div key={k} className="bg-card p-4"><dd className="text-2xl font-medium">{v}</dd><dt className="text-sm text-muted">{k}</dt></div>))}
          </dl>
        </Reveal>
        {events.length > 0 && (
          <Reveal delay={0.12}>
            <ul className="card mt-6 divide-y divide-line">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 p-4">
                  <div><p className="font-medium">{HAZARD_LABEL[e.hazard]} · {e.street}</p><p className="text-sm text-muted">{e.lane}{e.severity ? ` · ${SEV_WORD[e.severity]}` : ""}</p></div>
                  <span className="rounded-full border border-line px-3 py-1 text-sm">{LABEL[e.kind]}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/map" className="pill pill-ink">see them on the map <ArrowUpRight /></Link>
          <button onClick={onAgain} className="pill pill-line">ride again</button>
        </div>
      </div>
    </div>
  );
}
