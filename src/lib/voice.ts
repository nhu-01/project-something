// Every phrase the app can speak, in every supported language. Shared by the phone (to build text) and the server
// (which only synthesizes phrases from this list, so the voice endpoint can't be used for arbitrary audio).
// Translations were written for this app and should get a native-speaker review before a real launch.

export const LANES = ["right lane", "right lane, near curb", "center lane", "left lane", "bike lane", "crosswalk", "intersection", "sidewalk"] as const;
export type Lane = (typeof LANES)[number];
export type ResultKind = "new" | "confirmed" | "worse" | "better" | "repaired";
// What's in the road. "rough" covers cracked, broken or uneven pavement.
export const HAZARDS = ["pothole", "bump", "rough"] as const;
export type Hazard = (typeof HAZARDS)[number];
export const isHazard = (s: unknown): s is Hazard => typeof s === "string" && (HAZARDS as readonly string[]).includes(s);

type Pack = {
  name: string; // shown in the language picker, in its own script
  bcp47: string; // for the phone's built-in voice fallback
  ahead: Record<Hazard, string>;
  lanes: Record<Lane, string>;
  sev: string[];
  results: Record<ResultKind, string>;
  screen: string;
  start: string; gps: string; done: string; guide: string;
  brief0: string; brief1: string; briefN: string; briefMany: string;
  sep: string;
  end: string;
};

