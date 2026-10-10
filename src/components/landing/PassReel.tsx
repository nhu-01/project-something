"use client";
import { motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Timeline from "@/components/potholes/Timeline";
import { SeverityMeter, StatusChip } from "@/components/ui/Severity";
import type { Pothole } from "@/lib/data/types";
import { fmtDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import type { Key, T } from "@/lib/i18n";

type Slide = { key: string; src: string; pothole: Pothole; sightingId?: string; caption: string };

// Every kept camera frame becomes a print in a stack. The top print shuffles to the back every few seconds, and the
// details and timeline beside it follow whichever print is on top.
function toSlides(potholes: Pothole[], t: T, lang: string): Slide[] {
  const seen = new Set<string>();
  const out: Slide[] = [];
  for (const p of potholes) {
    const passes = p.sightings.filter((s) => s.photo);
    for (const s of passes) {
      if (seen.has(s.photo!)) continue;
      seen.add(s.photo!);
      out.push({ key: `${p.id}-${s.id}`, src: s.photo!, pothole: p, sightingId: s.id, caption: `${t(`kind.${s.kind}` as Key)} · ${fmtDate(s.at, lang)}` });
    }
    if (!passes.length && p.photo && !seen.has(p.photo)) { seen.add(p.photo); out.push({ key: p.id, src: p.photo, pothole: p, caption: t("reel.fromCamera") }); }
  }
  return out.slice(0, 8);
}

// where a print sits in the stack, by how far it is from the top
const POSE = [
  { y: 0, scale: 1, rotate: 0, opacity: 1 },
  { y: 16, scale: 0.94, rotate: -4, opacity: 1 },
  { y: 30, scale: 0.88, rotate: 4, opacity: 1 },
];
const HIDDEN = { y: 40, scale: 0.84, rotate: 0, opacity: 0 };

export default function PassReel({ potholes }: { potholes: Pothole[] }) {
  const { t, lang } = useI18n();
  const slides = useMemo(() => toSlides(potholes, t, lang), [potholes, t, lang]);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-80px" });
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false); // paused while the visitor is hovering, focusing or pressing
  const n = slides.length;

  useEffect(() => {
    if (reduce || held || !inView || n < 2) return;
    // restarted whenever the top print changes, so a manual tap gets a full beat before the next shuffle
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      if (document.hidden) { t = setTimeout(step, 1000); return; } // wait quietly while the tab is in the background
      setActive((i) => (i + 1) % n);
    };
    t = setTimeout(step, 3400);
    return () => clearTimeout(t);
  }, [reduce, held, inView, n, active]);

  if (n === 0) return null;
  const cur = slides[active % n];
  const p = cur.pothole;

  return (
    <div ref={ref} className="mt-10 grid items-start gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]"
      onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <div>
        <div className="relative mx-auto aspect-[9/14] w-full max-w-[330px]">
          {slides.map((s, i) => {
            const pos = (i - active + n) % n; // 0 is the top print
            const leaving = n > 1 && pos === n - 1; // the print that was just on top: it swings away, then tucks in at the back
            const pose = pos < POSE.length ? POSE[pos] : HIDDEN;
            return (
              <motion.button
                key={s.key} type="button" tabIndex={pos === 0 ? 0 : -1} aria-hidden={pos !== 0}
                onClick={() => setActive((v) => (v + 1) % n)}
                aria-label={`${t(`hazard.${s.pothole.kind}` as Key)} · ${s.pothole.street}${n > 1 ? `. ${t("reel.nextPhoto")}` : ""}`}
                className="absolute inset-0 overflow-hidden rounded-[28px] border-[5px] border-card bg-line shadow-[0_18px_44px_rgb(32_33_30/0.18)]"
                style={{ zIndex: n - pos, transformOrigin: "50% 100%" }}
                initial={false}
                animate={reduce ? { opacity: pos === 0 ? 1 : 0 } : leaving ? { x: ["0%", "62%", "0%"], rotate: [0, 14, 0], y: [0, -10, HIDDEN.y], scale: [1, 0.96, HIDDEN.scale], opacity: [1, 1, 0] } : { x: "0%", ...pose }}
                transition={reduce ? { duration: 0.4 } : leaving ? { duration: 0.85, times: [0, 0.45, 1], ease: [0.16, 1, 0.3, 1] } : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <img src={s.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute inset-x-3 bottom-3 rounded-full bg-paper/90 px-3 py-1.5 text-left text-[13px] text-ink backdrop-blur">{s.caption}</span>
              </motion.button>
            );
          })}
        </div>
        {n > 1 && (
          <div className="mt-10 flex justify-center" role="group" aria-label={t("reel.choose")}>
            {slides.map((s, i) => (
              <button key={s.key} type="button" onClick={() => setActive(i)} aria-label={t("reel.photoN", { n: i + 1 })} aria-current={i === active || undefined} className="grid h-11 w-11 place-items-center">
                <span className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-ink" : "w-2 bg-line"}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6 sm:p-7" aria-live="polite">
        <div className="flex flex-wrap items-center gap-3"><StatusChip status={p.status} /><span className="text-sm text-muted">{t(`hazard.${p.kind}` as Key)} · {p.street}{p.borough ? `, ${p.borough}` : ""}</span></div>
        <div className="mt-3"><SeverityMeter value={p.severity} /></div>
        <div className="mt-6"><Timeline sightings={p.sightings.slice(-4)} activeId={cur.sightingId} /></div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{t("reel.note")}</p>
          <Link href={`/potholes/${p.id}`} className="tap text-sm underline underline-offset-4">{t("common.fullHistory")}</Link>
        </div>
      </div>
    </div>
  );
}
