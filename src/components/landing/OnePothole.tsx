import Reveal from "@/components/ui/Reveal";
import type { Pothole } from "@/lib/data/types";
import type { T } from "@/lib/i18n";
import PassReel from "./PassReel";

// `potholes` are the most-ridden hazards that have photos; the reel shuffles through their camera frames.
export default function OnePothole({ potholes, t, className = "mt-28" }: { potholes: Pothole[]; t: T; className?: string }) {
  return (
    <section className={`wrap ${className}`} aria-labelledby="memory">
      <Reveal>
        <p className="eyebrow">{t("reel.eyebrow")}</p>
        <h2 id="memory" className="h2 mt-2 max-w-[18ch]">{t("reel.title")}</h2>
      </Reveal>
      <PassReel potholes={potholes} />
    </section>
  );
}
