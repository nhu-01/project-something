import Link from "next/link";
import { SeverityBullet } from "@/components/ui/Bullet";
import type { Pothole } from "@/lib/data/types";
import { ago } from "@/lib/format";
import type { Key, T } from "@/lib/i18n";

// A slow arrivals-board ticker of the latest real hazards. Pauses on hover or focus; static under reduced motion.
export default function Ticker({ potholes, t, lang }: { potholes: Pothole[]; t: T; lang: string }) {
  const latest = potholes.filter((p) => p.status === "open" && p.severity).slice(0, 10);
  if (latest.length === 0) return null;
  // repeat short lists so the strip is always wider than the screen
  const filled = Array.from({ length: Math.ceil(12 / latest.length) }, () => latest).flat();
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {filled.map((p, i) => (
        <li key={`${p.id}-${i}`}>
          <Link href={`/potholes/${p.id}`} tabIndex={hidden ? -1 : 0} className="flex items-center gap-3 whitespace-nowrap text-[15px] transition-opacity hover:opacity-70">
            <SeverityBullet value={p.severity!} />
            <span className="font-medium">{t(`hazard.${p.kind}` as Key)}</span>
            <span className="text-muted">{p.street}{p.borough ? `, ${p.borough}` : ""} · {ago(p.lastSeen, lang)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label={t("home.tickerLabel")} className="ticker mt-16 border-y border-line py-4">
      <div className="ticker-track flex w-max">{row(false)}{row(true)}</div>
    </section>
  );
}
