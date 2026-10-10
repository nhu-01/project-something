"use client";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import FrameArt from "@/components/potholes/FrameArt";
import Timeline from "@/components/potholes/Timeline";
import { Close, ArrowUpRight } from "@/components/ui/Icons";
import { SeverityMeter, StatusChip } from "@/components/ui/Severity";
import type { Pothole } from "@/lib/data/types";
import { ago } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";

// Floating card on desktop, bottom sheet on phones. Esc closes; focus moves in on open.
// Pull the details down (or tap the photo or the handle) to give the photo most of the sheet; pull up to bring them back.
export default function DetailSheet({ pothole, onClose }: { pothole: Pothole | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const { t, lang } = useI18n();
  const closeBtn = useRef<HTMLButtonElement>(null);
  // remembered per hazard, so opening a different pin starts with the details showing
  const [bigFor, setBigFor] = useState<string | null>(null);
  const big = Boolean(pothole) && bigFor === pothole?.id;
  const setBig = (on: boolean) => setBigFor(on && pothole ? pothole.id : null);

  useEffect(() => { if (pothole) closeBtn.current?.focus({ preventScroll: true }); }, [pothole]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 36 || info.velocity.y > 350) setBig(true);
    else if (info.offset.y < -36 || info.velocity.y < -350) setBig(false);
  };

  return (
    <AnimatePresence>
      {pothole && (
        <motion.aside
          key={pothole.id}
          role="dialog" aria-label={`${t(`hazard.${pothole.kind}` as Key)} · ${pothole.street}`}
          initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : 24 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 bottom-0 z-[1100] flex max-h-[82%] flex-col overflow-hidden rounded-t-[28px] border border-line bg-card shadow-[0_-12px_40px_rgb(32_33_30/0.10)] md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-none md:w-[390px] md:rounded-[28px]"
        >
          <div className={`relative shrink-0 bg-ink transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${big ? "h-[54dvh] md:h-[62%]" : "h-44 md:h-52"}`}>
            <button type="button" onClick={() => setBig(!big)} aria-label={big ? t("sheet.showDetails") : t("sheet.biggerPhoto")} className="block h-full w-full cursor-zoom-in">
              <FrameArt pothole={pothole} className={`h-full w-full ${big ? "object-contain" : "object-cover"}`} />
            </button>
            <button ref={closeBtn} onClick={onClose} aria-label={t("common.close")} className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-paper/90 backdrop-blur"><Close /></button>
          </div>

          {/* the grab area: drag it down for a bigger photo, up for the details */}
          <motion.div
            drag={reduce ? false : "y"} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.4} dragSnapToOrigin onDragEnd={onDragEnd}
            className="shrink-0 cursor-grab touch-none px-5 pb-3 pt-1 active:cursor-grabbing"
          >
            <button type="button" onClick={() => setBig(!big)} aria-expanded={!big} aria-label={big ? t("sheet.showDetails") : t("sheet.pullDown")} className="mx-auto flex h-7 w-24 items-center justify-center">
              <span className="h-1.5 w-11 rounded-full bg-line" aria-hidden />
            </button>
            <h2 className="text-xl font-medium tracking-tight">{pothole.street}</h2>
            <p className="text-sm">{t(`hazard.${pothole.kind}` as Key)}</p>
            <p className="text-sm text-muted">{pothole.borough} · {pothole.direction} · {pothole.lane}</p>
            {big && <p className="mt-2 text-xs text-muted">{t("sheet.pullUp")}</p>}
          </motion.div>

          {!big && (
            <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-5" data-lenis-prevent>
              <div className="flex flex-wrap items-center gap-3"><StatusChip status={pothole.status} /><span className="text-sm text-muted">{t("sheet.lastSeen", { when: ago(pothole.lastSeen, lang) })}</span></div>
              <SeverityMeter value={pothole.severity} />
              <dl className="grid grid-cols-3 gap-2 text-sm">
                {([[t("sheet.size"), t(`size.${pothole.size}` as Key)], [t("sheet.passes"), String(pothole.sightings.length)], [t("sheet.firstSeen"), ago(pothole.firstSeen, lang)]] as const).map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-paper p-3"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
              <div>
                <h3 className="mb-3 text-sm text-muted">{t("sheet.latest")}</h3>
                <Timeline sightings={pothole.sightings.slice(-3)} />
              </div>
              <Link href={`/potholes/${pothole.id}`} className="pill pill-line w-full">{t("common.fullHistory")} <ArrowUpRight /></Link>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
