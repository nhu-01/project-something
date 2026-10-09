const NOW = () => Date.now();

export const daysAgo = (iso: string) => Math.max(0, Math.floor((NOW() - new Date(iso).getTime()) / 86400000));

export function ago(iso: string) {
  const d = daysAgo(iso);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
