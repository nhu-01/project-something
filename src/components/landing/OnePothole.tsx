import Reveal from "@/components/ui/Reveal";
import type { Pothole } from "@/lib/data/types";
import PassReel from "./PassReel";

// `potholes` are the most-ridden hazards that have photos; the reel shuffles through their camera frames.
export default function OnePothole({ potholes }: { potholes: Pothole[] }) {
  return (
    <section className="wrap mt-28" aria-labelledby="memory">
      <Reveal>
        <p className="eyebrow">one pothole, many rides</p>
        <h2 id="memory" className="h2 mt-2 max-w-[18ch]">it gets smarter every pass.</h2>
      </Reveal>
      <PassReel potholes={potholes} />
    </section>
  );
}
