"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/format";

type Photo = { id: string; url: string; capturedAt: string | null };

// Street-level photos near a 311 spot, from Mapillary contributors. Shows nothing until there is something to show.
export default function StreetPhotos({ spotId, compact = false }: { spotId: string; compact?: boolean }) {
  const { t, lang } = useI18n();
  const [photos, setPhotos] = useState<Photo[]>([]);
  useEffect(() => {
    let live = true;
    fetch(`/api/spots/${spotId}/street`).then((r) => (r.ok ? r.json() : null)).then((b: { photos?: Photo[] } | null) => { if (live && b?.photos) setPhotos(b.photos); }).catch(() => {});
    return () => { live = false; };
  }, [spotId]);
  if (photos.length === 0) return null;
  return (
    <section aria-label={t("street.title")} className={compact ? "px-5 pb-4" : "mt-8"}>
      <h3 className="text-sm font-medium">{t("street.title")}</h3>
      <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {photos.slice(0, compact ? 4 : 6).map((p) => (
          <li key={p.id} className="shrink-0">
            <a href={`https://www.mapillary.com/app/?pKey=${p.id}`} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl border border-line">
              <img src={p.url} alt={`${t("street.title")}${p.capturedAt ? ` · ${fmtDate(p.capturedAt, lang)}` : ""}`} loading="lazy" className="h-24 w-36 object-cover" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-muted">{t("street.credit")}</p>
    </section>
  );
}
