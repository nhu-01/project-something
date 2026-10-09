// Every phrase the app can speak, in every supported language. Shared by the phone (to build text) and the server
// (which only synthesizes phrases from this list, so the voice endpoint can't be used for arbitrary audio).
// Translations were written for this app and should get a native-speaker review before a real launch.

export const LANES = ["right lane", "right lane, near curb", "center lane", "left lane", "bike lane", "crosswalk", "intersection"] as const;
export type Lane = (typeof LANES)[number];
export type ResultKind = "new" | "confirmed" | "worse" | "better" | "repaired";

type Pack = {
  name: string; // shown in the language picker, in its own script
  bcp47: string; // for the phone's built-in voice fallback
  ahead: string;
  lanes: Record<Lane, string>;
  sev: [string, string, string, string, string];
  results: Record<ResultKind, string>;
  screen: string;
  sep: string;
  end: string;
};

export const LANGS = {
  en: { name: "English", bcp47: "en-US", ahead: "Pothole ahead", sep: ", ", end: ".",
    lanes: { "right lane": "right lane", "right lane, near curb": "right lane, near the curb", "center lane": "center lane", "left lane": "left lane", "bike lane": "bike lane", crosswalk: "crosswalk", intersection: "intersection" },
    sev: ["minor", "light", "moderate", "serious", "severe"],
    results: { new: "New pothole logged.", confirmed: "Confirmed.", worse: "It has gotten worse.", better: "It looks better.", repaired: "Looks repaired." },
    screen: "That looks like a picture, not the road." },
  es: { name: "Español", bcp47: "es-US", ahead: "Bache adelante", sep: ", ", end: ".",
    lanes: { "right lane": "carril derecho", "right lane, near curb": "carril derecho, junto a la acera", "center lane": "carril central", "left lane": "carril izquierdo", "bike lane": "carril bici", crosswalk: "paso de peatones", intersection: "intersección" },
    sev: ["menor", "leve", "moderado", "serio", "grave"],
    results: { new: "Nuevo bache registrado.", confirmed: "Confirmado.", worse: "Ha empeorado.", better: "Se ve mejor.", repaired: "Parece reparado." },
    screen: "Eso parece una imagen, no la calle." },
  zh: { name: "中文", bcp47: "zh-CN", ahead: "前方有坑洞", sep: "，", end: "。",
    lanes: { "right lane": "右车道", "right lane, near curb": "右车道靠路边", "center lane": "中间车道", "left lane": "左车道", "bike lane": "自行车道", crosswalk: "人行横道", intersection: "路口" },
    sev: ["轻微", "较轻", "中等", "严重", "非常严重"],
    results: { new: "已记录新坑洞。", confirmed: "已确认。", worse: "情况变差了。", better: "看起来好一些了。", repaired: "看起来已修复。" },
    screen: "这看起来是图片，不是路面。" },
  ru: { name: "Русский", bcp47: "ru-RU", ahead: "Впереди яма", sep: ", ", end: ".",
    lanes: { "right lane": "правая полоса", "right lane, near curb": "правая полоса, у бордюра", "center lane": "центральная полоса", "left lane": "левая полоса", "bike lane": "велополоса", crosswalk: "пешеходный переход", intersection: "перекрёсток" },
    sev: ["незначительная", "небольшая", "средняя", "серьёзная", "опасная"],
    results: { new: "Новая яма записана.", confirmed: "Подтверждено.", worse: "Стало хуже.", better: "Стало лучше.", repaired: "Похоже, отремонтировано." },
    screen: "Похоже, это картинка, а не дорога." },
  ko: { name: "한국어", bcp47: "ko-KR", ahead: "전방에 포트홀", sep: ", ", end: ".",
    lanes: { "right lane": "오른쪽 차선", "right lane, near curb": "오른쪽 차선, 연석 근처", "center lane": "가운데 차선", "left lane": "왼쪽 차선", "bike lane": "자전거 도로", crosswalk: "횡단보도", intersection: "교차로" },
    sev: ["경미", "약함", "보통", "심각", "매우 심각"],
    results: { new: "새 포트홀이 기록되었습니다.", confirmed: "확인되었습니다.", worse: "더 나빠졌습니다.", better: "나아 보입니다.", repaired: "수리된 것 같습니다." },
    screen: "실제 도로가 아니라 사진으로 보입니다." },
  ar: { name: "العربية", bcp47: "ar", ahead: "حفرة أمامك", sep: "، ", end: ".",
    lanes: { "right lane": "المسار الأيمن", "right lane, near curb": "المسار الأيمن، قرب الرصيف", "center lane": "المسار الأوسط", "left lane": "المسار الأيسر", "bike lane": "مسار الدراجات", crosswalk: "ممر المشاة", intersection: "التقاطع" },
    sev: ["بسيطة", "خفيفة", "متوسطة", "خطيرة", "شديدة"],
    results: { new: "تم تسجيل حفرة جديدة.", confirmed: "تم التأكيد.", worse: "ازدادت سوءًا.", better: "تبدو أفضل.", repaired: "يبدو أنها أُصلحت." },
    screen: "يبدو أن هذه صورة وليست الطريق." },
  fr: { name: "Français", bcp47: "fr-FR", ahead: "Nid-de-poule devant", sep: ", ", end: ".",
    lanes: { "right lane": "voie de droite", "right lane, near curb": "voie de droite, près du trottoir", "center lane": "voie centrale", "left lane": "voie de gauche", "bike lane": "piste cyclable", crosswalk: "passage piéton", intersection: "intersection" },
    sev: ["mineur", "léger", "modéré", "sérieux", "grave"],
    results: { new: "Nouveau nid-de-poule enregistré.", confirmed: "Confirmé.", worse: "Il s'est aggravé.", better: "Il a l'air mieux.", repaired: "Il semble réparé." },
    screen: "On dirait une image, pas la route." },
  hi: { name: "हिन्दी", bcp47: "hi-IN", ahead: "आगे गड्ढा है", sep: ", ", end: "।",
    lanes: { "right lane": "दाईं लेन", "right lane, near curb": "दाईं लेन, किनारे के पास", "center lane": "बीच की लेन", "left lane": "बाईं लेन", "bike lane": "साइकिल लेन", crosswalk: "ज़ेब्रा क्रॉसिंग", intersection: "चौराहा" },
    sev: ["मामूली", "हल्का", "मध्यम", "गंभीर", "बहुत गंभीर"],
    results: { new: "नया गड्ढा दर्ज किया गया।", confirmed: "पुष्टि हो गई।", worse: "यह और खराब हो गया है।", better: "यह बेहतर दिख रहा है।", repaired: "लगता है मरम्मत हो गई है।" },
    screen: "यह सड़क नहीं, तस्वीर लग रही है।" },
  pl: { name: "Polski", bcp47: "pl-PL", ahead: "Dziura przed tobą", sep: ", ", end: ".",
    lanes: { "right lane": "prawy pas", "right lane, near curb": "prawy pas, przy krawężniku", "center lane": "środkowy pas", "left lane": "lewy pas", "bike lane": "pas rowerowy", crosswalk: "przejście dla pieszych", intersection: "skrzyżowanie" },
    sev: ["drobna", "niewielka", "średnia", "poważna", "bardzo groźna"],
    results: { new: "Zapisano nową dziurę.", confirmed: "Potwierdzono.", worse: "Pogorszyło się.", better: "Wygląda lepiej.", repaired: "Wygląda na naprawioną." },
    screen: "To wygląda na zdjęcie, a nie na drogę." },
  it: { name: "Italiano", bcp47: "it-IT", ahead: "Buca davanti", sep: ", ", end: ".",
    lanes: { "right lane": "corsia di destra", "right lane, near curb": "corsia di destra, vicino al marciapiede", "center lane": "corsia centrale", "left lane": "corsia di sinistra", "bike lane": "pista ciclabile", crosswalk: "strisce pedonali", intersection: "incrocio" },
    sev: ["minima", "lieve", "moderata", "seria", "grave"],
    results: { new: "Nuova buca registrata.", confirmed: "Confermato.", worse: "È peggiorata.", better: "Sembra migliorata.", repaired: "Sembra riparata." },
    screen: "Sembra un'immagine, non la strada." },
} satisfies Record<string, Pack>;

export type Lang = keyof typeof LANGS;
export const LANG_CODES = Object.keys(LANGS) as Lang[];
export const isLang = (s: unknown): s is Lang => typeof s === "string" && s in LANGS;

export function aheadPhrase(lang: Lang, lane: string, severity: number) {
  const p: Pack = LANGS[lang];
  const parts = [p.ahead];
  if ((LANES as readonly string[]).includes(lane)) parts.push(p.lanes[lane as Lane]);
  parts.push(p.sev[Math.min(5, Math.max(1, Math.round(severity))) - 1]);
  return parts.join(p.sep) + p.end;
}
export const resultPhrase = (lang: Lang, kind: ResultKind) => (LANGS[lang] as Pack).results[kind];
export const screenPhrase = (lang: Lang) => (LANGS[lang] as Pack).screen;

export function allPhrases(lang: Lang): Set<string> {
  const p: Pack = LANGS[lang];
  const out = new Set<string>([...Object.values(p.results), p.screen]);
  for (const lane of [...LANES, "unknown lane"]) for (let s = 1; s <= 5; s++) out.add(aheadPhrase(lang, lane, s));
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
