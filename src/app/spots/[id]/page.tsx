import Link from "next/link";
import StreetPhotos from "@/components/photos/StreetPhotos";
import { PhotographSpot } from "@/components/ride/SpotActions";
import { gradeOf } from "@/lib/tokens";
import { notFound } from "next/navigation";
import { streetViewUrl } from "@/components/map/CityPanels";
import CityGallery from "@/components/photos/CityGallery";
import Reveal from "@/components/ui/Reveal";
import { SeverityMeter } from "@/components/ui/Severity";
import { getCityReport } from "@/lib/data";
import { ago, daysAgo, fmtDate, fmtTime } from "@/lib/format";
import { plural, type Key } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await getCityReport(id);
  return { title: r ? `${r.place} · 311 · spotholes` : "spotholes" };
}

// A public page for one 311 pothole report, like Austin's and Boston's ticket pages: the city's record on one side,
// every photo riders have taken of the spot on the other.
export default async function SpotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [r, { t, lang }] = await Promise.all([getCityReport(id), getT()]);
  if (!r) notFound();
  const photos = r.photos.filter((p) => p.present && p.photo);
  const facts: [string, string][] = [
    [t("spot.number"), r.id], [t("pothole.street"), `${r.place}, ${r.borough}`], [t("spot.reported"), `${fmtDate(r.createdAt, lang)} (${ago(r.createdAt, lang)})`],
    [t("spot.cityStatus"), r.status], [t("spot.daysOpen"), t("pothole.days", { n: daysAgo(r.createdAt) })],
    [t("pothole.type"), r.kind ? t(`hazard.${r.kind}` as Key) : t("spot.unknown")], [t("pothole.sizeEstimate"), r.size ? t(`size.${r.size}` as Key) : t("spot.unknown")],
    [t("pothole.position"), r.lane ?? t("spot.unknown")], [t("spot.photos"), String(r.photoCount)],
  ];
  return (
    <div className="wrap pt-8 sm:pt-12">
      <Link href="/map" className="tap text-sm text-muted transition-colors hover:text-ink">{t("pothole.back")}</Link>
      <Reveal className="mt-4">
        <p className="eyebrow">{t("spot.eyebrow", { id: r.id })}</p>
        <h1 className="h2 mt-2 max-w-[22ch]">{r.place}</h1>
        <p className="mt-2 text-muted">{t("city.meta", { borough: r.borough, when: ago(r.createdAt, lang), status: r.status.toLowerCase() })}</p>
      </Reveal>

      <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <h2 className="mb-4 text-lg font-medium">{plural(t, "spot.photosTitle", photos.length)}</h2>
          {photos.length ? <CityGallery photos={photos} place={r.place} grid /> : (
            <div className="grid min-h-[220px] place-items-center rounded-3xl border border-dashed border-line bg-card p-8 text-center text-muted">{t("spot.noPhotos")}</div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <PhotographSpot spot={{ id: r.id, lat: r.lat, lng: r.lng, place: r.place }} className="pill pill-ink">{t("city.photograph")}</PhotographSpot>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="space-y-5">
          <SeverityMeter value={r.severity} />
          <dl className="card divide-y divide-line text-[15px]">
            {facts.map(([k, v]) => (<div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="text-muted">{k}</dt><dd className="text-end font-medium">{v}</dd></div>))}
          </dl>
          <p className="text-sm text-muted">{t("spot.disclaimer")}</p>
          <StreetPhotos spotId={r.id} />
          <div className="flex flex-wrap gap-x-5">
            <a className="tap text-sm underline underline-offset-4" href={streetViewUrl(r.lat, r.lng)} target="_blank" rel="noopener noreferrer">{t("city.streetView")}</a>
            <a className="tap text-sm underline underline-offset-4" href="https://portal.311.nyc.gov/">{t("pothole.report311")}</a>
          </div>
        </Reveal>
      </div>

      <section className="mt-16" aria-labelledby="spot-history">
        <Reveal><h2 id="spot-history" className="h2">{t("spot.history")}</h2><p className="mt-2 text-muted">{t("spot.historySub")}</p></Reveal>
        <Reveal delay={0.05} className="card mt-6 max-w-2xl p-7">
          {r.photos.length === 0 ? <p className="text-muted">{t("spot.noHistory")}</p> : (
            <ol className="relative space-y-6 border-s border-line ps-6">
              {r.photos.map((p) => (
                <li key={p.id} className="relative">
                  <span className="absolute -start-[31px] top-1.5 grid h-3 w-3 place-items-center rounded-full border border-ink bg-paper" aria-hidden>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.present ? "var(--ink)" : "var(--repaired)" }} />
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">{p.present ? t("spot.seen") : t("spot.notFound")}</span>
                    {p.severity && <span className="text-sm text-muted">{t("common.severityN", { n: gradeOf(p.severity), word: t(`sev.${p.severity}` as Key) })}</span>}
                    <span className="text-sm text-muted">{fmtDate(p.at, lang)}, {fmtTime(p.at, lang)}{p.rider ? ` · ${t("common.rider", { id: p.rider })}` : ""}</span>
                  </div>
                  {p.note && <p className="mt-0.5 text-[15px] text-muted" dir="auto">{p.note}</p>}
                </li>
              ))}
            </ol>
          )}
        </Reveal>
      </section>
    </div>
  );
}
