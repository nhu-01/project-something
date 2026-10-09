"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LANGS, type Lang } from "@/lib/voice";

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

// A short silent clip: playing it inside the Start tap is what lets iOS play our audio later without a gesture.
const SILENT = "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";

function primed(existing: HTMLAudioElement | null) {
  const a = existing ?? new Audio();
  a.preload = "auto";
  a.src = SILENT;
  void a.play().catch(() => {});
  return a;
}

// onFail(permanent): the endpoint answered with something that isn't audio (e.g. voice not configured).
function playUrl(a: HTMLAudioElement, url: string, onFail: (permanent: boolean) => void) {
  a.onerror = () => onFail(true);
  a.src = url;
  // AbortError just means a newer phrase replaced this one
  void a.play().catch((e: unknown) => { if ((e as Error)?.name !== "AbortError" && (e as Error)?.name !== "NotSupportedError") onFail(false); });
}

// Voice for the ride. ElevenLabs (via /api/voice) when it is configured, the phone's built-in voice otherwise.
export function useSpeech() {
  const [on, setOn] = useState(true);
  const onRef = useRef(on);
  const audio = useRef<HTMLAudioElement | null>(null);
  const eleven = useRef(true); // flips off after the first failure, so we stop retrying mid-ride
  useEffect(() => { onRef.current = on; if (!on) { audio.current?.pause(); try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ } } }, [on]);

  const builtIn = useCallback((text: string, lang: Lang) => {
    try {
      window.speechSynthesis?.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANGS[lang].bcp47;
      u.rate = 1.02;
      window.speechSynthesis?.speak(u);
    } catch { /* unsupported */ }
  }, []);

  // Call from the Start tap.
  const unlock = useCallback(() => {
    try { window.speechSynthesis?.speak(new SpeechSynthesisUtterance("")); } catch { /* unsupported */ }
    audio.current = primed(audio.current);
  }, []);

  const say = useCallback((text: string, lang: Lang) => {
    if (!onRef.current) return;
    const a = audio.current;
    if (!a || !eleven.current) return builtIn(text, lang);
    playUrl(a, `/api/voice?lang=${lang}&text=${encodeURIComponent(text)}`, (permanent) => { if (permanent) eleven.current = false; builtIn(text, lang); });
  }, [builtIn]);

  const stop = useCallback(() => {
    audio.current?.pause();
    try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
  }, []);

  return { on, setOn, say, unlock, stop };
}
