import Reveal from "@/components/ui/Reveal";
import type { Pothole } from "@/lib/data/types";
import type { T } from "@/lib/i18n";
import PassReel from "./PassReel";

// `potholes` are the most-ridden hazards that have photos; the reel shuffles through their camera frames.
export default function OnePothole({ potholes, t }: { potholes: Pothole[]; t: T }) {
  return (
    <section className="wrap mt-28" aria-labelledby="memory">
      <Reveal>
        <p className="eyebrow">{t("reel.eyebrow")}</p>
        <h2 id="memory" className="h2 mt-2 max-w-[18ch]">{t("reel.title")}</h2>
      </Reveal>
      <PassReel potholes={potholes} />
    </section>
  );
}