export const LANGS = {
  en: {"name": "English", "bcp47": "en-US", "sep": ", ", "end": ".", "ahead": {"pothole": "Pothole ahead", "bump": "Bump ahead", "rough": "Rough road ahead"}, "lanes": {"right lane": "right lane", "right lane, near curb": "right lane, near the curb", "center lane": "center lane", "left lane": "left lane", "bike lane": "bike lane", "crosswalk": "crosswalk", "intersection": "intersection", "sidewalk": "sidewalk"}, "sev": ["minor", "light", "moderate", "serious", "severe"], "results": {"new": "New hazard logged.", "confirmed": "Confirmed.", "worse": "It has gotten worse.", "better": "It looks better.", "repaired": "Looks repaired."}, "screen": "That looks like a picture, not the road.", "start": "Ride started. I'm watching the road.", "gps": "Location found.", "done": "Ride complete. Thanks for helping the next rider.", "guide": "Mount your phone before you move. I'll warn you about rough road ahead, so keep your eyes on the road.", "brief0": "No known hazards on your way.", "brief1": "One known hazard on your way.", "briefN": "{n} known hazards on your way.", "briefMany": "More than twenty known hazards on your way."},
  es: {"name": "Español", "bcp47": "es-US", "sep": ", ", "end": ".", "ahead": {"pothole": "Bache adelante", "bump": "Resalto adelante", "rough": "Pavimento irregular adelante"}, "lanes": {"right lane": "carril derecho", "right lane, near curb": "carril derecho, junto a la acera", "center lane": "carril central", "left lane": "carril izquierdo", "bike lane": "carril bici", "crosswalk": "paso de peatones", "intersection": "intersección", "sidewalk": "acera"}, "sev": ["menor", "leve", "moderado", "serio", "grave"], "results": {"new": "Nuevo peligro registrado.", "confirmed": "Confirmado.", "worse": "Ha empeorado.", "better": "Se ve mejor.", "repaired": "Parece reparado."}, "screen": "Eso parece una imagen, no la calle.", "start": "Recorrido iniciado. Estoy vigilando la calle.", "gps": "Ubicación encontrada.", "done": "Recorrido terminado. Gracias por ayudar al próximo ciclista.", "guide": "Fija tu teléfono antes de moverte. Te avisaré del mal pavimento más adelante, así que mantén la vista en la calle.", "brief0": "No hay peligros conocidos en tu camino.", "brief1": "Hay un peligro conocido en tu camino.", "briefN": "Hay {n} peligros conocidos en tu camino.", "briefMany": "Hay más de veinte peligros conocidos en tu camino."},
  zh: {"name": "中文", "bcp47": "zh-CN", "sep": "，", "end": "。", "ahead": {"pothole": "前方有坑洞", "bump": "前方有凸起", "rough": "前方路面不平"}, "lanes": {"right lane": "右车道", "right lane, near curb": "右车道靠路边", "center lane": "中间车道", "left lane": "左车道", "bike lane": "自行车道", "crosswalk": "人行横道", "intersection": "路口", "sidewalk": "人行道"}, "sev": ["轻微", "较轻", "中等", "严重", "非常严重"], "results": {"new": "已记录新的路面问题。", "confirmed": "已确认。", "worse": "情况变差了。", "better": "看起来好一些了。", "repaired": "看起来已修复。"}, "screen": "这看起来是图片，不是路面。", "start": "骑行已开始。我会留意路面。", "gps": "已定位。", "done": "骑行结束。感谢你帮助下一位骑行者。", "guide": "出发前请固定好手机。前方路面不平时我会提醒你，请注意看路。", "brief0": "你的路线上没有已知的路面问题。", "brief1": "你的路线上有一处已知的路面问题。", "briefN": "你的路线上有{n}处已知的路面问题。", "briefMany": "你的路线上有二十多处已知的路面问题。"},
  ru: {"name": "Русский", "bcp47": "ru-RU", "sep": ", ", "end": ".", "ahead": {"pothole": "Впереди яма", "bump": "Впереди бугор", "rough": "Впереди неровная дорога"}, "lanes": {"right lane": "правая полоса", "right lane, near curb": "правая полоса, у бордюра", "center lane": "центральная полоса", "left lane": "левая полоса", "bike lane": "велополоса", "crosswalk": "пешеходный переход", "intersection": "перекрёсток", "sidewalk": "тротуар"}, "sev": ["незначительная", "небольшая", "средняя", "серьёзная", "опасная"], "results": {"new": "Новое опасное место записано.", "confirmed": "Подтверждено.", "worse": "Стало хуже.", "better": "Стало лучше.", "repaired": "Похоже, отремонтировано."}, "screen": "Похоже, это картинка, а не дорога.", "start": "Поездка началась. Я слежу за дорогой.", "gps": "Местоположение найдено.", "done": "Поездка завершена. Спасибо, что помогаете следующим.", "guide": "Закрепите телефон до начала движения. Я предупрежу о неровной дороге впереди, а вы смотрите на дорогу.", "brief0": "На вашем пути нет известных опасных мест.", "brief1": "На вашем пути одно известное опасное место.", "briefN": "Известных опасных мест на вашем пути: {n}.", "briefMany": "На вашем пути больше двадцати известных опасных мест."},
  ko: {"name": "한국어", "bcp47": "ko-KR", "sep": ", ", "end": ".", "ahead": {"pothole": "전방에 포트홀", "bump": "전방에 요철", "rough": "전방에 거친 노면"}, "lanes": {"right lane": "오른쪽 차선", "right lane, near curb": "오른쪽 차선, 연석 근처", "center lane": "가운데 차선", "left lane": "왼쪽 차선", "bike lane": "자전거 도로", "crosswalk": "횡단보도", "intersection": "교차로", "sidewalk": "인도"}, "sev": ["경미", "약함", "보통", "심각", "매우 심각"], "results": {"new": "새 위험 구간이 기록되었습니다.", "confirmed": "확인되었습니다.", "worse": "더 나빠졌습니다.", "better": "나아 보입니다.", "repaired": "수리된 것 같습니다."}, "screen": "실제 도로가 아니라 사진으로 보입니다.", "start": "주행을 시작합니다. 도로를 살피고 있습니다.", "gps": "위치를 찾았습니다.", "done": "주행이 끝났습니다. 다음 라이더를 도와주셔서 감사합니다.", "guide": "출발 전에 휴대폰을 거치하세요. 전방의 거친 노면을 알려 드리니 도로를 주시하세요.", "brief0": "가는 길에 알려진 위험 구간이 없습니다.", "brief1": "가는 길에 알려진 위험 구간이 한 곳 있습니다.", "briefN": "가는 길에 알려진 위험 구간이 {n}곳 있습니다.", "briefMany": "가는 길에 알려진 위험 구간이 스무 곳 넘게 있습니다."},
  ar: {"name": "العربية", "bcp47": "ar", "sep": "، ", "end": ".", "ahead": {"pothole": "حفرة أمامك", "bump": "مطب أمامك", "rough": "طريق وعر أمامك"}, "lanes": {"right lane": "المسار الأيمن", "right lane, near curb": "المسار الأيمن، قرب الرصيف", "center lane": "المسار الأوسط", "left lane": "المسار الأيسر", "bike lane": "مسار الدراجات", "crosswalk": "ممر المشاة", "intersection": "التقاطع", "sidewalk": "الرصيف"}, "sev": ["بسيطة", "خفيفة", "متوسطة", "خطيرة", "شديدة"], "results": {"new": "تم تسجيل خطر جديد.", "confirmed": "تم التأكيد.", "worse": "ازدادت سوءًا.", "better": "تبدو أفضل.", "repaired": "يبدو أنها أُصلحت."}, "screen": "يبدو أن هذه صورة وليست الطريق.", "start": "بدأت الرحلة. أنا أراقب الطريق.", "gps": "تم تحديد الموقع.", "done": "انتهت الرحلة. شكرًا لمساعدتك الراكب التالي.", "guide": "ثبّت هاتفك قبل أن تتحرك. سأنبهك إلى الطريق الوعر أمامك، فأبقِ عينيك على الطريق.", "brief0": "لا توجد مخاطر معروفة في طريقك.", "brief1": "يوجد خطر واحد معروف في طريقك.", "briefN": "عدد المخاطر المعروفة في طريقك: {n}.", "briefMany": "يوجد أكثر من عشرين خطرًا معروفًا في طريقك."},
  fr: {"name": "Français", "bcp47": "fr-FR", "sep": ", ", "end": ".", "ahead": {"pothole": "Nid-de-poule devant", "bump": "Bosse devant", "rough": "Chaussée dégradée devant"}, "lanes": {"right lane": "voie de droite", "right lane, near curb": "voie de droite, près du trottoir", "center lane": "voie centrale", "left lane": "voie de gauche", "bike lane": "piste cyclable", "crosswalk": "passage piéton", "intersection": "intersection", "sidewalk": "trottoir"}, "sev": ["mineur", "léger", "modéré", "sérieux", "grave"], "results": {"new": "Nouveau danger enregistré.", "confirmed": "Confirmé.", "worse": "Il s'est aggravé.", "better": "Il a l'air mieux.", "repaired": "Il semble réparé."}, "screen": "On dirait une image, pas la route.", "start": "Trajet commencé. Je surveille la route.", "gps": "Position trouvée.", "done": "Trajet terminé. Merci d'aider le prochain cycliste.", "guide": "Fixez votre téléphone avant de partir. Je vous préviendrai des chaussées dégradées, alors gardez les yeux sur la route.", "brief0": "Aucun danger connu sur votre trajet.", "brief1": "Un danger connu sur votre trajet.", "briefN": "{n} dangers connus sur votre trajet.", "briefMany": "Plus de vingt dangers connus sur votre trajet."},
  hi: {"name": "हिन्दी", "bcp47": "hi-IN", "sep": ", ", "end": "।", "ahead": {"pothole": "आगे गड्ढा है", "bump": "आगे उभार है", "rough": "आगे सड़क ऊबड़-खाबड़ है"}, "lanes": {"right lane": "दाईं लेन", "right lane, near curb": "दाईं लेन, किनारे के पास", "center lane": "बीच की लेन", "left lane": "बाईं लेन", "bike lane": "साइकिल लेन", "crosswalk": "ज़ेब्रा क्रॉसिंग", "intersection": "चौराहा", "sidewalk": "फुटपाथ"}, "sev": ["मामूली", "हल्का", "मध्यम", "गंभीर", "बहुत गंभीर"], "results": {"new": "नया खतरा दर्ज किया गया।", "confirmed": "पुष्टि हो गई।", "worse": "यह और खराब हो गया है।", "better": "यह बेहतर दिख रहा है।", "repaired": "लगता है मरम्मत हो गई है।"}, "screen": "यह सड़क नहीं, तस्वीर लग रही है।", "start": "सवारी शुरू हो गई। मैं सड़क पर नज़र रख रहा हूँ।", "gps": "लोकेशन मिल गई।", "done": "सवारी पूरी हुई। अगले सवार की मदद के लिए धन्यवाद।", "guide": "चलने से पहले अपना फ़ोन माउंट कर लें। आगे खराब सड़क होने पर मैं बता दूँगा, इसलिए नज़र सड़क पर रखें।", "brief0": "आपके रास्ते में कोई ज्ञात खतरा नहीं है।", "brief1": "आपके रास्ते में एक ज्ञात खतरा है।", "briefN": "आपके रास्ते में {n} ज्ञात खतरे हैं।", "briefMany": "आपके रास्ते में बीस से ज़्यादा ज्ञात खतरे हैं।"},
  pl: {"name": "Polski", "bcp47": "pl-PL", "sep": ", ", "end": ".", "ahead": {"pothole": "Dziura przed tobą", "bump": "Garb przed tobą", "rough": "Nierówna droga przed tobą"}, "lanes": {"right lane": "prawy pas", "right lane, near curb": "prawy pas, przy krawężniku", "center lane": "środkowy pas", "left lane": "lewy pas", "bike lane": "pas rowerowy", "crosswalk": "przejście dla pieszych", "intersection": "skrzyżowanie", "sidewalk": "chodnik"}, "sev": ["drobna", "niewielka", "średnia", "poważna", "bardzo groźna"], "results": {"new": "Zapisano nowe zagrożenie.", "confirmed": "Potwierdzono.", "worse": "Pogorszyło się.", "better": "Wygląda lepiej.", "repaired": "Wygląda na naprawioną."}, "screen": "To wygląda na zdjęcie, a nie na drogę.", "start": "Przejazd rozpoczęty. Obserwuję drogę.", "gps": "Znaleziono lokalizację.", "done": "Przejazd zakończony. Dziękuję za pomoc kolejnym rowerzystom.", "guide": "Zamocuj telefon, zanim ruszysz. Ostrzegę cię przed nierówną drogą, więc patrz na drogę.", "brief0": "Na twojej trasie nie ma znanych zagrożeń.", "brief1": "Na twojej trasie jest jedno znane zagrożenie.", "briefN": "Znane zagrożenia na twojej trasie: {n}.", "briefMany": "Na twojej trasie jest ponad dwadzieścia znanych zagrożeń."},
  it: {"name": "Italiano", "bcp47": "it-IT", "sep": ", ", "end": ".", "ahead": {"pothole": "Buca davanti", "bump": "Dosso davanti", "rough": "Strada dissestata davanti"}, "lanes": {"right lane": "corsia di destra", "right lane, near curb": "corsia di destra, vicino al marciapiede", "center lane": "corsia centrale", "left lane": "corsia di sinistra", "bike lane": "pista ciclabile", "crosswalk": "strisce pedonali", "intersection": "incrocio", "sidewalk": "marciapiede"}, "sev": ["minima", "lieve", "moderata", "seria", "grave"], "results": {"new": "Nuovo pericolo registrato.", "confirmed": "Confermato.", "worse": "È peggiorata.", "better": "Sembra migliorata.", "repaired": "Sembra riparata."}, "screen": "Sembra un'immagine, non la strada.", "start": "Corsa iniziata. Sto osservando la strada.", "gps": "Posizione trovata.", "done": "Corsa terminata. Grazie per aver aiutato il prossimo ciclista.", "guide": "Fissa il telefono prima di partire. Ti avviserò della strada dissestata, quindi tieni gli occhi sulla strada.", "brief0": "Nessun pericolo noto sul tuo percorso.", "brief1": "Un pericolo noto sul tuo percorso.", "briefN": "{n} pericoli noti sul tuo percorso.", "briefMany": "Più di venti pericoli noti sul tuo percorso."},
} satisfies Record<string, Pack>;

