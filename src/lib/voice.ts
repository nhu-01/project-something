import { dictFor } from "@/lib/i18n";
import { LANG_CODES, LANGS, isLang, type Lang } from "@/lib/langs";

export { LANG_CODES, LANGS, isLang, type Lang };

// Everything the app says aloud lives in the translation catalog under "voice.*" (src/lib/i18n/en.ts), so it is
// translated and reviewed like the rest of the interface. The server only ever synthesizes these exact phrases, so
// the voice endpoint can't be used to speak anything else.
export type VoiceKey =
  | "start" | "gps" | "done" | "guide" | "near" | "spotAhead" | "atSpot" | "photo" | "notFound"
  | "new" | "confirmed" | "repaired" | "screen" | "next" | "finished"
  | "demo1" | "demo2" | "demo3" | "demo4" | "demo5"
  | "turnLeft" | "turnRight" | "bearLeft" | "bearRight" | "straight" | "uTurn" | "takingPhoto" | "noneSeen";
export type ResultKind = "new" | "confirmed" | "worse" | "better" | "repaired" | "photo" | "not_found";

export const voicePhrase = (lang: Lang, key: VoiceKey) => dictFor(lang)[`voice.${key}` as keyof ReturnType<typeof dictFor>];

// What to say when a frame produced an event.
export function resultPhrase(lang: Lang, kind: ResultKind) {
  const key: VoiceKey = kind === "photo" ? "photo" : kind === "not_found" ? "notFound" : kind === "new" ? "new" : kind === "repaired" ? "repaired" : "confirmed";
  return voicePhrase(lang, key);
}

export function allPhrases(lang: Lang): Set<string> {
  const d = dictFor(lang);
  const out = new Set<string>();
  for (const [k, v] of Object.entries(d)) if (k.startsWith("voice.")) out.add(v);
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
