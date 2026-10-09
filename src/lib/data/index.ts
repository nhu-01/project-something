import { SAMPLE_POTHOLES } from "@/data/sample";
import type { Pothole, Stats } from "./types";

// The only place components read potholes from. Today it serves sample data; the backend replaces this file's internals.
export const IS_SAMPLE_DATA = true;

const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));

export async function getPotholes(): Promise<Pothole[]> {
  await wait();
  return SAMPLE_POTHOLES;
}

export async function getPothole(id: string): Promise<Pothole | null> {
  await wait();
  return SAMPLE_POTHOLES.find((p) => p.id === id) ?? null;
}

export async function getStats(): Promise<Stats> {
  await wait();
  const all = SAMPLE_POTHOLES;
  const now = new Date("2026-10-09T18:00:00Z").getTime();
  const weekAgo = now - 7 * 86400000;
  const inWeek = (iso: string) => new Date(iso).getTime() >= weekAgo;
  const daily = Array.from({ length: 14 }, (_, i) => {
    const start = now - (13 - i) * 86400000;
    const end = start + 86400000;
    const within = (iso: string) => { const t = new Date(iso).getTime(); return t >= start && t < end; };
    return {
      day: new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      found: all.filter((p) => within(p.firstSeen)).length,
      repaired: all.filter((p) => p.status === "repaired" && within(p.lastSeen)).length,
    };
  });
  const byStreet = new Map<string, { borough: string; sev: number[] }>();
  for (const p of all.filter((x) => x.status === "open")) {
    const e = byStreet.get(p.street) ?? { borough: p.borough, sev: [] };
    e.sev.push(p.severity ?? 0);
    byStreet.set(p.street, e);
  }
  return {
    tracked: all.length,
    open: all.filter((p) => p.status === "open").length,
    repaired: all.filter((p) => p.status === "repaired").length,
    ridesThisWeek: 41,
    newThisWeek: all.filter((p) => inWeek(p.firstSeen)).length,
    repairedThisWeek: all.filter((p) => p.status === "repaired" && inWeek(p.lastSeen)).length,
    daily,
    worstStreets: [...byStreet.entries()]
      .map(([street, v]) => ({ street, borough: v.borough, open: v.sev.length, avgSeverity: v.sev.reduce((a, b) => a + b, 0) / v.sev.length }))
      .sort((a, b) => b.avgSeverity * b.open - a.avgSeverity * a.open)
      .slice(0, 5),
  };
}
