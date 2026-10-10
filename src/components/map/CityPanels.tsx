"use client";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight, Close } from "@/components/ui/Icons";
import type { CityReport, Mission } from "@/lib/data/types";
import { ago, distance } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { plural } from "@/lib/i18n";

const SHELL = "absolute inset-x-0 bottom-0 z-[1100] flex max-h-[70%] flex-col overflow-hidden rounded-t-[28px] border border-line bg-card shadow-[0_-12px_40px_rgb(32_33_30/0.10)] md:inset-x-auto md:bottom-4 md:end-4 md:max-h-[80%] md:w-[390px] md:rounded-[28px]";

function Shell({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { t } = useI18n();
  return (
    <motion.aside role="dialog" aria-label={label} className={SHELL}
      initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <button onClick={onClose} aria-label={t("common.close")} className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-paper"><Close /></button>
      <div className="overflow-y-auto p-5">{children}</div>
    </motion.aside>
  );
}

// One 311 report that has no rider photo yet.
export function CitySheet({ report, onClose, onPlan, planning }: { report: CityReport; onClose: () => void; onPlan: () => void; planning: boolean }) {
  const { t, lang } = useI18n();
  return (
    <Shell label={`${t("city.eyebrow")}: ${report.place}`} onClose={onClose}>
      <p className="eyebrow">{t("city.eyebrow")}</p>
      <h2 className="mt-1 pe-10 text-xl font-medium tracking-tight">{report.place}</h2>
      <p className="text-sm text-muted">{t("city.meta", { borough: report.borough, when: ago(report.createdAt, lang), status: report.status.toLowerCase() })}</p>
      <p className="mt-4 text-[15px] text-muted">{t("city.body")}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onPlan} disabled={planning} className="pill pill-ink disabled:opacity-60">{planning ? t("map.finding") : t("city.plan")}</button>
        <Link href="/report" className="pill pill-line">{t("city.reportByPhoto")}</Link>
      </div>
      <p className="mt-4 text-xs text-muted">{t("city.source")}</p>
    </Shell>
  );
}

// The suggested route: a handful of nearby reports to photograph, in riding order.
export function MissionSheet({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  const { t, lang } = useI18n();
  return (
    <Shell label={t("mission.eyebrow")} onClose={onClose}>
      <p className="eyebrow">{t("mission.eyebrow")}</p>
      <h2 className="mt-1 pe-10 text-xl font-medium tracking-tight">{plural(t, "mission.title", mission.stops.length, { distance: distance(mission.distanceM) })}</h2>
      <p className="text-sm text-muted">{mission.routed ? t("mission.routed") : t("mission.straight")}</p>
      <ol className="mt-4 divide-y divide-line">
        {mission.stops.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 py-2.5">
            <span className="stop shrink-0" aria-hidden>{i + 1}</span>
            <span className="min-w-0"><span className="block truncate font-medium">{s.place}</span><span className="block text-sm text-muted">{t("mission.stopMeta", { borough: s.borough, when: ago(s.createdAt, lang) })}</span></span>
          </li>
        ))}
      </ol>
      <Link href="/ride" className="pill pill-ink mt-5 w-full">{t("mission.start")} <ArrowUpRight /></Link>
      <p className="mt-3 text-xs text-muted">{t("mission.note")}</p>
    </Shell>
  );
}
