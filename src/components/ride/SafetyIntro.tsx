"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ArrowUpRight, Close, Volume } from "@/components/ui/Icons";
import { LANG_CODES, LANGS, type Lang } from "@/lib/voice";
import Destination from "./Destination";

const CHECKS = [
  "my phone is mounted and I won't touch it while moving",
  "my volume is up (a speaker or one earbud is best)",
  "I'm riding legally and keeping my eyes on the road",
];

type Props = {
  onStart: () => void;
  lang: Lang; onLang: (l: Lang) => void;
  voice: "f" | "m"; onVoice: (v: "f" | "m") => void;
  onHearGuide: () => void;
  onRoute: (count: number | null, label: string | null) => void;
};

// Setup, shown as a pop-up over the live camera: destination search on top, safety checks and voice choices below.
export default function SafetyIntro({ onStart, lang, onLang, voice, onVoice, onHearGuide, onRoute }: Props) {
  const reduce = useReducedMotion();
  const [checked, setChecked] = useState<boolean[]>(CHECKS.map(() => false));
  const ready = checked.every(Boolean);
  return (
    <div className="absolute inset-0 flex flex-col justify-between gap-3 p-3" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}>
      <div className="flex items-start gap-2">
        <Link href="/" aria-label="leave and go back to the home page" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-paper text-ink"><Close /></Link>
        <div className="min-w-0 flex-1"><Destination compact onRoute={onRoute} /></div>
      </div>

      <motion.section
        role="dialog" aria-labelledby="setup-title"
        initial={{ opacity: 0, y: reduce ? 0 : 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex max-h-[68dvh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-paper text-ink shadow-[0_18px_60px_rgb(0_0_0/0.45)]"
      >
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <p className="eyebrow">before you ride</p>
            <h1 id="setup-title" className="mt-1 text-2xl font-medium tracking-tight">set up, then go.</h1>
            <p className="mt-2 text-[15px] text-muted">spotholes watches the ground and speaks warnings about potholes, bumps and rough pavement, so you don&apos;t have to look at the screen.</p>
          </div>

          <ul className="space-y-2">
            {CHECKS.map((c, i) => (
              <li key={c}>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-card p-3 transition-colors has-[:checked]:border-moss has-[:checked]:bg-sage/40">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--moss)]" checked={checked[i]} onChange={(e) => setChecked((cur) => cur.map((v, j) => (j === i ? e.target.checked : v)))} />
                  <span className="text-[15px]">{c}</span>
                </label>
              </li>
            ))}
          </ul>

          <fieldset>
            <legend className="text-sm text-muted">voice warnings</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["f", "m"] as const).map((v) => (
                <button key={v} type="button" className="chip" aria-pressed={voice === v} onClick={() => onVoice(v)}>{v === "f" ? "female voice" : "male voice"}</button>
              ))}
              <button type="button" onClick={onHearGuide} className="chip"><Volume />hear how it works</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="language">
              {LANG_CODES.map((code) => (
                <button key={code} type="button" lang={LANGS[code].bcp47} className="chip" aria-pressed={lang === code} onClick={() => onLang(code)}>{LANGS[code].name}</button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="border-t border-line p-4">
          <button onClick={onStart} disabled={!ready} className="pill pill-ink w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0">
            start ride <ArrowUpRight />
          </button>
          {!ready && <p className="mt-2 text-center text-xs text-muted">tick the three boxes to start.</p>}
        </div>
      </motion.section>
    </div>
  );
}
