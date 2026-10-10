"use client";
import Link from "next/link";
import { GrowScene, MapScene, PhoneFrame } from "@/components/landing/DemoScenes";
import Reveal from "@/components/ui/Reveal";
import { ArrowUpRight } from "@/components/ui/Icons";
import { useI18n } from "@/lib/i18n/client";

// The last two walkthrough steps, shown after the demo ride: the record grows, then the map. The same drawings (and
// the same rider photos) as the homepage walkthrough.
export default function DemoFinale({ photos }: { photos: string[] }) {
  const { t } = useI18n();
  return (
    <Reveal delay={0.05} className="mt-10">
      <div className="grid justify-items-center gap-10 sm:grid-cols-2">
        <figure className="text-center">
          <PhoneFrame label={t("demo.s4.title")}><GrowScene photos={photos} /></PhoneFrame>
          <figcaption className="mt-4 max-w-[270px]"><p className="font-medium">{t("demo.s4.title")}</p><p className="mt-1 text-sm text-muted">{t("demo.s4.body")}</p></figcaption>
        </figure>
        <figure className="text-center">
          <PhoneFrame label={t("demo.s5.title")}><MapScene /></PhoneFrame>
          <figcaption className="mt-4 max-w-[270px]"><p className="font-medium">{t("demo.s5.title")}</p><p className="mt-1 text-sm text-muted">{t("demo.s5.body")}</p>
            <Link href="/map" className="pill pill-line mt-3">{t("recap.seeMap")} <ArrowUpRight /></Link></figcaption>
        </figure>
      </div>
    </Reveal>
  );
}
