"use client";
import { motion, useReducedMotion } from "motion/react";
import StreetPhotos from "@/components/photos/StreetPhotos";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CityGallery from "@/components/photos/CityGallery";
import { ArrowUpRight, Close } from "@/components/ui/Icons";
import { SeverityMeter } from "@/components/ui/Severity";
import type { CityReport, CityReportDetail, Mission } from "@/lib/data/types";
import { ago, daysAgo, distance } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { plural, type Key } from "@/lib/i18n";

const SHELL = "absolute inset-x-0 bottom-0 z-[1100] flex max-h-[78%] flex-col overflow-hidden rounded-t-[28px] border border-line bg-card shadow-[0_-12px_40px_rgb(32_33_30/0.10)] md:inset-x-auto md:bottom-4 md:end-4 md:top-4 md:max-h-none md:w-[390px] md:rounded-[28px]";

export const streetViewUrl = (lat: number, lng: number) => `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

function Shell({ label, onClose, children, closeRef }: { label: string; onClose: () => void; children: React.ReactNode; closeRef?: React.RefObject<HTMLButtonElement | null> }) {
  const reduce = useReducedMotion();
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.aside role="dialog" aria-label={label} className={SHELL}
      initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <button ref={closeRef} onClick={onClose} aria-label={t("common.close")} className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-paper/90 backdrop-blur"><Close /></button>
      <div className="overflow-y-auto" data-lenis-prevent>{children}</div>
    </motion.aside>
  );
}

// One 311 report: its photos (from as many riders as have been there), what the camera makes of it, and what to do next.
export function CitySheet({ report, onClose, onGo, onPlan, planning }: { report: CityReport; onClose: () => void; onGo: () => void; onPlan: () => void; planning: boolean }) {
  const { t, lang } = useI18n();
  const [detail, setDetail] = useState<CityReportDetail | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeBtn.current?.focus({ preventScroll: true }); }, [report.id]);
  useEffect(() => {
    let alive = true;
    fetch(`/api/spots/${report.id}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive) setDetail(d as CityReportDetail | null); }).catch(() => {});
    return () => { alive = false; setDetail(null); };
  }, [report.id]);

  const photos = detail?.photos ?? [];
  const has = report.photoCount > 0;
  return (
    <Shell label={`${t("city.eyebrow")}: ${report.place}`} onClose={onClose} closeRef={closeBtn}>
      {has ? (
        photos.length > 0 ? <CityGallery photos={photos} place={report.place} /> : (report.cover && <img src={report.cover} alt="" className="h-44 w-full object-cover md:h-52" />)
      ) : (
        <div className="grid h-36 place-items-center border-b border-dashed border-line bg-paper text-center text-sm text-muted">
          <span className="px-8">{t("spot.noPhotos")}</span>
        </div>
      )}
      <div className="space-y-4 p-5">
        <div>
          <p className="eyebrow">{has ? plural(t, "city.eyebrowPhotos", report.photoCount) : t("city.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-medium tracking-tight">{report.place}</h2>
          <p className="text-sm text-muted">{t("city.meta", { borough: report.borough, when: ago(report.createdAt, lang), status: report.status.toLowerCase() })}</p>
        </div>
        {has && (
          <div className="space-y-2">
            <SeverityMeter value={report.severity} />
            <p className="text-sm text-muted">{[report.kind ? t(`hazard.${report.kind}` as Key) : null, report.size ? t(`size.${report.size}` as Key) : null, report.lane].filter(Boolean).join(" · ")}</p>
          </div>
        )}
        <p className="text-sm text-muted">{has ? t("city.bodyPhotos") : t("city.body")}</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={onGo} className="pill pill-ink">{t("city.photograph")}</button>
          {report.photoCount > 0
            ? <Link href={`/spots/${report.id}`} className="pill pill-line">{t("city.allPhotos")} <ArrowUpRight /></Link>
            : <span className="inline-flex min-h-11 items-center px-2 text-sm text-muted">{t("city.noPhotosYet")}</span>}
        </div>
        <div className="flex flex-wrap gap-x-5 text-sm">
          <button onClick={onPlan} disabled={planning} className="tap underline underline-offset-4 disabled:opacity-60">{planning ? t("map.finding") : t("city.plan")}</button>
          <a href={streetViewUrl(report.lat, report.lng)} target="_blank" rel="noopener noreferrer" className="tap underline underline-offset-4">{t("city.streetView")}</a>
        </div>
        <StreetPhotos spotId={report.id} compact />
        <p className="text-xs text-muted">{t("city.source", { days: daysAgo(report.createdAt) })}</p>
      </div>
    </Shell>
  );
}

// The suggested route: a handful of nearby 311 spots to photograph, in riding order.
export function MissionSheet({ mission, onClose, onStart }: { mission: Mission; onClose: () => void; onStart: () => void }) {
  const { t, lang } = useI18n();
  return (
    <Shell label={t("mission.eyebrow")} onClose={onClose}>
      <div className="p-5">
        <p className="eyebrow">{t("mission.eyebrow")}</p>
        <h2 className="mt-1 pe-10 text-xl font-medium tracking-tight">{plural(t, "mission.title", mission.stops.length, { distance: distance(mission.distanceM) })}</h2>
        <p className="text-sm text-muted">{mission.routed ? t("mission.routed") : t("mission.straight")}</p>
        <ol className="mt-4 divide-y divide-line">
          {mission.stops.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <span className="stop shrink-0" aria-hidden>{i + 1}</span>
              <span className="min-w-0"><span className="block truncate font-medium">{s.place}</span><span className="block text-sm text-muted">{t("mission.stopMeta", { borough: s.borough, when: ago(s.createdAt, lang) })} · {plural(t, "mission.photos", s.photoCount)}</span></span>
            </li>
          ))}
        </ol>
        <button onClick={onStart} className="pill pill-ink mt-5 w-full">{t("mission.start")} <ArrowUpRight /></button>
        <p className="mt-3 text-xs text-muted">{t("mission.note")}</p>
      </div>
    </Shell>
  );
}
