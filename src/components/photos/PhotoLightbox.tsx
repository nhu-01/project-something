"use client";
import { useEffect, useRef } from "react";
import { Close } from "@/components/ui/Icons";
import { useI18n } from "@/lib/i18n/client";

export type LightboxPhoto = { src: string; caption: string };

// Full-screen look at a stored photo. Arrow keys, swipe or the buttons move between photos; Esc or the X closes.
export default function PhotoLightbox({ photos, index, onIndex, onClose }: { photos: LightboxPhoto[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const { t } = useI18n();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const startX = useRef<number | null>(null);
  const go = (d: number) => onIndex((index + d + photos.length) % photos.length);

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  const p = photos[index];
  return (
    <div role="dialog" aria-modal="true" aria-label={p.caption} className="fixed inset-0 z-[4000] flex flex-col items-center justify-center gap-4 bg-ink/95 p-4" onClick={onClose}
      onPointerDown={(e) => { startX.current = e.clientX; }}
      onPointerUp={(e) => { if (startX.current !== null && Math.abs(e.clientX - startX.current) > 50 && photos.length > 1) { e.stopPropagation(); go(e.clientX < startX.current ? 1 : -1); } startX.current = null; }}>
      <img src={p.src} alt={p.caption} className="max-h-[76dvh] max-w-full rounded-[24px] border-4 border-paper object-contain" onClick={(e) => e.stopPropagation()} />
      <p className="text-center text-[15px] text-paper">{p.caption}{photos.length > 1 ? ` · ${index + 1} / ${photos.length}` : ""}</p>
      <button ref={closeBtn} type="button" onClick={onClose} aria-label={t("viewer.close")} className="absolute end-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-paper text-ink"><Close /></button>
      {photos.length > 1 && (
        <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => go(-1)} className="pill bg-paper text-ink">{t("viewer.previous")}</button>
          <button type="button" onClick={() => go(1)} className="pill bg-paper text-ink">{t("viewer.next")}</button>
        </div>
      )}
    </div>
  );
}
