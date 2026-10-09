"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LANGS, type Lang } from "@/lib/voice";

type TorchTrack = MediaStreamTrack & { getCapabilities?: () => MediaTrackCapabilities & { torch?: boolean } };

// Camera preview for the ride screen. Failure is non-fatal: the ride continues without video.
// Phones stop the camera when the page is backgrounded, so it is restarted when the page comes back.
export function useCamera(active: boolean) {
  const ref = useRef<HTMLVideoElement>(null);
  const track = useRef<TorchTrack | null>(null);
  const [state, setState] = useState<"idle" | "on" | "denied">("idle");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        const t = s.getVideoTracks()[0] as TorchTrack | undefined;
        track.current = t ?? null;
        let caps: { torch?: boolean } = {};
        try { caps = (t?.getCapabilities?.() ?? {}) as { torch?: boolean }; } catch { /* not supported */ }
        setTorchSupported(Boolean(caps.torch));
        // if the phone kills the camera (lock screen, another app), try again when we're visible
        t?.addEventListener("ended", () => { if (!cancelled && !document.hidden) setAttempt((n) => n + 1); });
        if (ref.current) { ref.current.srcObject = s; void ref.current.play().catch(() => {}); }
        setState("on");
      })
      .catch(() => !cancelled && setState("denied"));
    const onVisible = () => { if (!document.hidden && (!stream || stream.getVideoTracks().every((t) => t.readyState === "ended"))) setAttempt((n) => n + 1); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      stream?.getTracks().forEach((t) => t.stop());
      track.current = null;
      setState("idle"); setTorchOn(false); setTorchSupported(false);
    };
  }, [active, attempt]);

  // The phone's flashlight, where the browser allows a site to control it.
  const setTorch = useCallback(async (on: boolean) => {
    const t = track.current;
    if (!t) return false;
    try {
      await t.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
      setTorchOn(on);
      return true;
    } catch { return false; }
  }, []);

  return { ref, state, torchSupported, torchOn, setTorch };
}

// Keeps the screen awake during a ride (iOS 16.4+ Safari). The lock is dropped whenever the page is hidden,
// so it is taken again each time the page comes back.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const take = () => { navigator.wakeLock.request("screen").then((l) => { if (cancelled) void l.release().catch(() => {}); else lock = l; }).catch(() => {}); };
    const onVisible = () => { if (!document.hidden) take(); };
    take();
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); void lock?.release().catch(() => {}); };
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
export function useSpeech(voice: "f" | "m") {
  const [on, setOn] = useState(true);
  const voiceRef = useRef(voice);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
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
    playUrl(a, `/api/voice?voice=${voiceRef.current}&lang=${line.lang}&text=${encodeURIComponent(line.text)}`, finish, (permanent) => { if (permanent) eleven.current = false; builtIn(); });
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
