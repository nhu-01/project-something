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

// 7pm up to (not including) 5am in New York, whatever the phone's own time zone is. Follows daylight saving.
export function isNightInNewYork(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(now));
  return hour >= 19 || hour < 5;
}
type Voice = "f" | "m";
const savedVoice = (): Voice => { try { return localStorage.getItem("spotholes-voice") === "m" ? "m" : "f"; } catch { return "f"; } };
const save = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* storage blocked */ } };

// The camera opens straight away. Setup is a pop-up over it; "start ride" swaps the pop-up for the ride display.
// intro (camera + setup pop-up) → riding → recap.
export default function RideScreen() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [events, setEvents] = useState<RideEvent[]>([]);
  const [last, setLast] = useState<RideEvent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Saved choices are only known in the browser; this reads them without a hydration mismatch.
  const detectedLang = useSyncExternalStore(noSubscribe, preferredLang, () => "en" as Lang);
  const detectedVoice = useSyncExternalStore(noSubscribe, savedVoice, () => "f" as Voice);
  const [chosenLang, setChosenLang] = useState<Lang | null>(null);
  const [chosenVoice, setChosenVoice] = useState<Voice | null>(null);
  const lang = chosenLang ?? detectedLang, voice = chosenVoice ?? detectedVoice;
  const [paused, setPaused] = useState(false);
  const [route, setRoute] = useState<{ count: number; label: string } | null>(null); // known hazards toward the destination
  const startedAt = useRef(0);
  const [summary, setSummary] = useState({ seconds: 0, meters: 0 });
  const speech = useSpeech(voice);
  const riding = phase === "riding";

  const { ref: videoRef, state: cameraState, torchSupported, torchOn, setTorch } = useCamera(phase !== "recap");
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

  // Night hours: from 7pm to 5am New York time the flashlight comes on by itself during a ride, including when a
  // ride runs past 7pm. The rider can still switch it off, and it then stays off for the rest of that ride.
  useEffect(() => {
    if (!riding || cameraState !== "on" || !torchSupported) return;
    const check = () => {
      if (dark.current.manual || torchOn || !isNightInNewYork()) return;
      void setTorch(true).then((ok) => { if (ok) setNotice("it's after 7pm, so the flashlight is on. tap the flashlight to turn it off."); });
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [riding, cameraState, torchSupported, torchOn, setTorch]);
  const { upcoming, distance, gps, online, meters } = useRideEngine({ active: riding, paused, videoRef, onAhead, onResult, onHint, onLuma });

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
    setEvents([]); setLast(null); setNotice(null); setPaused(false);
    startedAt.current = Date.now();
    setPhase("riding");
    // spoken right away, inside the tap: confirms audio works and tells the rider what happens next
    speech.say(cuePhrase(lang, "start"), lang);
    if (route) speech.say(briefPhrase(lang, route.count), lang);
  };
  const end = () => {
    speech.stop();
    speech.say(cuePhrase(lang, "done"), lang);
    setSummary({ seconds: Math.round((Date.now() - startedAt.current) / 1000), meters });
    setPhase("recap");
  };
  const hearGuide = () => { speech.unlock(); speech.say(cuePhrase(lang, "guide"), lang, true); };

  if (phase === "recap") return <Recap events={events} seconds={summary.seconds} meters={summary.meters} onAgain={() => { setRoute(null); setPhase("intro"); }} />;

  const heading = route ? `to ${route.label.split(",")[0].toLowerCase()} · ${route.count} known ${route.count === 1 ? "hazard" : "hazards"}` : null;
  return (
    <div className="fixed inset-0 z-[3000] bg-ink text-paper">
      {/* one camera for both setup and the ride, so it never restarts in between */}
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted autoPlay aria-hidden />
      {cameraState !== "on" && (
        <div className="absolute inset-0 grid place-items-center bg-ink p-8 text-center text-sm text-paper/60">
          {cameraState === "denied" ? "camera unavailable. you'll still get warnings, but new hazards can't be logged." : "starting camera…"}
        </div>
      )}
      <div className={`absolute inset-0 transition-colors duration-500 ${riding ? "bg-ink/25" : "bg-ink/45"}`} aria-hidden />

      {riding ? (
        <RideHud
          gps={gps} online={online} upcoming={upcoming} distance={distance} last={last} events={events} heading={heading} notice={notice} paused={paused}
          torch={torchSupported ? torchOn : null} onToggleTorch={toggleTorch}
          voiceOn={speech.on} count={events.length} onTogglePause={() => setPaused((p) => !p)} onToggleVoice={() => speech.setOn(!speech.on)} onEnd={end}
        />
      ) : (
        <SafetyIntro
          onStart={start} lang={lang} onLang={(l) => { setChosenLang(l); save("spotholes-lang", l); }}
          voice={voice} onVoice={(v) => { setChosenVoice(v); save("spotholes-voice", v); }}
          onHearGuide={hearGuide} onRoute={(count, label) => setRoute(count != null && label ? { count, label } : null)}
        />
      )}
    </div>
  );
}
