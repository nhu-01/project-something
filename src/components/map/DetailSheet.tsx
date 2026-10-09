"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import FrameArt from "@/components/potholes/FrameArt";
import Timeline from "@/components/potholes/Timeline";
import { Close, ArrowUpRight } from "@/components/ui/Icons";
import { SeverityMeter, StatusChip } from "@/components/ui/Severity";
import type { Pothole } from "@/lib/data/types";
import { ago, cap } from "@/lib/format";
import { HAZARD_LABEL } from "@/lib/tokens";

// Floating card on desktop, bottom sheet on phones. Esc closes; focus moves in on open.
export default function DetailSheet({ pothole, onClose }: { pothole: Pothole | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (pothole) closeBtn.current?.focus({ preventScroll: true }); }, [pothole]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {pothole && (
        <motion.aside
          key={pothole.id}
          role="dialog" aria-label={`pothole on ${pothole.street}`}
          initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : 24 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 bottom-0 z-[1100] flex max-h-[78%] flex-col overflow-hidden rounded-t-[28px] border border-line bg-card shadow-[0_-12px_40px_rgb(32_33_30/0.10)] md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-none md:w-[390px] md:rounded-[28px]"
        >
          <div className="relative">
            <FrameArt pothole={pothole} className="h-44 w-full object-cover md:h-52" />
            <button ref={closeBtn} onClick={onClose} aria-label="close details" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-paper/90 backdrop-blur"><Close /></button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5" data-lenis-prevent>
            <div>
              <h2 className="text-xl font-medium tracking-tight">{pothole.street}</h2>
              <p className="text-sm">{HAZARD_LABEL[pothole.kind]}</p>
              <p className="text-sm text-muted">{pothole.borough} · {pothole.direction} · {pothole.lane}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3"><StatusChip status={pothole.status} /><span className="text-sm text-muted">last seen {ago(pothole.lastSeen)}</span></div>
            <SeverityMeter value={pothole.severity} />
            <dl className="grid grid-cols-3 gap-2 text-sm">
              {([["size", cap(pothole.size)], ["passes", String(pothole.sightings.length)], ["first seen", ago(pothole.firstSeen)]] as const).map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-paper p-3"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            <div>
              <h3 className="mb-3 text-sm text-muted">latest passes</h3>
              <Timeline sightings={pothole.sightings.slice(-3)} />
            </div>
            <Link href={`/potholes/${pothole.id}`} className="pill pill-line w-full">full history <ArrowUpRight /></Link>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
