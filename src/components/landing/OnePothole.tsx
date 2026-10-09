import FrameArt from "@/components/potholes/FrameArt";
import Timeline from "@/components/potholes/Timeline";
import Reveal from "@/components/ui/Reveal";
import { SeverityMeter, StatusChip } from "@/components/ui/Severity";
import type { Pothole } from "@/lib/data/types";

export default function OnePothole({ pothole }: { pothole: Pothole }) {
  return (
    <section className="wrap mt-28" aria-labelledby="memory">
      <Reveal>
        <p className="eyebrow">one pothole, many rides</p>
        <h2 id="memory" className="h2 mt-2 max-w-[18ch]">it gets smarter every pass.</h2>
      </Reveal>
      <div className="mt-10 grid gap-6 md:grid-cols-[1.05fr_1fr]">
        <Reveal>
          <div className="card overflow-hidden">
            <FrameArt pothole={pothole} className="aspect-[5/3] w-full object-cover" />
            <div className="space-y-3 p-6">
              <div className="flex flex-wrap items-center gap-3"><StatusChip status={pothole.status} /><span className="text-sm text-muted">{pothole.street}, {pothole.borough} · {pothole.lane}</span></div>
              <SeverityMeter value={pothole.severity} />
              <p className="text-sm text-muted">sample data · each rider&apos;s pass updates what we know.</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="card p-7"><Timeline sightings={pothole.sightings} /></Reveal>
      </div>
    </section>
  );
}
