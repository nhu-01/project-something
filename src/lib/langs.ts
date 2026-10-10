// The ten languages the site and the voice support. Names are shown in their own script.
export const LANGS = {
  en: { name: "English", bcp47: "en-US" },
  es: { name: "Español", bcp47: "es-US" },
  zh: { name: "中文", bcp47: "zh-CN" },
  ru: { name: "Русский", bcp47: "ru-RU" },
  ko: { name: "한국어", bcp47: "ko-KR" },
  ar: { name: "العربية", bcp47: "ar" },
  fr: { name: "Français", bcp47: "fr-FR" },
  hi: { name: "हिन्दी", bcp47: "hi-IN" },
  pl: { name: "Polski", bcp47: "pl-PL" },
  it: { name: "Italiano", bcp47: "it-IT" },
} as const;

export type Lang = keyof typeof LANGS;
export const LANG_CODES = Object.keys(LANGS) as Lang[];
export const isLang = (s: unknown): s is Lang => typeof s === "string" && s in LANGS;
