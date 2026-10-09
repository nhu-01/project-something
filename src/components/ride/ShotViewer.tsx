"use client";
import { useEffect, useRef } from "react";
import { Close } from "@/components/ui/Icons";

export type Shot = { src: string; aspect: number; label: string };

// Full-screen look at a ride snapshot. Arrow keys or the side buttons move between shots; Esc or the X closes.
export default function ShotViewer({ shots, index, onIndex, onClose }: { shots: Shot[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const startX = useRef<number | null>(null);
  const go = (d: number) => onIndex((index + d + shots.length) % shots.length);

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const s = shots[index];
  return (
    <div role="dialog" aria-modal="true" aria-label={`photo: ${s.label}`} className="fixed inset-0 z-[4000] flex flex-col items-center justify-center gap-4 bg-ink/95 p-4"
      onClick={onClose}
      onPointerDown={(e) => { startX.current = e.clientX; }}
      onPointerUp={(e) => { if (startX.current !== null && Math.abs(e.clientX - startX.current) > 50 && shots.length > 1) { e.stopPropagation(); go(e.clientX < startX.current ? 1 : -1); } startX.current = null; }}>
      {/* the frame carries gray padding on two sides; a box with the camera's own shape crops it away */}
      <div className="overflow-hidden rounded-[24px] border-4 border-paper" style={{ aspectRatio: s.aspect, height: "min(74dvh, calc(92vw / " + s.aspect + "))" }} onClick={(e) => e.stopPropagation()}>
        <img src={s.src} alt={s.label} className="h-full w-full object-cover" />
      </div>
      <p className="text-center text-[15px] text-paper">{s.label}{shots.length > 1 ? ` · ${index + 1} of ${shots.length}` : ""}</p>
      <button ref={closeBtn} type="button" onClick={onClose} aria-label="close photo" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-paper text-ink"><Close /></button>
      {shots.length > 1 && (
        <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => go(-1)} className="pill bg-paper text-ink">previous</button>
          <button type="button" onClick={() => go(1)} className="pill bg-paper text-ink">next</button>
        </div>
      )}
    </div>
  );
}
