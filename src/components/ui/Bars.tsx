import type { Stats } from "@/lib/data/types";
import type { T } from "@/lib/i18n";

// 14-day chart of photos added to 311 spots next to rider-reported hazards. Pure SVG, readable without color (the legend and values are text).
export default function Bars({ data, t }: { data: Stats["daily"]; t: T }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.photos, d.reports)));
  const W = 700, H = 200, pad = 24, bw = (W - pad * 2) / data.length;
  // 11.5px on a phone (the 700-unit chart is drawn ~350px wide), and a label under every third bar so none touch
  const fs = 27;
  return (
    <figure dir="ltr">
      <svg viewBox={`0 0 ${W} ${H + 40}`} className="h-auto w-full" role="img" aria-label={t("progress.chartAlt", { n: max })}>
        {[0.5, 1].map((y) => <line key={y} x1={pad} x2={W - pad} y1={H - y * (H - 20)} y2={H - y * (H - 20)} stroke="var(--line)" />)}
        {data.map((d, i) => {
          const x = pad + i * bw;
          const h1 = (d.photos / max) * (H - 20), h2 = (d.reports / max) * (H - 20);
          return (
            <g key={d.day}>
              <rect x={x + bw * 0.12} y={H - h1} width={bw * 0.34} height={Math.max(h1, 0)} rx="4" fill="var(--ink)" />
              <rect x={x + bw * 0.5} y={H - h2} width={bw * 0.34} height={Math.max(h2, 0)} rx="4" fill="var(--repaired)" />
              {i % 3 === 0 && <text x={x + bw / 2} y={H + 30} textAnchor="middle" fontSize={fs} fill="var(--muted)">{d.day}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex gap-5 text-sm text-muted"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-ink" />{t("progress.perDay")}</span><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-repaired" />{t("progress.reportsPerDay")}</span></figcaption>
    </figure>
  );
}
