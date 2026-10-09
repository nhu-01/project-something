import type { Stats } from "@/lib/data/types";

// 14-day found vs repaired chart. Pure SVG, readable without color (the legend and values are text).
export default function Bars({ data }: { data: Stats["daily"] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.found, d.repaired)));
  const W = 700, H = 200, pad = 24, bw = (W - pad * 2) / data.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="h-auto w-full" role="img" aria-label={`Potholes found and repaired per day over the last 14 days. Most in a day: ${max}.`}>
        {[0.5, 1].map((t) => <line key={t} x1={pad} x2={W - pad} y1={H - t * (H - 20)} y2={H - t * (H - 20)} stroke="var(--line)" />)}
        {data.map((d, i) => {
          const x = pad + i * bw;
          const h1 = (d.found / max) * (H - 20), h2 = (d.repaired / max) * (H - 20);
          return (
            <g key={d.day}>
              <rect x={x + bw * 0.12} y={H - h1} width={bw * 0.34} height={Math.max(h1, 0)} rx="4" fill="var(--ink)" />
              <rect x={x + bw * 0.5} y={H - h2} width={bw * 0.34} height={Math.max(h2, 0)} rx="4" fill="var(--moss)" />
              {i % 2 === 0 && <text x={x + bw / 2} y={H + 20} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.day}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex gap-5 text-sm text-muted"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-ink" />found</span><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-moss" />repaired</span></figcaption>
    </figure>
  );
}
