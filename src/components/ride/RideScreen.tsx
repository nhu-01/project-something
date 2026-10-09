"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRideEngine } from "./engine";
import { useCamera, useSpeech, useWakeLock } from "./hooks";
import Recap from "./Recap";
import RideHud from "./RideHud";
import SafetyIntro from "./SafetyIntro";
import type { Phase, RideEvent, Upcoming } from "./types";
import { aheadPhrase, briefPhrase, cuePhrase, preferredLang, resultPhrase, screenPhrase, type Lang } from "@/lib/voice";

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
  const [onTheWay, setOnTheWay] = useState<number | null>(null); // known hazards toward the chosen destination
  const startedAt = useRef(0);
  const [summary, setSummary] = useState({ seconds: 0, meters: 0 });
  const speech = useSpeech();
  const riding = phase === "riding";

  const camera = useCamera(phase === "starting" || riding);
  useWakeLock(riding);

  // Warnings cut in front of anything else that's being said.
  const onAhead = useCallback((u: Upcoming) => {
    speech.say(aheadPhrase(lang, u.hazard, u.lane, u.severity), lang, true);
  }, [speech, lang]);
  const onResult = useCallback((e: RideEvent) => {
    setEvents((cur) => [...cur, e]);
    setLast(e);
    setNotice(null);
    speech.say(resultPhrase(lang, e.kind), lang);
  }, [speech, lang]);
  const onHint = useCallback(() => {
    setNotice("that looks like a picture, not the road. nothing was logged.");
    speech.say(screenPhrase(lang), lang);
  }, [speech, lang]);
  // Night riding: after a few dark frames in a row, switch the flashlight on (where the browser allows it).
  // Once the rider touches the flashlight button, we leave it alone for the rest of the ride.
  const dark = useRef({ frames: 0, manual: false, warned: false });
  const { torchSupported, torchOn, setTorch } = camera;
  const onLuma = useCallback((luma: number) => {
    const d = dark.current;
    d.frames = luma < 0.16 ? d.frames + 1 : 0;
    if (d.frames < 3 || d.manual) return;
    if (torchSupported && !torchOn) {
      d.frames = 0;
      void setTorch(true).then((ok) => { if (ok) setNotice("it's dark, so the flashlight is on."); });
    } else if (!torchSupported && !d.warned) {
      d.warned = true;
      setNotice("it's dark, and this browser won't let the site turn on the flashlight. detection may miss things.");
    }
  }, [torchSupported, torchOn, setTorch]);
  const toggleTorch = () => { dark.current.manual = true; void setTorch(!torchOn); };
  const { upcoming, distance, gps, online, meters } = useRideEngine({ active: riding, paused, videoRef: camera.ref, onAhead, onResult, onHint, onLuma });

  // brief "starting" step so permission prompts happen after the tap
  useEffect(() => {
    if (phase !== "starting") return;
    const t = setTimeout(() => { startedAt.current = Date.now(); setPhase("riding"); }, 900);
    return () => clearTimeout(t);
  }, [phase]);

  // Say so the first time GPS locks on, so the rider knows it's working without looking.
  const gpsSaid = useRef(false);
  useEffect(() => {
    if (!riding) { gpsSaid.current = false; return; }
    if (gps === "ok" && !gpsSaid.current) { gpsSaid.current = true; speech.say(cuePhrase(lang, "gps"), lang); }
  }, [riding, gps, speech, lang]);

  useEffect(() => { if (!last) return; const t = setTimeout(() => setLast(null), 4500); return () => clearTimeout(t); }, [last]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(null), 5000); return () => clearTimeout(t); }, [notice]);

  const start = () => {
    speech.unlock();
    dark.current = { frames: 0, manual: false, warned: false };
    events.forEach((e) => { if (e.shot) URL.revokeObjectURL(e.shot); }); // free the last ride's snapshots
    setEvents([]); setLast(null); setNotice(null); setPaused(false); setPhase("starting");
    // spoken right away, inside the tap: confirms audio works and tells the rider what happens next
    speech.say(cuePhrase(lang, "start"), lang);
    if (onTheWay != null) speech.say(briefPhrase(lang, onTheWay), lang);
  };
  const end = () => {
    speech.stop();
    speech.say(cuePhrase(lang, "done"), lang);
    setSummary({ seconds: Math.round((Date.now() - startedAt.current) / 1000), meters });
    setPhase("recap");
  };
  const hearGuide = () => { speech.unlock(); speech.say(cuePhrase(lang, "guide"), lang, true); };

  if (phase === "recap") return <Recap events={events} seconds={summary.seconds} meters={summary.meters} onAgain={() => setPhase("intro")} />;
  if (phase === "intro") return <SafetyIntro onStart={start} lang={lang} onLang={setLang} onHearGuide={hearGuide} onRoute={setOnTheWay} />;
  return (
    <RideHud
      camera={camera.state} gps={gps} online={online} videoRef={camera.ref} upcoming={upcoming} distance={distance} last={last} notice={notice} paused={paused}
      torch={torchSupported ? torchOn : null} onToggleTorch={toggleTorch}
      voiceOn={speech.on} count={events.length} onTogglePause={() => setPaused((p) => !p)} onToggleVoice={() => speech.setOn(!speech.on)} onEnd={end}
    />
  );
}
