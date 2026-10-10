// Generates src/lib/i18n/dicts/<code>.json from src/lib/i18n/en.ts using Gemini.
// Run: node scripts/translate.mjs            (all languages)
//      node scripts/translate.mjs es fr      (just these)
// Needs GEMINI_API_KEY in .env.local. Machine translation: have a native speaker review before a real launch.
import { GoogleGenAI } from "@google/genai";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const MODEL = process.env.TRANSLATE_MODEL ?? "gemini-3.5-flash";

const LANGS = { es: "Spanish (Latin American, as spoken in New York)", zh: "Simplified Chinese", ru: "Russian", ko: "Korean", ar: "Arabic", fr: "French", hi: "Hindi", pl: "Polish", it: "Italian" };
const source = Object.fromEntries([...readFileSync("src/lib/i18n/en.ts", "utf8").matchAll(/^\s*("(?:[^"\\]|\\.)+"): ("(?:[^"\\]|\\.)*"),?\s*$/gm)].map((m) => [JSON.parse(m[1]), JSON.parse(m[2])]));
const keys = Object.keys(source);
const holes = (s) => (s.match(/\{[a-zA-Z]+\}/g) ?? []).sort().join(",");
// A singular form may spell the number out ("one stop"), so it is allowed to leave {n} out.
const sameHoles = (key, a, b) => holes(a) === holes(b) || (key.endsWith("_one") && holes(a) === holes(b.replace("{n}", "")));

const RULES = (language) => `You translate the interface text of "spotholes", a web app for New York City where bike and scooter riders mount a phone; its camera spots potholes and other road hazards, warns riders by voice, and maps them.
Translate each value from English into ${language}.
- Return ONLY a JSON object with exactly the same keys.
- Keep every {placeholder} exactly as written, including the braces and the name inside.
- Keep these as they are: spotholes, spotholes.nyc, 311, nyc, ai, gps, "·", "←", "…".
- The English is deliberately lowercase and calm. Keep a plain, friendly, concise tone. In scripts with letter case, keep it lowercase too unless the language's grammar requires capitals (for example German-style noun rules do not apply here; proper names like New York may stay capitalized).
- Keys ending in _one are for exactly one item. Keys ending in _other are used for every other number, so phrase them to be grammatical for any count of 2 or more; if the language's plural rules make that hard, use a neutral "label: {n}" form.
- These are short interface labels and safety instructions: be accurate rather than literal, and never drop a safety warning.`;

// Only translates keys that are missing (or whose English changed shape), so reruns are cheap and resume after a
// rate limit. One request at a time: the free tier rejects bursts.
async function translate(code, language) {
  const file = `src/lib/i18n/dicts/${code}.json`;
  const out = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  for (const k of Object.keys(out)) if (!(k in source) || !sameHoles(k, out[k], source[k])) delete out[k];
  const todo = keys.filter((k) => !(k in out));
  for (let i = 0; i < todo.length; i += 48) {
    const chunk = Object.fromEntries(todo.slice(i, i + 48).map((k) => [k, source[k]]));
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await ai.models.generateContent({ model: MODEL, contents: [{ role: "user", parts: [{ text: `${RULES(language)}\n\n${JSON.stringify(chunk, null, 1)}` }] }], config: { responseMimeType: "application/json", temperature: 0.2 } });
        const got = JSON.parse(res.text ?? "{}");
        for (const k of Object.keys(chunk)) {
          const v = got[k];
          // anything missing, or with a damaged placeholder, falls back to English at run time
          if (typeof v === "string" && v.trim() && sameHoles(k, v, chunk[k])) out[k] = v;
        }
        break;
      } catch (e) {
        const msg = String(e.message ?? e);
        if (attempt === 4) console.error(code, "chunk failed:", msg.slice(0, 100));
        await new Promise((r) => setTimeout(r, /429|quota/i.test(msg) ? 22000 : 4000));
      }
    }
    writeFileSync(file, JSON.stringify(Object.fromEntries(keys.filter((k) => k in out).map((k) => [k, out[k]])), null, 1) + "\n");
    await new Promise((r) => setTimeout(r, 2500));
  }
  return `${code}: ${Object.keys(out).length}/${keys.length}`;
}

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(LANGS);
console.log(`${keys.length} strings, model ${MODEL}`);
for (const c of wanted.filter((c) => LANGS[c])) console.log(await translate(c, LANGS[c]));
