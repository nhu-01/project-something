const NOW = () => Date.now();

export const daysAgo = (iso: string) => Math.max(0, Math.floor((NOW() - new Date(iso).getTime()) / 86400000));

// "today", "yesterday", "3 days ago", in the visitor's language.
export function ago(iso: string, lang = "en") {
  try { return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(-daysAgo(iso), "day"); }
  catch { return `${daysAgo(iso)} d`; }
}

export const fmtDate = (iso: string, lang = "en") => new Date(iso).toLocaleDateString(lang, { month: "short", day: "numeric" });
export const fmtTime = (iso: string, lang = "en") => new Date(iso).toLocaleTimeString(lang, { hour: "numeric", minute: "2-digit" });
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Short distances in feet, longer ones in miles.
export const distance = (m: number, digits = 1) => (m < 160 ? `${Math.round((m * 3.28084) / 10) * 10} ft` : `${(m / 1609.344).toFixed(digits)} mi`);
