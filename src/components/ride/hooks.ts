"use client";
import { useCallback, useEffect, useRef, useState } from "react";

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
