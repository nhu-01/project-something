"use client";
import { useReducedMotion } from "motion/react";
import { useMedia } from "@/lib/useMedia";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";
import { pointAt, ROUTE_D } from "./routeMath";

// One looping story in a single SVG (SMIL, so it scales and stays in sync):
// rider 1 passes and leaves potholes behind; rider 2 is warned, confirms them; "the city remembers".
const CYCLE = 16;
const R1_END = 0.4; // rider 1 occupies 0 to 40% of the cycle
const R2_START = 0.5, R2_END = 0.9;
const HOLES = [
  { f: 0.16, sev: 3 },
  { f: 0.46, sev: 4 },
  { f: 0.72, sev: 1 },
  { f: 0.9, sev: 3 },
];

const seq = (a: number[]) => a.map((n) => n.toFixed(4)).join(";");

export default function HeroScene() {
  const reduce = useReducedMotion();
  const { t } = useI18n();
  // On a phone the whole sketch is only ~350px wide, which shrinks its words to nothing. Crop in to the middle of the
  // street and draw the type larger so it stays readable (about 11px on screen).
  const compact = useMedia("(max-width: 640px)");
  const view = compact ? "170 10 860 370" : "0 0 1200 380";
  const fs = compact ? 30 : 13, chipH = compact ? 48 : 30, capFs = compact ? 29 : 16, capY = compact ? 358 : 362, capX = compact ? 600 : 600;
  const fitCaption = (text: string) => { const w = [...text].length * capFs * 0.52; return w > 820 ? { textLength: 820, lengthAdjust: "spacingAndGlyphs" as const } : {}; };
  const dur = `${CYCLE}s`;

  return (
    <svg viewBox={view} className="h-auto w-full" role="img" aria-label={t("home.heroAlt")} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="fade" x1="0" x2="1">
          <stop offset="0" stopColor="var(--paper)" stopOpacity="1" />
          <stop offset="0.07" stopColor="var(--paper)" stopOpacity="0" />
          <stop offset="0.93" stopColor="var(--paper)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--paper)" stopOpacity="1" />
        </linearGradient>
        <path id="route" d={ROUTE_D} />
      </defs>

      {/* faint street grid */}
      <g stroke="var(--line)" strokeWidth="1" opacity="0.9">
        {Array.from({ length: 14 }, (_, i) => <line key={`a${i}`} x1={-100 + i * 110} y1="400" x2={100 + i * 110} y2="-20" />)}
        {Array.from({ length: 6 }, (_, i) => <line key={`b${i}`} x1="0" y1={40 + i * 70} x2="1200" y2={-60 + i * 70} />)}
      </g>

      {/* the street */}
      <use href="#route" fill="none" stroke="var(--line)" strokeWidth="26" strokeLinecap="round" />
      <use href="#route" fill="none" stroke="var(--paper)" strokeWidth="2" strokeDasharray="10 12" strokeLinecap="round" />

      {HOLES.map((h, i) => {
        const p = pointAt(h.f);
        const s1 = R1_END * h.f; // rider 1 reaches it
        const s2 = R2_START + (R2_END - R2_START) * h.f; // rider 2 reaches it
        const warnAt = Math.max(R2_START + 0.005, s2 - 0.055);
        const label = `${t("home.aheadLabel")} · ${t(`sev.${h.sev}` as Key)}`;
        const labelW = [...label].length * fs * 0.62 + 30;
        return (
          <g key={i}>
            {/* remembered pothole */}
            <circle cx={p.x} cy={p.y} r="7" fill="var(--ink)" opacity={reduce ? 1 : 0}>
              {!reduce && <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={seq([0, s1, s1 + 0.015, 0.97, 0.995, 1])} />}
            </circle>
            {!reduce && (
              <>
                {/* rider 1 finds it: ink ripple */}
                <circle cx={p.x} cy={p.y} fill="none" stroke="var(--ink)" strokeWidth="1.5" r="7" opacity="0">
                  <animate attributeName="r" dur={dur} repeatCount="indefinite" values="7;7;34;34" keyTimes={seq([0, s1, s1 + 0.07, 1])} />
                  <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0.55;0;0" keyTimes={seq([0, s1, s1 + 0.07, 1])} />
                </circle>
                {/* rider 2 confirms: blue ripple */}
                <circle cx={p.x} cy={p.y} fill="none" stroke="var(--repaired)" strokeWidth="2" r="7" opacity="0">
                  <animate attributeName="r" dur={dur} repeatCount="indefinite" values="7;7;34;34" keyTimes={seq([0, s2, s2 + 0.07, 1])} />
                  <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0.7;0;0" keyTimes={seq([0, s2, s2 + 0.07, 1])} />
                </circle>
                {/* warning for rider 2 */}
                <g opacity="0" transform={`translate(${p.x - labelW / 2} ${p.y - (compact ? 74 : 52)})`}>
                  <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={seq([0, warnAt, warnAt + 0.02, s2 + 0.03, s2 + 0.055, 1])} />
                  <rect width={labelW} height={chipH} rx={chipH / 2} fill="var(--ink)" />
                  <text x={labelW / 2} y={chipH / 2 + fs * 0.34} textAnchor="middle" fontSize={fs} fill="var(--paper)" fontFamily="var(--font-hanken), sans-serif">{label}</text>
                </g>
              </>
            )}
          </g>
        );
      })}

      {!reduce && (
        <>
          {/* rider 1 */}
          <g opacity="0">
            <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;1;1;0;0" keyTimes={seq([0, 0.015, R1_END, R1_END + 0.02, 1])} />
            <circle r={compact ? 20 : 13} fill="var(--line-red)" /><text y={compact ? 9 : 5} textAnchor="middle" fontSize={compact ? 29 : 15} fontWeight="700" fill="#fff" fontFamily="var(--font-hanken), sans-serif">1</text>
            <animateMotion dur={dur} repeatCount="indefinite" keyPoints="0;1;1" keyTimes={seq([0, R1_END, 1])} calcMode="linear"><mpath href="#route" /></animateMotion>
          </g>
          {/* rider 2 */}
          <g opacity="0">
            <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={seq([0, R2_START, R2_START + 0.015, R2_END, R2_END + 0.02, 1])} />
            <circle r={compact ? 20 : 13} fill="var(--line-red)" /><text y={compact ? 9 : 5} textAnchor="middle" fontSize={compact ? 29 : 15} fontWeight="700" fill="#fff" fontFamily="var(--font-hanken), sans-serif">2</text>
            <animateMotion dur={dur} repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes={seq([0, R2_START, R2_END, 1])} calcMode="linear"><mpath href="#route" /></animateMotion>
          </g>
          {/* captions */}
          {[
            { t: t("home.caption1"), a: 0.01, b: R1_END },
            { t: t("home.caption2"), a: R2_START, b: R2_END },
            { t: t("home.caption3"), a: 0.92, b: 0.995 },
          ].map((c) => (
            <text key={c.t} x={capX} y={capY} textAnchor="middle" fontSize={capFs} {...fitCaption(c.t)} fill="var(--muted)" opacity="0" fontFamily="var(--font-hanken), sans-serif">
              <animate attributeName="opacity" dur={dur} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes={seq([0, c.a, c.a + 0.02, c.b - 0.02, c.b, 1])} />
              {c.t}
            </text>
          ))}
        </>
      )}
      {reduce && <text x={capX} y={capY} textAnchor="middle" fontSize={capFs} {...fitCaption(t("home.captionStill"))} fill="var(--muted)" fontFamily="var(--font-hanken), sans-serif">{t("home.captionStill")}</text>}

      <rect x={compact ? 170 : 0} y="0" width={compact ? 860 : 1200} height="380" fill="url(#fade)" pointerEvents="none" />
    </svg>
  );
}
