import Link from "next/link";
import HeroScene from "@/components/landing/HeroScene";
import ScrollFillText from "@/components/motion/ScrollFillText";
import SplitReveal from "@/components/motion/SplitReveal";
import Ticker from "@/components/motion/Ticker";
import WordSwap from "@/components/motion/WordSwap";
import OnePothole from "@/components/landing/OnePothole";
import StatsStrip from "@/components/landing/StatsStrip";
import Steps from "@/components/landing/Steps";
import { ArrowUpRight } from "@/components/ui/Icons";
import Reveal from "@/components/ui/Reveal";
import { getPotholes, getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

const SWAP = [
  { text: "potholes", color: "var(--line-red)" },
  { text: "bumps", color: "var(--line-orange)" },
  { text: "rough pavement", color: "var(--line-yellow)" },
  { text: "missing pavers", color: "var(--line-blue)" },
  { text: "sunken covers", color: "var(--line-purple)" },
];

export default async function Home() {
  const [potholes, stats] = await Promise.all([getPotholes(), getStats()]);
  const story = [...potholes].sort((a, b) => b.sightings.length - a.sightings.length)[0]; // most-ridden pothole, if any exist yet
  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal><p className="eyebrow">a pothole copilot for new york</p></Reveal>
          <h1 className="display mt-4" aria-label="ride. the city remembers."><SplitReveal lines={["ride. the city", "remembers."]} delay={0.1} /></h1>
          <Reveal delay={0.55}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              spotholes watches for <WordSwap words={SWAP} /> as you ride or walk, warns the next person, and keeps a living map of nyc&apos;s streets.
            </p>
          </Reveal>
          <Reveal delay={0.7}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/ride" className="pill pill-ink">start a ride <ArrowUpRight /></Link>
              <Link href="/map" className="pill pill-line">see the map <ArrowUpRight /></Link>
            </div>
            <p className="mt-4 text-sm text-muted">not riding? <Link href="/report" className="underline underline-offset-4">report a spot by photo</Link></p>
          </Reveal>
        </div>
        <div className="mx-auto mt-10 max-w-[1100px] sm:mt-14"><HeroScene /></div>
      </section>
      <Ticker potholes={potholes} />
      <Steps />
      {story && <OnePothole pothole={story} />}
      <StatsStrip stats={stats} />
      <section className="wrap mt-28 text-center">
        <Reveal>
          <ScrollFillText text="your next ride makes the next one safer." className="h2 mx-auto max-w-[20ch]" />
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/ride" className="pill pill-ink">start a ride <ArrowUpRight /></Link>
            <Link href="/stats" className="pill pill-line">see progress</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
