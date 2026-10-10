"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Bullet } from "@/components/ui/Bullet";
import Reveal from "@/components/ui/Reveal";
import { useSpeech } from "@/components/ride/hooks";
import { Volume } from "@/components/ui/Icons";
import { useI18n } from "@/lib/i18n/client";
import { voicePhrase, type VoiceKey } from "@/lib/voice";
import type { Key } from "@/lib/i18n";
import { ChooseScene, FollowScene, GrowScene, MapScene, PhoneFrame, SnapScene } from "./DemoScenes";

const STEP_MS = 5600;
const STEP_MS_TALKING = 9000; // long enough for the narration to finish
// Each step is a real Manhattan subway line, in its line color (numbers only, no logos).
const STEPS = [
  { line: "1", color: "var(--line-red)" },
  { line: "2", color: "var(--line-red)" },
  { line: "4", color: "var(--line-green)" },
  { line: "6", color: "var(--line-green)" },
  { line: "7", color: "var(--line-purple)" },
] as const;

const readVoice = (): "f" | "m" => { try { return localStorage.getItem("spotholes-voice") === "m" ? "m" : "f"; } catch { return "f"; } };

// An automatic walkthrough of the app: one phone, five steps, advancing on its own (pauses on hover or focus,
// and with reduced motion it stays put until you pick a step).
export default function DemoWalkthrough({ photos }: { photos: string[] }) {
  const { t, lang } = useI18n();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [held, setHeld] = useState(false);
  const [talk, setTalk] = useState(false);
  const speech = useSpeech(readVoice());
  const stepMs = talk ? STEP_MS_TALKING : STEP_MS;

  useEffect(() => {
    if (reduce || held) return;
    const id = setTimeout(() => { if (!document.hidden) setStep((s) => (s + 1) % STEPS.length); }, stepMs);
    return () => clearTimeout(id);
  }, [step, reduce, held, stepMs]);

  // narration: the same voice as the ride screen (ElevenLabs, falling back to the browser's voice)
  useEffect(() => {
    if (talk) speech.say(voicePhrase(lang, `demo${step + 1}` as VoiceKey), lang, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- speak when the step or the toggle changes, not when the speech object does
  }, [step, talk, lang]);
  const toggleTalk = () => {
    if (talk) { speech.stop(); setTalk(false); return; }
    speech.unlock(); setTalk(true);
  };

  const scene = [<ChooseScene key="c" />, <FollowScene key="f" />, <SnapScene key="s" photos={photos} />, <GrowScene key="g" photos={photos} />, <MapScene key="m" />][step];

  return (
    <section className="wrap mt-28" aria-labelledby="how" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="how" className="h2">{t("demo.title")}</h2>
        <button type="button" onClick={toggleTalk} aria-pressed={talk} className="pill pill-line"><Volume />{talk ? t("demo.narrateOff") : t("demo.narrate")}</button>
      </Reveal>
      <div className="mt-10 grid items-center gap-10 md:grid-cols-[auto_1fr]">
        <Reveal className="mx-auto">
          <PhoneFrame label={t(`demo.s${step + 1}.title` as Key)}>
            <AnimatePresence mode="wait">
              <motion.div key={step} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>{scene}</motion.div>
            </AnimatePresence>
          </PhoneFrame>
        </Reveal>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.line}>
              <button type="button" onClick={() => setStep(i)} aria-current={i === step || undefined}
                className={`relative w-full overflow-hidden rounded-3xl border p-4 text-start transition-colors ${i === step ? "border-ink bg-card" : "border-line bg-transparent hover:bg-card"}`}>
                <span className="flex items-start gap-4">
                  <Bullet color={s.color} large>{s.line}</Bullet>
                  <span className="min-w-0">
                    <span className="block text-lg font-medium tracking-tight">{t(`demo.s${i + 1}.title` as Key)}</span>
                    <span className={`mt-1 block text-[15px] text-muted ${i === step ? "" : "hidden sm:block"}`}>{t(`demo.s${i + 1}.body` as Key)}</span>
                  </span>
                </span>
                {i === step && !reduce && !held && <span key={`p${step}`} className="demo-anim demo-progress absolute inset-x-0 bottom-0 h-1 origin-left" style={{ background: s.color, animationDuration: `${stepMs}ms` }} aria-hidden />}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
