"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RideEvent, RideEventKind, Upcoming } from "./types";

// Camera preview for the ride screen. Failure is non-fatal: the ride continues without video.
export function useCamera(active: boolean) {
  const ref = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "on" | "denied">("idle");
  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        if (ref.current) { ref.current.srcObject = s; void ref.current.play().catch(() => {}); }
        setState("on");
      })
      .catch(() => !cancelled && setState("denied"));
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()); setState("idle"); };
  }, [active]);
  return { ref, state };
}

// Keeps the screen awake during a ride (iOS 16.4+ Safari). Best effort.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
    return () => { void lock?.release().catch(() => {}); };
  }, [active]);
}

export function useSpeech() {
  const [on, setOn] = useState(true);
  const onRef = useRef(on);
  useEffect(() => { onRef.current = on; }, [on]);
  // iOS only allows speech after a user gesture, so call unlock() from the Start tap.
  const unlock = useCallback(() => { try { window.speechSynthesis?.speak(new SpeechSynthesisUtterance("")); } catch { /* unsupported */ } }, []);
  const say = useCallback((text: string) => {
    if (!onRef.current) return;
    try {
      window.speechSynthesis?.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      window.speechSynthesis?.speak(u);
    } catch { /* unsupported */ }
  }, []);
  return { on, setOn, say, unlock };
}

const STREETS = ["Bedford Ave", "Bedford Ave", "Nostrand Ave", "Flushing Ave"];
const LANES = ["right lane", "right lane, near curb", "bike lane", "center lane"];
const SEVERITIES = [2, 3, 3, 4, 2, 5] as const;
const OUTCOMES: RideEventKind[] = ["confirmed", "new", "confirmed", "worse", "repaired", "confirmed"];

// SAMPLE ENGINE: stands in for the camera detector + shared pothole memory until the backend is wired.
// Every ~11s a pothole comes up ahead, counts down, then resolves against "what the last rider saw".
export function useSampleRide(active: boolean, onAhead: (u: Upcoming) => void, onResult: (e: RideEvent) => void) {
  const [upcoming, setUpcoming] = useState<Upcoming | null>(null);
  const [distance, setDistance] = useState(0);
  const cbs = useRef({ onAhead, onResult });
  useEffect(() => { cbs.current = { onAhead, onResult }; }, [onAhead, onResult]);

  useEffect(() => {
    if (!active) return;
    let n = 0;
    const timers: ReturnType<typeof setTimeout | typeof setInterval>[] = [];
    const cycle = () => {
      const i = n++;
      const outcome = OUTCOMES[i % OUTCOMES.length];
      const u: Upcoming = {
        id: `u${i}`, street: STREETS[i % STREETS.length], lane: LANES[i % LANES.length],
        severity: SEVERITIES[i % SEVERITIES.length] as Upcoming["severity"], known: outcome !== "new", startFt: 150,
      };
      setUpcoming(u); setDistance(u.startFt); cbs.current.onAhead(u);
      const tick = setInterval(() => setDistance((d) => Math.max(0, d - 10)), 330);
      timers.push(tick);
      timers.push(setTimeout(() => {
        clearInterval(tick);
        setUpcoming(null);
        cbs.current.onResult({ id: u.id, kind: outcome, street: u.street, lane: u.lane, severity: outcome === "repaired" ? null : u.severity, at: Date.now() });
      }, 5200));
    };
    timers.push(setTimeout(cycle, 3500));
    timers.push(setInterval(cycle, 12000));
    return () => { timers.forEach((t) => { clearTimeout(t as ReturnType<typeof setTimeout>); clearInterval(t as ReturnType<typeof setInterval>); }); setUpcoming(null); };
  }, [active]);

  return { upcoming, distance };
}
