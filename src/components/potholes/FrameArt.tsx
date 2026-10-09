import type { Pothole } from "@/lib/data/types";

// Stand-in for a real rider frame: abstract asphalt with a pothole, deterministic per seed.
export default function FrameArt({ pothole, className }: { pothole: Pick<Pothole, "seed" | "severity" | "photo">; className?: string }) {
  if (pothole.photo) {
    return <img src={pothole.photo} alt="frame from a rider's camera" className={className} />;
  }
  const r = (n: number) => ((pothole.seed * 9301 + n * 49297) % 233280) / 233280;
  const sev = pothole.severity ?? 1;
  const rx = 34 + sev * 10 + r(1) * 14, ry = 14 + sev * 4 + r(2) * 6;
  const cx = 130 + r(3) * 140, cy = 118 + r(4) * 40;
  const specks = Array.from({ length: 36 }, (_, i) => ({ x: r(i + 10) * 400, y: r(i + 60) * 240, s: 0.8 + r(i + 90) * 1.8 }));
  return (
    <svg viewBox="0 0 400 240" className={className} role="img" aria-label="illustration of a pothole in asphalt (sample frame)" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="240" fill="#cfcec6" />
      <rect y="150" width="400" height="90" fill="#c4c3bb" />
      <path d="M0 150 Q200 138 400 150" stroke="#b6b5ad" strokeWidth="1.5" fill="none" />
      {specks.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#a9a8a0" opacity="0.55" />)}
      <path d={`M${60 + r(5) * 60} 0 Q${100 + r(6) * 40} 90 ${cx - rx * 0.7} ${cy - ry * 0.4}`} stroke="#a9a8a0" strokeWidth="1.4" fill="none" opacity="0.7" />
      <ellipse cx={cx + 4} cy={cy + 5} rx={rx + 6} ry={ry + 5} fill="#9c9b93" opacity="0.5" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#4a4a45" />
      <ellipse cx={cx - rx * 0.12} cy={cy + ry * 0.2} rx={rx * 0.74} ry={ry * 0.66} fill="#2f2f2b" />
    </svg>
  );
}
