"use client";
import { useState } from "react";
import type { CityPhoto } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/format";
import PhotoLightbox from "./PhotoLightbox";

// Every photo riders have added to one 311 report: a large one, a strip of the rest (or a grid on the full page),
// tap to enlarge.
export default function CityGallery({ photos, place, grid = false }: { photos: CityPhoto[]; place: string; grid?: boolean }) {
  const { t, lang } = useI18n();
  const shown = photos.filter((p) => p.present && p.photo);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  if (shown.length === 0) return null;
  const cap = (p: CityPhoto) => `${place} · ${fmtDate(p.at, lang)}`;
  const items = shown.map((p) => ({ src: p.photo!, caption: cap(p) }));
  const cur = shown[Math.min(i, shown.length - 1)];

  if (grid) {
    return (
      <>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shown.map((p, k) => (
            <li key={p.id}>
              <button type="button" onClick={() => { setI(k); setOpen(true); }} aria-label={`${t("spot.viewPhoto")}: ${cap(p)}`} className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-2xl border border-line bg-line">
                <img src={p.photo!} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                <span className="absolute inset-x-2 bottom-2 rounded-full bg-paper/90 px-2.5 py-1 text-start text-xs text-ink backdrop-blur">{fmtDate(p.at, lang)}</span>
              </button>
            </li>
          ))}
        </ul>
        {open && <PhotoLightbox photos={items} index={i} onIndex={setI} onClose={() => setOpen(false)} />}
      </>
    );
  }
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} aria-label={`${t("spot.viewPhoto")}: ${cap(cur)}`} className="block h-44 w-full cursor-zoom-in overflow-hidden bg-line md:h-52">
        <img src={cur.photo!} alt={cap(cur)} className="h-full w-full object-cover" />
      </button>
      {shown.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto px-5 pt-3" aria-label={t("spot.photos")}>
          {shown.slice(0, 12).map((p, k) => (
            <li key={p.id} className="shrink-0">
              <button type="button" onClick={() => setI(k)} aria-current={k === i || undefined} aria-label={cap(p)}
                className={`block h-14 w-14 overflow-hidden rounded-xl border-2 ${k === i ? "border-ink" : "border-line"}`}>
                <img src={p.photo!} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && <PhotoLightbox photos={items} index={i} onIndex={setI} onClose={() => setOpen(false)} />}
    </div>
  );
}
