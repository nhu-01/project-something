"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Close, Camera, Navigate, Upload } from "@/components/ui/Icons";
import { useI18n } from "@/lib/i18n/client";
import { MISSION_KEY } from "./engine";

type Stop = { id: string; lat: number; lng: number; place: string };
const keep = (stops: Stop[]) => { try { if (stops.length) sessionStorage.setItem(MISSION_KEY, JSON.stringify(stops)); else sessionStorage.removeItem(MISSION_KEY); } catch { /* storage blocked */ } };

// Goes straight to the camera with one 311 spot as the target.
export function PhotographSpot({ spot, className, children }: { spot: Stop; className?: string; children: ReactNode }) {
  const router = useRouter();
  return <button type="button" className={className} onClick={() => { keep([spot]); router.push("/ride"); }}>{children}</button>;
}

// The "spot a pothole" button. It asks how: just film (open camera, ride), or route to the nearest reported
// potholes and film each one. Both end on the ride screen, which is a video camera.
export function SpotButton({ className, children }: { className?: string; children: ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const video = () => { keep([]); router.push("/ride"); };
  const manual = () => router.push("/submit");
  const route = () => {
    setBusy(true); setNote(null);
    if (!navigator.geolocation) { setBusy(false); setNote(t("map.noLocationSupport")); return; }
    navigator.geolocation.getCurrentPosition(async (p) => {
      try {
        const res = await fetch(`/api/mission?lat=${p.coords.latitude}&lng=${p.coords.longitude}`);
        const m = (await res.json()) as { stops?: Stop[] };
        if (!res.ok || !m.stops?.length) { setNote(t("map.noneNear")); return; }
        // one spot only: the best one for this person (closest, fewest photos)
        keep(m.stops.slice(0, 1).map(({ id, lat, lng, place }) => ({ id, lat, lng, place })));
        router.push("/ride");
      } catch { setNote(t("map.routeFailed")); }
      finally { setBusy(false); }
    }, () => { setBusy(false); setNote(t("map.locationOff")); }, { enableHighAccuracy: true, timeout: 12000 });
  };

  const option = "card flex w-full items-start gap-4 p-5 text-start transition-transform hover:-translate-y-0.5 disabled:opacity-60";
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[3500] grid place-items-end bg-ink/45 p-3 sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}>
            <motion.section role="dialog" aria-modal="true" aria-labelledby="spot-title" onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : 16 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-[28px] bg-paper p-5 text-ink shadow-[0_18px_60px_rgb(0_0_0/0.35)]">
              <div className="flex items-center justify-between gap-3">
                <h2 id="spot-title" className="text-xl font-medium tracking-tight">{t("spotpick.title")}</h2>
                <button type="button" onClick={() => setOpen(false)} aria-label={t("common.close")} className="grid h-11 w-11 place-items-center rounded-full border border-line"><Close /></button>
              </div>
              <div className="mt-4 space-y-3">
                <button ref={first} type="button" onClick={video} className={option}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper"><Camera /></span>
                  <span><span className="block text-[17px] font-medium">{t("spotpick.video")}</span><span className="mt-0.5 block text-sm text-muted">{t("spotpick.videoBody")}</span></span>
                </button>
                <button type="button" onClick={route} disabled={busy} className={option}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper"><Navigate /></span>
                  <span><span className="block text-[17px] font-medium">{busy ? t("spotpick.locating") : t("spotpick.route")}</span><span className="mt-0.5 block text-sm text-muted">{t("spotpick.routeBody")}</span></span>
                </button>
                <button type="button" onClick={manual} className={option}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper"><Upload /></span>
                  <span><span className="block text-[17px] font-medium">{t("spotpick.manual")}</span><span className="mt-0.5 block text-sm text-muted">{t("spotpick.manualBody")}</span></span>
                </button>
              </div>
              <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-muted">{note}</p>
              <p className="text-xs text-muted">{t("spotpick.safety")}</p>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
