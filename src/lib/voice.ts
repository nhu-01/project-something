// Every phrase the app can speak. Shared by the phone (to build text) and the server (which will only
// synthesize phrases from this list, so the voice endpoint can't be used to generate arbitrary audio).
export const LANES = ["right lane", "right lane, near curb", "center lane", "left lane", "bike lane", "crosswalk", "intersection", "unknown lane"] as const;
export const SEV_WORDS = ["minor", "light", "moderate", "serious", "severe"] as const;

export const aheadPhrase = (lane: string, severity: number) => {
  const where = (LANES as readonly string[]).includes(lane) && lane !== "unknown lane" ? `, ${lane}` : "";
  return `Pothole ahead${where}, ${SEV_WORDS[Math.min(5, Math.max(1, Math.round(severity))) - 1]}.`;
};

export const RESULT_PHRASES = {
  new: "New pothole logged.",
  confirmed: "Confirmed.",
  worse: "It has gotten worse.",
  better: "It looks better.",
  repaired: "Looks repaired.",
} as const;

export const HINT_PHRASES = { screen: "That looks like a picture, not the road." } as const;

export function allPhrases(): Set<string> {
  const out = new Set<string>([...Object.values(RESULT_PHRASES), ...Object.values(HINT_PHRASES)]);
  for (const lane of LANES) for (let s = 1; s <= 5; s++) out.add(aheadPhrase(lane, s));
  return out;
}
