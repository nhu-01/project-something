"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MISSION_KEY, useRideEngine } from "./engine";
import { requestCompass, useCompass } from "./compass";
import NavOverlay from "./NavOverlay";
import type { PlannedRoute } from "./Destination";
import { useCamera, useSpeech, useWakeLock } from "./hooks";
import Recap from "./Recap";
import RideHud from "./RideHud";
import SafetyIntro from "./SafetyIntro";
import type { Phase, RideEvent } from "./types";
import { useRouter } from "next/navigation";
import { saveLang, useI18n } from "@/lib/i18n/client";
import { briefPhrase, resultPhrase, voicePhrase } from "@/lib/voice";

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
  // The site's language is also the voice's language.
  const { t, lang } = useI18n();
  const router = useRouter();
  // The saved voice is only known in the browser; this reads it without a hydration mismatch.
  const detectedVoice = useSyncExternalStore(noSubscribe, savedVoice, () => "f" as Voice);
  const [chosenVoice, setChosenVoice] = useState<Voice | null>(null);
  const voice = chosenVoice ?? detectedVoice;
  const [paused, setPaused] = useState(false);
  const [route, setRoute] = useState<PlannedRoute | null>(null); // 311 spots on the way to the chosen destination
  const startedAt = useRef(0);
  const [summary, setSummary] = useState({ seconds: 0 });
  const speech = useSpeech(voice);
  const riding = phase === "riding";

  const { ref: videoRef, state: cameraState, torchSupported, torchOn, setTorch } = useCamera(phase !== "recap");
  useWakeLock(riding);

  const onResult = useCallback((e: RideEvent) => {
    setEvents((cur) => [...cur, e]);
    setLast(e);
    setNotice(null);
    speech.say(resultPhrase(lang, e.kind), lang);
  }, [speech, lang]);
  const onHint = useCallback(() => {
    setNotice(t("notice.picture"));
    speech.say(voicePhrase(lang, "screen"), lang);
  }, [speech, lang, t]);

  // Night riding: after a few dark frames in a row, switch the flashlight on (where the browser allows it).
  // Once the rider touches the flashlight button, we leave it alone for the rest of the ride.
  const dark = useRef({ frames: 0, manual: false, warned: false });
  const onLuma = useCallback((luma: number) => {
    const d = dark.current;
    d.frames = luma < 0.16 ? d.frames + 1 : 0;
    if (d.frames < 3 || d.manual) return;
    if (torchSupported && !torchOn) {
      d.frames = 0;
      void setTorch(true).then((ok) => { if (ok) setNotice(t("notice.darkOn")); });
    } else if (!torchSupported && !d.warned) {
      d.warned = true;
      setNotice(t("notice.darkNoTorch"));
    }
  }, [torchSupported, torchOn, setTorch, t]);
  const toggleTorch = () => { dark.current.manual = true; void setTorch(!torchOn); };

  // Night hours: from 7pm to 5am New York time the flashlight comes on by itself during a ride, including when a
  // ride runs past 7pm. The rider can still switch it off, and it then stays off for the rest of that ride.
  useEffect(() => {
    if (!riding || cameraState !== "on" || !torchSupported) return;
    const check = () => {
      if (dark.current.manual || torchOn || !isNightInNewYork()) return;
      void setTorch(true).then((ok) => { if (ok) setNotice(t("notice.night")); });
    };
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [riding, cameraState, torchSupported, torchOn, setTorch, t]);
  // The near-you alert and arrival cut in front of anything else that's being said.
  const onNear = useCallback(() => speech.say(voicePhrase(lang, "near"), lang, true), [speech, lang]);
  const onTargetClose = useCallback(() => speech.say(voicePhrase(lang, "spotAhead"), lang), [speech, lang]);
  const onAtSpot = useCallback(() => speech.say(voicePhrase(lang, "atSpot"), lang, true), [speech, lang]);
  const onNext = useCallback((place: string | null) => speech.say(voicePhrase(lang, place ? "next" : "finished"), lang), [speech, lang]);
  const { pos, gps, online, spots, hazards, stops, target, alert, skip } = useRideEngine({ active: riding, paused, videoRef, onResult, onHint, onLuma, onTargetClose, onAtSpot, onNext, onNear });
  const compass = useCompass(riding);

  // Say so the first time GPS locks on, so the rider knows it's working without looking.
  const gpsSaid = useRef(false);
  useEffect(() => {
    if (!riding) { gpsSaid.current = false; return; }
    if (gps === "ok" && !gpsSaid.current) { gpsSaid.current = true; speech.say(voicePhrase(lang, "gps"), lang); }
  }, [riding, gps, speech, lang]);

  useEffect(() => { if (!last) return; const timer = setTimeout(() => setLast(null), 4500); return () => clearTimeout(timer); }, [last]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 5000); return () => clearTimeout(timer); }, [notice]);

  const start = () => {
    speech.unlock();
    dark.current = { frames: 0, manual: false, warned: false };
    events.forEach((e) => { if (e.shot) URL.revokeObjectURL(e.shot); }); // free the last ride's snapshots
    setEvents([]); setLast(null); setNotice(null); setPaused(false);
    startedAt.current = Date.now();
    setPhase("riding");
    // spoken right away, inside the tap: confirms audio works and tells the rider what happens next
    speech.say(voicePhrase(lang, "start"), lang);
    if (route) speech.say(briefPhrase(lang, route.spots.length), lang);
    void requestCompass(); // the iOS compass prompt only appears from a tap
    try { if (route) sessionStorage.setItem(MISSION_KEY, JSON.stringify(route.spots)); } catch { /* storage blocked */ }
  };
  const end = () => {
    speech.stop();
    speech.say(voicePhrase(lang, "done"), lang);
    try { sessionStorage.removeItem(MISSION_KEY); } catch { /* storage blocked */ }
    setSummary({ seconds: Math.round((Date.now() - startedAt.current) / 1000) });
    setPhase("recap");
  };
  const hearGuide = () => { speech.unlock(); speech.say(voicePhrase(lang, "guide"), lang, true); };

  if (phase === "recap") return <Recap events={events} seconds={summary.seconds} onAgain={() => { setRoute(null); setPhase("intro"); }} />;

  return (
    <div className="fixed inset-0 z-[3000] bg-ink text-paper">
      {/* one camera for both setup and the ride, so it never restarts in between */}
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted autoPlay aria-hidden />
      {cameraState !== "on" && (
        // out of the way at the top, so it never lands behind the setup card
        <p role="status" className="absolute inset-x-6 text-center text-sm text-paper/70" style={{ top: "calc(env(safe-area-inset-top) + 84px)" }}>
          {cameraState === "denied" ? t("hud.cameraDenied") : t("hud.cameraStarting")}
        </p>
      )}
      <div className={`absolute inset-0 transition-colors duration-500 ${riding ? "bg-ink/25" : "bg-ink/45"}`} aria-hidden />

      {riding ? (
        <RideHud
          gps={gps} online={online} last={last} events={events} notice={notice} paused={paused}
          torch={torchSupported ? torchOn : null} onToggleTorch={toggleTorch}
          voiceOn={speech.on} count={events.length} onTogglePause={() => setPaused((p) => !p)} onToggleVoice={() => speech.setOn(!speech.on)} onEnd={end}
        >
          <NavOverlay pos={pos} compass={compass} target={target} alert={alert} spots={spots} hazards={hazards} stops={stops} finished={stops.length > 0 && !target} onSkip={skip} />
        </RideHud>
      ) : (
        <SafetyIntro
          onStart={start} lang={lang} onLang={(l) => { saveLang(l); router.refresh(); }}
          voice={voice} onVoice={(v) => { setChosenVoice(v); save("spotholes-voice", v); }}
          onHearGuide={hearGuide} onRoute={setRoute}
        />
      )}
    </div>
  );
}
