"use client";
import { useState } from "react";
import { ArrowUpRight } from "@/components/ui/Icons";
import { LANG_CODES, LANGS, type Lang } from "@/lib/voice";

const CHECKS = [
  "my phone is mounted and I won't touch it while moving",
  "my volume is up (a speaker or one earbud is best)",
  "I'm riding legally and keeping my eyes on the road",
];

export default function SafetyIntro({ onStart, lang, onLang }: { onStart: () => void; lang: Lang; onLang: (l: Lang) => void }) {
  const [checked, setChecked] = useState<boolean[]>(CHECKS.map(() => false));
  const ready = checked.every(Boolean);
  return (
    <div className="wrap flex min-h-[calc(100dvh-64px)] flex-col justify-center py-10">
      <div className="mx-auto w-full max-w-lg">
        <p className="eyebrow">before you ride</p>
        <h1 className="h2 mt-2">set up, then go.</h1>
        <p className="mt-3 text-muted">spotholes watches the road and speaks warnings so you don&apos;t have to look at the screen. it only works safely if the phone is mounted first.</p>
        <ul className="mt-8 space-y-3">
          {CHECKS.map((c, i) => (
            <li key={c}>
              <label className="card flex cursor-pointer items-start gap-3 p-4 transition-colors has-[:checked]:border-moss has-[:checked]:bg-sage/40">
                <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--moss)]" checked={checked[i]} onChange={(e) => setChecked((cur) => cur.map((v, j) => (j === i ? e.target.checked : v)))} />
                <span className="text-[15px]">{c}</span>
              </label>
            </li>
          ))}
        </ul>
        <fieldset className="mt-8">
          <legend className="text-sm text-muted">voice warnings in</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {LANG_CODES.map((code) => (
              <button key={code} type="button" lang={LANGS[code].bcp47} className="chip" aria-pressed={lang === code} onClick={() => onLang(code)}>{LANGS[code].name}</button>
            ))}
          </div>
        </fieldset>
        <button onClick={onStart} disabled={!ready} className="pill pill-ink mt-8 w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0">
          start ride <ArrowUpRight />
        </button>
        <p className="mt-4 text-center text-sm text-muted">your phone will ask for camera and location access.</p>
      </div>
    </div>
  );
}
