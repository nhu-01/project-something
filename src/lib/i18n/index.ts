import ar from "./dicts/ar.json";
import es from "./dicts/es.json";
import fr from "./dicts/fr.json";
import hi from "./dicts/hi.json";
import it from "./dicts/it.json";
import ko from "./dicts/ko.json";
import pl from "./dicts/pl.json";
import ru from "./dicts/ru.json";
import zh from "./dicts/zh.json";
import { en, type Key } from "./en";
import { isLang, type Lang } from "@/lib/voice";

export type { Key };
export type Dict = Record<Key, string>;
export type T = (key: Key, vars?: Record<string, string | number>) => string;

export const LANG_COOKIE = "spotholes-lang";
export const RTL: ReadonlySet<Lang> = new Set<Lang>(["ar"]);
const TRANSLATED: Partial<Record<Lang, Partial<Dict>>> = { ar, es, fr, hi, it, ko, pl, ru, zh };

// English fills in anything a translation is missing, so a new key never shows up blank.
export const dictFor = (lang: Lang): Dict => ({ ...en, ...(TRANSLATED[lang] ?? {}) });

export function makeT(dict: Dict): T {
  return (key, vars) => {
    let s: string = dict[key] ?? en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

// Picks the _one or _other form of a key.
export const plural = (t: T, base: string, n: number, vars: Record<string, string | number> = {}) =>
  t(`${base}_${n === 1 ? "one" : "other"}` as Key, { n, ...vars });

export const toLang = (value: unknown): Lang | null => (isLang(value) ? value : null);
