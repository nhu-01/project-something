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

// Plays one clip. onEnd fires when it finishes; onFail(permanent) when it can't play (permanent = the endpoint
// answered with something that isn't audio, e.g. voice not configured).
function playUrl(a: HTMLAudioElement, url: string, onEnd: () => void, onFail: (permanent: boolean) => void) {
  a.onended = onEnd;
  a.onerror = () => onFail(true);
  a.src = url;
  // AbortError just means a newer phrase replaced this one; NotSupportedError is reported through onerror
  void a.play().catch((e: unknown) => { const n = (e as Error)?.name; if (n !== "AbortError" && n !== "NotSupportedError") onFail(false); });
}
function silence(a: HTMLAudioElement | null) {
  if (a) { a.onended = null; a.onerror = null; a.pause(); }
  try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
}

type Line = { text: string; lang: Lang };

// Voice for the ride. ElevenLabs (via /api/voice) when it is configured, the phone's built-in voice otherwise.
// Lines queue up and play in order; a priority line (a warning) cuts in front of everything.
export function useSpeech() {
  const [on, setOn] = useState(true);
  const onRef = useRef(on);
  const audio = useRef<HTMLAudioElement | null>(null);
  const eleven = useRef(true); // flips off after the first failure, so we stop retrying mid-ride
  const queue = useRef<Line[]>([]);
  const busy = useRef(false);
  const turn = useRef(0); // invalidates callbacks from a line that was cut off
  const next = useRef<() => void>(() => {}); // lets a finished line start the following one

  const pump = useCallback(() => {
    if (busy.current || !onRef.current) return;
    const line = queue.current.shift();
    if (!line) return;
    busy.current = true;
    const mine = ++turn.current;
    let finished = false;
    const done = () => { if (finished || mine !== turn.current) return; finished = true; busy.current = false; next.current(); };
    const guard = setTimeout(done, 12000); // never let one stuck clip block the queue
    const finish = () => { clearTimeout(guard); done(); };
    const builtIn = () => {
      try {
        const u = new SpeechSynthesisUtterance(line.text);
        u.lang = LANGS[line.lang].bcp47;
        u.rate = 1.02;
        u.onend = finish; u.onerror = finish;
        window.speechSynthesis?.speak(u);
      } catch { finish(); }
    };
    const a = audio.current;
    if (!a || !eleven.current) return builtIn();
    playUrl(a, `/api/voice?lang=${line.lang}&text=${encodeURIComponent(line.text)}`, finish, (permanent) => { if (permanent) eleven.current = false; builtIn(); });
  }, []);

  useEffect(() => { next.current = pump; }, [pump]);

  useEffect(() => {
    onRef.current = on;
    if (!on) { queue.current = []; turn.current++; busy.current = false; silence(audio.current); }
  }, [on]);

  // Call from a tap (Start, or "hear how it works"): iOS only allows audio that begins with a user gesture.
  const unlock = useCallback(() => {
    try { window.speechSynthesis?.speak(new SpeechSynthesisUtterance("")); } catch { /* unsupported */ }
    audio.current = primed(audio.current);
  }, []);

  const say = useCallback((text: string, lang: Lang, priority = false) => {
    if (!onRef.current) return;
    if (priority) { queue.current = []; turn.current++; busy.current = false; silence(audio.current); }
    queue.current.push({ text, lang });
    pump();
  }, [pump]);

  const stop = useCallback(() => { queue.current = []; turn.current++; busy.current = false; silence(audio.current); }, []);

  return { on, setOn, say, unlock, stop };
}
