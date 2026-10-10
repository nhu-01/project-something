"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Flashlight, Pause, Volume } from "@/components/ui/Icons";
import Snapshot from "./Snapshot";
import { SeverityBullet } from "@/components/ui/Bullet";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";
import { SEV_DARK_TEXT, SEV_VAR } from "@/lib/tokens";
import type { GpsState, RideEvent, Upcoming } from "./types";

function useElapsed(running: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => { if (!running) return; const t = setInterval(() => setS((v) => v + 1), 1000); return () => clearInterval(t); }, [running]);
  return s;
}

type Props = {
  gps: GpsState;
  online: boolean;
  upcoming: Upcoming | null;
  distance: number;
  last: RideEvent | null;
  events: RideEvent[];
  heading: string | null; // short note about where the rider said they're going
  notice: string | null;
  paused: boolean;
  voiceOn: boolean;
  torch: boolean | null; // null when this browser can't control the flashlight
  onToggleTorch: () => void;
  count: number;
  onTogglePause: () => void;
  onToggleVoice: () => void;
  onEnd: () => void;
};

export default function RideHud({ gps, online, upcoming, distance, last, events, heading, notice, paused, voiceOn, torch, onToggleTorch, count, onTogglePause, onToggleVoice, onEnd }: Props) {
  const reduce = useReducedMotion();
  const { t } = useI18n();
  const elapsed = useElapsed(!paused);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0"), ss = String(elapsed % 60).padStart(2, "0");
  const rise = { initial: { opacity: 0, y: reduce ? 0 : 28 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: reduce ? 0 : 16 }, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <div className="absolute inset-0">
      {/* quiet viewfinder corners, so it reads as a camera that is watching */}
      <div className="pointer-events-none absolute inset-[9%] rounded-[28px] border border-paper/25" aria-hidden />
      {last?.shot && <Snapshot key={last.id} src={last.shot} aspect={last.shotAspect ?? 0.5625} />}

      {/* every photo taken this ride stays here, newest on top (the full list is in the recap) */}
      <ul className="pointer-events-none absolute right-3 flex flex-col gap-2" style={{ top: "calc(env(safe-area-inset-top) + 84px)" }} aria-label={t("hud.photos")}>
        <AnimatePresence initial={false}>
          {[...events].reverse().filter((e) => e.shot).slice(0, 4).map((e) => (
            <motion.li key={e.id} layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : 1.45, ease: [0.16, 1, 0.3, 1], layout: { duration: 0.45, delay: reduce ? 0 : 1.45 } }}
              className="relative w-[58px] overflow-hidden rounded-[14px] border-2 border-paper shadow-[0_6px_18px_rgb(0_0_0/0.4)]" style={{ aspectRatio: e.shotAspect ?? 0.5625 }}>
              <img src={e.shot} alt={`${t(`hazard.${e.hazard}` as Key)} · ${e.street}`} className="h-full w-full object-cover" />
              {e.severity && <span className="absolute bottom-1 left-1 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold" style={{ background: SEV_VAR[e.severity], color: SEV_DARK_TEXT[e.severity] ? "var(--ink)" : "#fff" }} aria-hidden>{e.severity}</span>}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
        <div className="flex items-center gap-2 rounded-full bg-paper/90 px-4 py-2 text-sm text-ink backdrop-blur">
          <span className={`h-2 w-2 rounded-full bg-moss ${paused || reduce ? "" : "animate-pulse"}`} aria-hidden />
          {paused ? t("hud.paused") : !online ? t("hud.offline") : gps === "denied" ? t("hud.locationOff") : gps === "waiting" ? t("hud.findingGps") : t("hud.scanning")}
          <span className="text-muted" aria-hidden>{mm}:{ss}</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div key={count} initial={count > 0 && !reduce ? { scale: 1.25 } : false} animate={{ scale: 1 }} transition={{ delay: 1.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="rounded-full bg-paper/90 px-4 py-2 text-sm text-ink backdrop-blur">{t("hud.logged", { n: count })}</motion.div>
          {torch !== null && <button onClick={onToggleTorch} aria-pressed={torch} aria-label={torch ? t("hud.torchOff") : t("hud.torchOn")} className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur ${torch ? "bg-paper/90 text-ink" : "bg-paper/30 text-paper"}`}><Flashlight /></button>}
          <button onClick={onToggleVoice} aria-pressed={voiceOn} aria-label={voiceOn ? t("hud.mute") : t("hud.unmute")} className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur ${voiceOn ? "bg-paper/90 text-ink" : "bg-paper/30 text-paper"}`}><Volume /></button>
        </div>
      </div>

      {heading && <p className="absolute left-4 max-w-[62%] truncate rounded-full bg-paper/80 px-3 py-1.5 text-xs text-ink backdrop-blur" style={{ top: "calc(env(safe-area-inset-top) + 68px)" }}>{heading}</p>}

      {/* warning + result */}
      <div className="absolute inset-x-0 bottom-28 flex flex-col items-center gap-3 px-4" style={{ bottom: "calc(env(safe-area-inset-bottom) + 112px)" }}>
        <AnimatePresence mode="wait">
          {upcoming && !paused ? (
            <motion.div key={upcoming.id} {...rise} role="status" aria-live="assertive" className="w-full max-w-md rounded-[28px] bg-paper p-5 text-ink shadow-[0_18px_50px_rgb(0_0_0/0.35)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">{t("hud.aheadKnown", { hazard: t(`hazard.${upcoming.hazard}` as Key) })}</p>
                  <p className="mt-1 flex items-center gap-3 text-2xl font-medium tracking-tight"><SeverityBullet value={upcoming.severity} large />{upcoming.lane}</p>
                  <p className="text-sm text-muted">{t("hud.aheadMeta", { word: t(`sev.${upcoming.severity}` as Key), n: upcoming.severity, street: upcoming.street })}</p>
                </div>
                <p className="text-right text-4xl font-medium tabular-nums tracking-tight">{distance}<span className="ml-1 text-base text-muted">ft</span></p>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink transition-[width] duration-300 ease-linear" style={{ width: `${100 - (distance / upcoming.startFt) * 100}%` }} /></div>
            </motion.div>
          ) : notice ? (
            <motion.div key={notice} {...rise} role="status" className="max-w-md rounded-full bg-paper/95 px-5 py-3 text-center text-[15px] text-ink backdrop-blur">{notice}</motion.div>
          ) : last ? (
            <motion.div key={last.id} {...rise} role="status" className="rounded-full bg-paper/95 px-5 py-3 text-[15px] text-ink backdrop-blur">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-moss align-middle" aria-hidden />{t(`hud.result.${last.kind}` as Key)}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* controls */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
        <button onClick={onTogglePause} className="pill bg-paper/90 text-ink backdrop-blur"><Pause />{paused ? t("hud.resume") : t("hud.pause")}</button>
        <button onClick={onEnd} className="pill bg-paper text-ink">{t("hud.end")}</button>
      </div>
      <p className="absolute inset-x-0 bottom-0 pb-1 text-center text-[11px] text-paper/50" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2px)" }}>{t("hud.eyes")}</p>
    </div>
  );
}
