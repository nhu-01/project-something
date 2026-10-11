"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Camera, Flashlight, Mic, Pause, Volume } from "@/components/ui/Icons";
import Snapshot from "./Snapshot";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";
import { GRADE, SEV_DARK_TEXT, SEV_VAR } from "@/lib/tokens";
import type { GpsState, RideEvent } from "./types";

function useElapsed(running: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => { if (!running) return; const t = setInterval(() => setS((v) => v + 1), 1000); return () => clearInterval(t); }, [running]);
  return s;
}

type Props = {
  gps: GpsState;
  online: boolean;
  last: RideEvent | null;
  events: RideEvent[];
  children?: ReactNode; // the navigation overlay
  notice: string | null;
  paused: boolean;
  voiceOn: boolean;
  torch: boolean | null; // null when this browser can't control the flashlight
  onToggleTorch: () => void;
  count: number;
  onTogglePause: () => void;
  onCapture: () => void; // the shutter
  listening: boolean; // the microphone is on, waiting for "take a picture here"
  onToggleVoice: () => void;
  onEnd: () => void;
};

export default function RideHud({ gps, online, last, events, children, notice, paused, voiceOn, torch, onToggleTorch, count, onTogglePause, onToggleVoice, onEnd, onCapture, listening }: Props) {
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
      <ul className="pointer-events-none absolute right-3 flex flex-col gap-2" style={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)" }} aria-label={t("hud.photos")}>
        <AnimatePresence initial={false}>
          {[...events].reverse().filter((e) => e.shot).slice(0, 4).map((e) => (
            <motion.li key={e.id} layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : 1.45, ease: [0.16, 1, 0.3, 1], layout: { duration: 0.45, delay: reduce ? 0 : 1.45 } }}
              className="relative w-[58px] overflow-hidden rounded-[14px] border-2 border-paper shadow-[0_6px_18px_rgb(0_0_0/0.4)]" style={{ aspectRatio: e.shotAspect ?? 0.5625 }}>
              <img src={e.shot} alt={`${t(`hazard.${e.hazard}` as Key)} · ${e.street}`} className="h-full w-full object-cover" />
              {e.severity && <span className="absolute bottom-1 left-1 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold" style={{ background: SEV_VAR[e.severity], color: SEV_DARK_TEXT[e.severity] ? "var(--ink)" : "#fff" }} aria-hidden>{GRADE[e.severity]}</span>}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
        <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-paper/90 px-3 py-2 text-sm text-ink backdrop-blur">
          <span className={`h-2 w-2 rounded-full bg-moss ${paused || reduce ? "" : "animate-pulse"}`} aria-hidden />
          {paused ? t("hud.paused") : !online ? t("hud.offline") : gps === "denied" ? t("hud.locationOff") : gps === "waiting" ? t("hud.findingGps") : t("hud.scanning")}
          <span className="hidden text-muted min-[430px]:inline" aria-hidden>{mm}:{ss}</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div key={count} initial={count > 0 && !reduce ? { scale: 1.25 } : false} animate={{ scale: 1 }} transition={{ delay: 1.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="whitespace-nowrap rounded-full bg-paper/90 px-3 py-2 text-sm text-ink backdrop-blur">{t("hud.logged", { n: count })}</motion.div>
          {torch !== null && <button onClick={onToggleTorch} aria-pressed={torch} aria-label={torch ? t("hud.torchOff") : t("hud.torchOn")} className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur ${torch ? "bg-paper/90 text-ink" : "bg-paper/30 text-paper"}`}><Flashlight /></button>}
          <span role="status" className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur ${listening ? "bg-paper/90 text-ink" : "bg-paper/30 text-paper"}`} aria-label={listening ? t("hud.listening") : t("hud.micOffNow")}><Mic /></span>
          <button onClick={onToggleVoice} aria-pressed={voiceOn} aria-label={voiceOn ? t("hud.mute") : t("hud.unmute")} className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur ${voiceOn ? "bg-paper/90 text-ink" : "bg-paper/30 text-paper"}`}><Volume /></button>
        </div>
      </div>

      {children}

      {/* a photo was added: the same look as the walkthrough (glass note on top, grade strip and card at the bottom) */}
      <AnimatePresence>
        {last && (
          <motion.p key={`top-${last.id}`} {...rise} role="status" className="absolute inset-x-4 z-10 mx-auto max-w-md rounded-full border border-paper/25 bg-ink/45 px-4 py-2.5 text-center text-[14px] text-paper backdrop-blur-md" style={{ top: "calc(env(safe-area-inset-top) + 76px)" }}>
            {t(`hud.result.${last.kind}` as Key)}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center gap-3 px-4" style={{ bottom: "calc(env(safe-area-inset-bottom) + 232px)" }}>
        <AnimatePresence mode="wait">
          {notice && !last ? (
            <motion.div key={notice} {...rise} role="status" className="max-w-md rounded-full bg-paper/95 px-5 py-3 text-center text-[15px] text-ink backdrop-blur">{notice}</motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {last && (
          <motion.div key={`card-${last.id}`} {...rise} className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center gap-2 px-3" style={{ bottom: "calc(env(safe-area-inset-bottom) + 104px)" }}>
            {last.severity && (
              <div className="flex justify-center gap-1.5" aria-hidden>
                {([1, 2, 3, 4, 5] as const).map((g) => (
                  <span key={g} className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${g === last.severity ? "scale-110 shadow-[0_0_0_2px_var(--paper)]" : "opacity-60"}`}
                    style={{ background: SEV_VAR[g], color: SEV_DARK_TEXT[g] ? "var(--ink)" : "#fff" }}>{GRADE[g]}</span>
                ))}
              </div>
            )}
            <div role="status" className="flex w-full max-w-md items-center gap-3 rounded-[22px] bg-paper p-3 text-ink shadow-[0_12px_36px_rgb(0_0_0/0.4)]">
              {last.severity ? (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl font-bold" style={{ background: SEV_VAR[last.severity], color: SEV_DARK_TEXT[last.severity] ? "var(--ink)" : "#fff" }} aria-hidden>{GRADE[last.severity]}</span>
              ) : (
                <span className="h-3 w-3 shrink-0 rounded-full bg-moss" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="text-[15px] font-medium">{last.severity ? t("common.severityN", { n: GRADE[last.severity], word: t(`sev.${last.severity}` as Key) }) : t(`hud.result.${last.kind}` as Key)}</p>
                <p className="truncate text-xs text-muted">{t(`hazard.${last.hazard}` as Key)} · {last.street}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* controls */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
        <button onClick={onCapture} aria-label={t("hud.shutter")} className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-paper bg-taxi text-ink shadow-[0_6px_18px_rgb(0_0_0/0.4)] active:translate-y-0.5"><Camera /></button>
        <button onClick={onTogglePause} className="pill bg-paper/90 text-ink backdrop-blur"><Pause />{paused ? t("hud.resume") : t("hud.pause")}</button>
        <button onClick={onEnd} className="pill bg-paper text-ink">{t("hud.end")}</button>
      </div>
      <p className="absolute inset-x-0 bottom-0 pb-1 text-center text-[11px] text-paper/50" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2px)" }}>{t("hud.eyes")}</p>
    </div>
  );
}
