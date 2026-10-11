"use client";
import { useEffect, useRef, useState } from "react";

const CLIP_MS = 3500;
const LOUD = 0.05; // clips quieter than this are never uploaded
const COMMAND = /\b(take|snap|capture|grab|shoot)\b.*\b(pic|picture|photo|image|shot)\b|\b(pic|picture|photo)\b.*\b(here|now)\b/i;

export const heardCommand = (text: string) => COMMAND.test(text);

type Ride = { rideId: string; token: string } | null;

// Listens for "take a picture here". Only while switched on: the microphone records short clips, loud-enough ones go
// to ElevenLabs speech-to-text through /api/listen, and only the matching text comes back. Clips are not stored.
export function useVoiceCommand({ on, getRide, onCommand, onUnavailable, isSpeaking }: { on: boolean; getRide: () => Ride; onCommand: () => void; onUnavailable: () => void; isSpeaking: () => boolean }) {
  const [listening, setListening] = useState(false);
  const cb = useRef({ getRide, onCommand, onUnavailable, isSpeaking });
  useEffect(() => { cb.current = { getRide, onCommand, onUnavailable, isSpeaking }; }, [getRide, onCommand, onUnavailable, isSpeaking]);

  useEffect(() => {
    if (!on) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let loop: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch { cb.current.onUnavailable(); return; }
      if (stopped || !stream) { stream?.getTracks().forEach((t) => t.stop()); return; }
      setListening(true);
      ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m));

      const clip = () => {
        if (stopped || !stream) return;
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        const chunks: Blob[] = [];
        let peak = 0, talking = false; // `talking`: the app itself was speaking, so this clip is not the user
        const meter = setInterval(() => {
          if (cb.current.isSpeaking()) talking = true;
          analyser.getByteTimeDomainData(buf);
          let max = 0;
          for (const v of buf) max = Math.max(max, Math.abs(v - 128) / 128);
          peak = Math.max(peak, max);
        }, 80);
        rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        rec.onstop = async () => {
          clearInterval(meter);
          if (!stopped) loop = setTimeout(clip, 0);
          const ride = cb.current.getRide();
          if (peak < LOUD || !ride || talking) return;
          const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
          const form = new FormData();
          form.append("rideId", ride.rideId); form.append("token", ride.token);
          form.append("audio", blob, rec.mimeType.includes("mp4") ? "clip.m4a" : "clip.webm");
          try {
            const res = await fetch("/api/listen", { method: "POST", body: form });
            if (res.status === 503) { cb.current.onUnavailable(); return; }
            if (!res.ok) return;
            const { text } = (await res.json()) as { text?: string };
            if (text && heardCommand(text)) cb.current.onCommand();
          } catch { /* offline: try the next clip */ }
        };
        rec.start();
        setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, CLIP_MS);
      };
      clip();
    })();

    return () => {
      stopped = true;
      if (loop) clearTimeout(loop);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
      setListening(false);
    };
  }, [on]);

  return on && listening;
}