export type Lang = keyof typeof LANGS;
export const LANG_CODES = Object.keys(LANGS) as Lang[];
export const isLang = (s: unknown): s is Lang => typeof s === "string" && s in LANGS;
const pack = (lang: Lang): Pack => LANGS[lang];

export function aheadPhrase(lang: Lang, hazard: Hazard, lane: string, severity: number) {
  const p = pack(lang);
  const parts = [p.ahead[hazard]];
  if ((LANES as readonly string[]).includes(lane)) parts.push(p.lanes[lane as Lane]);
  parts.push(p.sev[Math.min(5, Math.max(1, Math.round(severity))) - 1]);
  return parts.join(p.sep) + p.end;
}
export const resultPhrase = (lang: Lang, kind: ResultKind) => pack(lang).results[kind];
export const screenPhrase = (lang: Lang) => pack(lang).screen;
export const cuePhrase = (lang: Lang, cue: "start" | "gps" | "done" | "guide") => pack(lang)[cue];

const BRIEF_MAX = 20;
// Spoken before a ride when the rider has told us where they're heading.
export function briefPhrase(lang: Lang, count: number) {
  const p = pack(lang);
  if (count <= 0) return p.brief0;
  if (count === 1) return p.brief1;
  return count > BRIEF_MAX ? p.briefMany : p.briefN.replace("{n}", String(count));
}

export function allPhrases(lang: Lang): Set<string> {
  const p = pack(lang);
  const out = new Set<string>([...Object.values(p.results), p.screen, p.start, p.gps, p.done, p.guide]);
  for (let n = 0; n <= BRIEF_MAX + 1; n++) out.add(briefPhrase(lang, n));
  for (const h of HAZARDS) for (const lane of [...LANES, "unknown lane"]) for (let s = 1; s <= 5; s++) out.add(aheadPhrase(lang, h, lane, s));
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
