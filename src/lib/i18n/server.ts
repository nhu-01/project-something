import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "@/lib/voice";
import { dictFor, LANG_COOKIE, makeT, toLang } from "./index";

// The visitor's language, from the cookie the language picker sets. `chosen` is false on a first visit.
export async function getLang(): Promise<{ lang: Lang; chosen: boolean }> {
  const picked = toLang((await cookies()).get(LANG_COOKIE)?.value);
  return { lang: picked ?? "en", chosen: Boolean(picked) };
}

export async function getT() {
  const { lang } = await getLang();
  return { t: makeT(dictFor(lang)), lang };
}
