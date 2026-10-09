import Link from "next/link";
import HeroScene from "@/components/landing/HeroScene";
import OnePothole from "@/components/landing/OnePothole";
import StatsStrip from "@/components/landing/StatsStrip";
import Steps from "@/components/landing/Steps";
import { ArrowUpRight } from "@/components/ui/Icons";
import Reveal from "@/components/ui/Reveal";
import { getPotholes, getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [potholes, stats] = await Promise.all([getPotholes(), getStats()]);
  const story = [...potholes].sort((a, b) => b.sightings.length - a.sightings.length)[0]; // most-ridden pothole, if any exist yet
  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal><p className="eyebrow">a pothole copilot for new york</p></Reveal>
          <Reveal delay={0.05}><h1 className="display mt-4">ride. the city<br />remembers.</h1></Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">spotholes watches for potholes, bumps and rough pavement as you ride or walk, warns the next person, and keeps a living map of nyc&apos;s streets.</p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/ride" className="pill pill-ink">start a ride <ArrowUpRight /></Link>
              <Link href="/map" className="pill pill-line">see the map <ArrowUpRight /></Link>
            </div>
            <p className="mt-4 text-sm text-muted">not riding? <Link href="/report" className="underline underline-offset-4">report a spot by photo</Link></p>
          </Reveal>
        </div>
        <div className="mx-auto mt-10 max-w-[1100px] sm:mt-14"><HeroScene /></div>
      </section>
      <Steps />
      {story && <OnePothole pothole={story} />}
      <StatsStrip stats={stats} />
      <section className="wrap mt-28 text-center">
        <Reveal>
          <h2 className="h2 mx-auto max-w-[20ch]">your next ride makes the next one safer.</h2>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/ride" className="pill pill-ink">start a ride <ArrowUpRight /></Link>
            <Link href="/stats" className="pill pill-line">see progress</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
