"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRideEngine } from "./engine";
import { useCamera, useSpeech, useWakeLock } from "./hooks";
import Recap from "./Recap";
import RideHud from "./RideHud";
import SafetyIntro from "./SafetyIntro";
import type { Phase, RideEvent, Upcoming } from "./types";
import { aheadPhrase, preferredLang, resultPhrase, screenPhrase, type Lang } from "@/lib/voice";

const noSubscribe = () => () => {};

// intro → starting (permissions) → riding → recap.
export default function RideScreen() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [events, setEvents] = useState<RideEvent[]>([]);
  const [last, setLast] = useState<RideEvent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // The saved/phone language is only known in the browser; this reads it without a hydration mismatch.
  const detected = useSyncExternalStore(noSubscribe, preferredLang, () => "en" as Lang);
  const [chosen, setChosen] = useState<Lang | null>(null);
  const lang = chosen ?? detected;
  const setLang = (l: Lang) => { setChosen(l); try { localStorage.setItem("spotholes-lang", l); } catch { /* storage blocked */ } };
  const [paused, setPaused] = useState(false);
  const startedAt = useRef(0);
  const [seconds, setSeconds] = useState(0);
  const speech = useSpeech();
  const riding = phase === "riding";

  const camera = useCamera(phase === "starting" || riding);
  useWakeLock(riding);

  const onAhead = useCallback((u: Upcoming) => {
    speech.say(aheadPhrase(lang, u.lane, u.severity), lang);
  }, [speech, lang]);
  const onResult = useCallback((e: RideEvent) => {
    setEvents((cur) => [...cur, e]);
    setLast(e);
    setNotice(null);
    speech.say(resultPhrase(lang, e.kind), lang);
  }, [speech, lang]);
  const onHint = useCallback((hint: "screen") => {
    setNotice("that looks like a picture, not the road. nothing was logged.");
    void hint;
    speech.say(screenPhrase(lang), lang);
  }, [speech, lang]);
  const { upcoming, distance, gps, online } = useRideEngine({ active: riding, paused, videoRef: camera.ref, onAhead, onResult, onHint });

  // brief "starting" step so permission prompts happen after the tap
  useEffect(() => {
    if (phase !== "starting") return;
    const t = setTimeout(() => { startedAt.current = Date.now(); setPhase("riding"); }, 900);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => { if (!last) return; const t = setTimeout(() => setLast(null), 4500); return () => clearTimeout(t); }, [last]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(null), 5000); return () => clearTimeout(t); }, [notice]);

  const start = () => { speech.unlock(); setEvents([]); setLast(null); setNotice(null); setPaused(false); setPhase("starting"); };
  const end = () => {
    speech.stop();
    setSeconds(Math.round((Date.now() - startedAt.current) / 1000));
    setPhase("recap");
  };

  if (phase === "recap") return <Recap events={events} seconds={seconds} onAgain={() => setPhase("intro")} />;
  if (phase === "intro") return <SafetyIntro onStart={start} lang={lang} onLang={setLang} />;
  return (
    <RideHud
      camera={camera.state} gps={gps} online={online} videoRef={camera.ref} upcoming={upcoming} distance={distance} last={last} notice={notice} paused={paused}
      voiceOn={speech.on} count={events.length} onTogglePause={() => setPaused((p) => !p)} onToggleVoice={() => speech.setOn(!speech.on)} onEnd={end}
    />
  );
}
