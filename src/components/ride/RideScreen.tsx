"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRideEngine } from "./engine";
import { useCamera, useSpeech, useWakeLock } from "./hooks";
import Recap from "./Recap";
import RideHud from "./RideHud";
import SafetyIntro from "./SafetyIntro";
import type { Phase, RideEvent, Upcoming } from "./types";
import { SEV_WORD } from "@/lib/tokens";

// intro → starting (permissions) → riding → recap.
export default function RideScreen() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [events, setEvents] = useState<RideEvent[]>([]);
  const [last, setLast] = useState<RideEvent | null>(null);
  const [paused, setPaused] = useState(false);
  const startedAt = useRef(0);
  const [seconds, setSeconds] = useState(0);
  const speech = useSpeech();
  const riding = phase === "riding";

  const camera = useCamera(phase === "starting" || riding);
  useWakeLock(riding);

  const onAhead = useCallback((u: Upcoming) => {
    speech.say(`Pothole ahead, ${u.lane}, ${SEV_WORD[u.severity]}.`);
  }, [speech]);
  const onResult = useCallback((e: RideEvent) => {
    setEvents((cur) => [...cur, e]);
    setLast(e);
    const copy = { new: "New pothole logged.", confirmed: "Confirmed.", worse: "It has gotten worse.", better: "It looks better.", repaired: "Looks repaired." }[e.kind];
    speech.say(copy);
  }, [speech]);
  const { upcoming, distance, gps, online } = useRideEngine({ active: riding, paused, videoRef: camera.ref, onAhead, onResult });

  // brief "starting" step so permission prompts happen after the tap
  useEffect(() => {
    if (phase !== "starting") return;
    const t = setTimeout(() => { startedAt.current = Date.now(); setPhase("riding"); }, 900);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => { if (!last) return; const t = setTimeout(() => setLast(null), 4500); return () => clearTimeout(t); }, [last]);

  const start = () => { speech.unlock(); setEvents([]); setLast(null); setPaused(false); setPhase("starting"); };
  const end = () => {
    window.speechSynthesis?.cancel();
    setSeconds(Math.round((Date.now() - startedAt.current) / 1000));
    setPhase("recap");
  };

  if (phase === "recap") return <Recap events={events} seconds={seconds} onAgain={() => setPhase("intro")} />;
  if (phase === "intro") return <SafetyIntro onStart={start} />;
  return (
    <RideHud
      camera={camera.state} gps={gps} online={online} videoRef={camera.ref} upcoming={upcoming} distance={distance} last={last} paused={paused}
      voiceOn={speech.on} count={events.length} onTogglePause={() => setPaused((p) => !p)} onToggleVoice={() => speech.setOn(!speech.on)} onEnd={end}
    />
  );
}
