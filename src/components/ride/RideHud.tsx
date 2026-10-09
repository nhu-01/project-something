"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Pause, Volume } from "@/components/ui/Icons";
import { SeverityBullet } from "@/components/ui/Bullet";
import { HAZARD_LABEL, SEV_WORD } from "@/lib/tokens";
import type { GpsState, RideEvent, Upcoming } from "./types";

const RESULT_COPY: Record<RideEvent["kind"], string> = {
  new: "new hazard logged", confirmed: "confirmed. same as the last rider saw", worse: "it's gotten worse. updated", better: "it looks better. updated", repaired: "looks repaired. thanks",
};

function useElapsed(running: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => { if (!running) return; const t = setInterval(() => setS((v) => v + 1), 1000); return () => clearInterval(t); }, [running]);
  return s;
}

type Props = {
  camera: "idle" | "on" | "denied";
  gps: GpsState;
  online: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  upcoming: Upcoming | null;
  distance: number;
  last: RideEvent | null;
  notice: string | null;
  paused: boolean;
  voiceOn: boolean;
  count: number;
  onTogglePause: () => void;
  onToggleVoice: () => void;
  onEnd: () => void;
};

export default function RideHud({ camera, gps, online, videoRef, upcoming, distance, last, notice, paused, voiceOn, count, onTogglePause, onToggleVoice, onEnd }: Props) {
  const reduce = useReducedMotion();
  const elapsed = useElapsed(!paused);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0"), ss = String(elapsed % 60).padStart(2, "0");
  const rise = { initial: { opacity: 0, y: reduce ? 0 : 28 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: reduce ? 0 : 16 }, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <div className="fixed inset-0 z-[3000] bg-ink text-paper" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted autoPlay aria-hidden />
      {camera !== "on" && (
        <div className="absolute inset-0 grid place-items-center bg-ink p-8 text-center text-sm text-paper/60">
          {camera === "denied" ? "camera unavailable. you'll still get warnings, but new potholes can't be logged." : "starting camera…"}
        </div>
      )}
      <div className="absolute inset-0 bg-ink/25" aria-hidden />

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
        <div className="flex items-center gap-2 rounded-full bg-paper/90 px-4 py-2 text-sm text-ink backdrop-blur">
          <span className={`h-2 w-2 rounded-full bg-moss ${paused || reduce ? "" : "animate-pulse"}`} aria-hidden />
          {paused ? "paused" : !online ? "offline, retrying" : gps === "denied" ? "location is off" : gps === "waiting" ? "finding gps" : "scanning the road"}
          <span className="text-muted" aria-label={`elapsed ${mm} minutes ${ss} seconds`}>{mm}:{ss}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-paper/90 px-4 py-2 text-sm text-ink backdrop-blur">{count} logged</div>
          <button onClick={onToggleVoice} aria-pressed={voiceOn} aria-label={voiceOn ? "mute voice" : "unmute voice"} className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur ${voiceOn ? "bg-paper/90 text-ink" : "bg-paper/30 text-paper"}`}><Volume /></button>
        </div>
      </div>

      {/* warning + result */}
      <div className="absolute inset-x-0 bottom-28 flex flex-col items-center gap-3 px-4" style={{ bottom: "calc(env(safe-area-inset-bottom) + 112px)" }}>
        <AnimatePresence mode="wait">
          {upcoming && !paused ? (
            <motion.div key={upcoming.id} {...rise} role="status" aria-live="assertive" className="w-full max-w-md rounded-[28px] bg-paper p-5 text-ink shadow-[0_18px_50px_rgb(0_0_0/0.35)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">{HAZARD_LABEL[upcoming.hazard]} ahead · reported by a rider before you</p>
                  <p className="mt-1 flex items-center gap-3 text-2xl font-medium tracking-tight"><SeverityBullet value={upcoming.severity} large />{upcoming.lane}</p>
                  <p className="text-sm text-muted">{SEV_WORD[upcoming.severity]} · severity {upcoming.severity} of 5 · {upcoming.street}</p>
                </div>
                <p className="text-right text-4xl font-medium tabular-nums tracking-tight">{distance}<span className="ml-1 text-base text-muted">ft</span></p>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink transition-[width] duration-300 ease-linear" style={{ width: `${100 - (distance / upcoming.startFt) * 100}%` }} /></div>
            </motion.div>
          ) : notice ? (
            <motion.div key={notice} {...rise} role="status" className="max-w-md rounded-full bg-paper/95 px-5 py-3 text-center text-[15px] text-ink backdrop-blur">{notice}</motion.div>
          ) : last ? (
            <motion.div key={last.id} {...rise} role="status" className="rounded-full bg-paper/95 px-5 py-3 text-[15px] text-ink backdrop-blur">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-moss align-middle" aria-hidden />{RESULT_COPY[last.kind]}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* controls */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
        <button onClick={onTogglePause} className="pill bg-paper/90 text-ink backdrop-blur"><Pause />{paused ? "resume" : "pause"}</button>
        <button onClick={onEnd} className="pill bg-paper text-ink">end ride</button>
      </div>
      <p className="absolute inset-x-0 bottom-0 pb-1 text-center text-[11px] text-paper/50" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2px)" }}>keep your eyes on the road</p>
    </div>
  );
}
