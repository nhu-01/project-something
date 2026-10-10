import Link from "next/link";
import { SpotButton } from "@/components/ride/SpotActions";
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
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [potholes, stats, { t, lang }] = await Promise.all([getPotholes(), getStats(), getT()]);
  // the most-ridden hazards that have camera frames, for the photo reel
  const hasPhoto = (p: (typeof potholes)[number]) => Boolean(p.photo) || p.sightings.some((x) => x.photo);
  const stories = potholes.filter(hasPhoto).sort((a, b) => b.sightings.length - a.sightings.length).slice(0, 5);
  const swap = [
    { text: t("home.swap.potholes"), color: "var(--line-red)" },
    { text: t("home.swap.bumps"), color: "var(--line-orange)" },
    { text: t("home.swap.rough"), color: "var(--line-yellow)" },
  ];
  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal><p className="eyebrow">{t("home.eyebrow")}</p></Reveal>
          <h1 className="display mt-4" aria-label={`${t("home.title1")} ${t("home.title2")}`}><SplitReveal lines={[t("home.title1"), t("home.title2")]} delay={0.1} /></h1>
          <Reveal delay={0.55}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
              {t("home.introBefore")} <WordSwap words={swap} /> {t("home.introAfter")}
            </p>
          </Reveal>
          <Reveal delay={0.7}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <SpotButton className="pill pill-ink">{t("nav.start")} <ArrowUpRight /></SpotButton>
              <Link href="/map" className="pill pill-line">{t("home.seeMap")} <ArrowUpRight /></Link>
            </div>
          </Reveal>
        </div>
        {/* the route sketch always reads left to right */}
        <div className="mx-auto mt-10 max-w-[1100px] sm:mt-14" dir="ltr"><HeroScene /></div>
      </section>
      <Ticker potholes={potholes} t={t} lang={lang} />
      <Steps t={t} />
      {stories.length > 0 && <OnePothole potholes={stories} t={t} />}
      <StatsStrip stats={stats} t={t} />
      <section className="wrap mt-28 text-center">
        <Reveal>
          <ScrollFillText text={t("home.closing")} className="h2 mx-auto max-w-[20ch]" />
          <div className="mt-8 flex justify-center gap-3">
            <SpotButton className="pill pill-ink">{t("nav.start")} <ArrowUpRight /></SpotButton>
            <Link href="/map" className="pill pill-line">{t("home.seeMap")}</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
