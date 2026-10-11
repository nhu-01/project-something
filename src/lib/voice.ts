import { dictFor } from "@/lib/i18n";
import { LANG_CODES, LANGS, isLang, type Lang } from "@/lib/langs";

export { LANG_CODES, LANGS, isLang, type Lang };

// Everything the app says aloud lives in the translation catalog under "voice.*" (src/lib/i18n/en.ts), so it is
// translated and reviewed like the rest of the interface. The server only ever synthesizes these exact phrases, so
// the voice endpoint can't be used to speak anything else.
export type VoiceKey =
  | "start" | "gps" | "done" | "guide" | "near" | "spotAhead" | "atSpot" | "photo" | "notFound"
  | "new" | "confirmed" | "repaired" | "screen" | "next" | "finished"
  | "demo1" | "demo2" | "demo3" | "demo4" | "demo5" | "takingPhoto" | "noneSeen";
export type ResultKind = "new" | "confirmed" | "worse" | "better" | "repaired" | "photo" | "not_found";

const BRIEF_MAX = 20;

export const voicePhrase = (lang: Lang, key: VoiceKey) => dictFor(lang)[`voice.${key}` as keyof ReturnType<typeof dictFor>];

// What to say when a frame produced an event.
export function resultPhrase(lang: Lang, kind: ResultKind) {
  const key: VoiceKey = kind === "photo" ? "photo" : kind === "not_found" ? "notFound" : kind === "new" ? "new" : kind === "repaired" ? "repaired" : "confirmed";
  return voicePhrase(lang, key);
}

// Spoken before a ride when the rider has told us where they're heading.
export function briefPhrase(lang: Lang, count: number) {
  const d = dictFor(lang);
  if (count <= 0) return d["voice.brief0"];
  if (count === 1) return d["voice.brief1"];
  return count > BRIEF_MAX ? d["voice.briefMany"] : d["voice.briefN"].replaceAll("{n}", String(count));
}

export function allPhrases(lang: Lang): Set<string> {
  const d = dictFor(lang);
  const out = new Set<string>();
  for (const [k, v] of Object.entries(d)) if (k.startsWith("voice.") && !k.startsWith("voice.brief")) out.add(v);
  for (let n = 0; n <= BRIEF_MAX + 1; n++) out.add(briefPhrase(lang, n));
  return out;
}

// Best match for the phone's language setting; English otherwise.
export function preferredLang(): Lang {
  try {
    const saved = localStorage.getItem("spotholes-lang");
    if (isLang(saved)) return saved;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (isLang(nav)) return nav;
  } catch { /* storage or navigator unavailable */ }
  return "en";
}
