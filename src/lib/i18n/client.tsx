"use client";
import { createContext, useContext, useMemo } from "react";
import type { Lang } from "@/lib/voice";
import { type Dict, LANG_COOKIE, makeT, type T } from "./index";

const Ctx = createContext<{ t: T; lang: Lang } | null>(null);

export function I18nProvider({ dict, lang, children }: { dict: Dict; lang: Lang; children: React.ReactNode }) {
  const value = useMemo(() => ({ t: makeT(dict), lang }), [dict, lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}

// Remembers the choice for a year, for both the site text and the voice warnings.
export function saveLang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  try { localStorage.setItem(LANG_COOKIE, lang); } catch { /* storage blocked */ }
}
