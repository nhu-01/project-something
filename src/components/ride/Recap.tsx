"use client";
import Link from "next/link";
import { useState } from "react";
import ShotViewer, { type Shot } from "./ShotViewer";
import Reveal from "@/components/ui/Reveal";
import { ArrowUpRight } from "@/components/ui/Icons";
import { distance } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { plural, type Key } from "@/lib/i18n";
import type { RideEvent } from "./types";

export default function Recap({ events, seconds, meters, onAgain }: { events: RideEvent[]; seconds: number; meters: number; onAgain: () => void }) {
  const { t } = useI18n();
  const count = (k: RideEvent["kind"]) => events.filter((e) => e.kind === k).length;
  const kindLabel = (k: RideEvent["kind"]) => t(`kind.${k}` as Key);
  const [viewing, setViewing] = useState<number | null>(null);
  const withShot = events.filter((e) => e.shot);
  const shots: Shot[] = withShot.map((e) => ({ src: e.shot!, aspect: e.shotAspect ?? 0.5625, label: `${t(`hazard.${e.hazard}` as Key)} · ${e.street} · ${kindLabel(e.kind)}` }));
  const stats: [string, string][] = [
    [t("recap.time"), seconds < 90 ? t("recap.seconds", { n: seconds }) : t("recap.minutes", { n: Math.round(seconds / 60) })],
    [t("recap.distance"), distance(meters, 2)], [t("recap.new"), String(count("new"))], [t("recap.confirmed"), String(count("confirmed"))],
  ];
  return (
    <div className="wrap py-12">
      <div className="mx-auto max-w-xl">
        <Reveal>
          <p className="eyebrow">{t("recap.eyebrow")}</p>
          <h1 className="h2 mt-2">{events.length ? plural(t, "recap.titleHelped", events.length) : t("recap.titleSmooth")}</h1>
          <p className="mt-3 text-muted">{events.length ? `${t("recap.summary", { new: count("new"), confirmed: count("confirmed"), repaired: count("repaired") })}${shots.length ? ` ${t("recap.tap")}` : ""}` : t("recap.nothing")}</p>
          {meters < 80 && <p className="mt-2 text-sm text-muted">{t("recap.tooShort")}</p>}
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
                  {e.shot && (
                    <button type="button" onClick={() => setViewing(withShot.indexOf(e))} aria-label={`${t("recap.viewPhoto")}: ${t(`hazard.${e.hazard}` as Key)} · ${e.street}`}
                      className="h-16 shrink-0 cursor-zoom-in overflow-hidden rounded-2xl border border-line transition-transform hover:scale-105" style={{ aspectRatio: e.shotAspect ?? 0.5625 }}>
                      <img src={e.shot} alt="" className="h-full w-full object-cover" />
                    </button>
                  )}
                  <div className="min-w-0 flex-1"><p className="font-medium">{t(`hazard.${e.hazard}` as Key)} · {e.street}</p><p className="text-sm text-muted">{e.lane}{e.severity ? ` · ${t(`sev.${e.severity}` as Key)}` : ""}</p></div>
                  <span className="rounded-full border border-line px-3 py-1 text-sm">{kindLabel(e.kind)}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
        {viewing !== null && shots[viewing] && <ShotViewer shots={shots} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/map" className="pill pill-ink">{t("recap.seeMap")} <ArrowUpRight /></Link>
          <button onClick={onAgain} className="pill pill-line">{t("recap.again")}</button>
        </div>
      </div>
    </div>
  );
}
